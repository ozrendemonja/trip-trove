import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Radio,
  RadioGroup,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Tooltip
} from "@fluentui/react-components";
import {
  Add24Regular,
  ArrowDown20Regular,
  ArrowReset20Regular,
  CheckmarkCircle20Regular,
  Delete20Regular,
  Edit16Regular,
  Location16Regular,
  Star24Regular
} from "@fluentui/react-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../shared/navigation/Navigation";
import { AutocompleteField } from "../../shared/autocomplete-field/AutocompleteField";
import { Flex } from "../../shared/ui/Flex";
import { DateInput } from "../../shared/ui/forms/DateInput";
import { InputField } from "../../shared/ui/forms/InputField";
import { SelectField } from "../../shared/ui/forms/SelectField";
import ConfirmDeleteDialog from "../../shared/list-element/ui/delete-dialog/ConfirmDeleteDialog";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import { useListPageClasses } from "../../shared/list-element/ListPage.styles";
import { searchCity, searchRegion } from "../continent/infra/ManagerApi";
import type { Trip } from "../my-trip/domain/Trip.types";
import { fetchTripsContainingDate } from "../my-trip/infra/TripApi";
import {
  createBucketListItem,
  deleteBucketListItem,
  getBucketListCounts,
  getBucketListItems,
  updateBucketListItemCompletion
} from "./BucketListApi";
import { useBucketListClasses } from "./BucketList.styles";
import {
  BucketListCounts,
  BucketListCursor,
  BucketListDraft,
  BucketListFilter,
  BucketListItem,
  BucketListLocationType,
  SaveBucketListItem
} from "./BucketList.types";
import EditBucketListItemDescription from "./EditBucketListItemDescription";
import EditBucketListItemLocation from "./EditBucketListItemLocation";
import EditBucketListItemName from "./EditBucketListItemName";

type BucketListSort = {
  column: "name" | "status";
  direction: "ascending" | "descending";
};

const emptyDraft = (): BucketListDraft => ({
  name: "",
  locationType: "none",
  locationLabel: "",
  description: ""
});

const toRequest = (draft: BucketListDraft): SaveBucketListItem => ({
  name: draft.name.trim(),
  cityId: draft.locationType === "city" ? draft.cityId : undefined,
  regionId: draft.locationType === "region" ? draft.regionId : undefined,
  description: draft.description.trim() || undefined
});

const formatDate = (value?: string | null): string => {
  if (!value) return "Not completed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
};

const dateFromValue = (value: string): Date | undefined => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const valueFromDate = (date?: Date | null): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStatus = (item: BucketListItem): string =>
  item.completedOn ? "Completed" : "To do";

const toCursor = (items: BucketListItem[]): BucketListCursor | undefined => {
  const lastItem = items.at(-1);
  return lastItem
    ? { id: lastItem.id, changedOn: lastItem.changedOn }
    : undefined;
};

const advancesDescendingCursor = (
  previous: BucketListCursor,
  next: BucketListCursor
): boolean =>
  next.changedOn < previous.changedOn ||
  (next.changedOn === previous.changedOn && next.id < previous.id);

const matchesFilter = (
  item: Pick<BucketListItem, "completedOn">,
  filter: BucketListFilter
): boolean =>
  filter === "all" ||
  (filter === "todo" && !item.completedOn) ||
  (filter === "completed" && !!item.completedOn);

const formatCount = (count: number | undefined): string =>
  count === undefined ? "..." : String(count);

const BucketList: React.FC = () => {
  const classes = useBucketListClasses();
  const pageClasses = useListPageClasses();
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [counts, setCounts] = useState<BucketListCounts>();
  const [filter, setFilter] = useState<BucketListFilter>("all");
  const [sort, setSort] = useState<BucketListSort>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [countsError, setCountsError] = useState(false);
  const [isCountsLoading, setIsCountsLoading] = useState(true);
  const [hasMoreItems, setHasMoreItems] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<BucketListDraft>(emptyDraft);
  const [formKey, setFormKey] = useState(0);
  const [itemToDelete, setItemToDelete] = useState<BucketListItem>();
  const [changingId, setChangingId] = useState<number>();
  const [completionItem, setCompletionItem] = useState<BucketListItem>();
  const [matchingTrips, setMatchingTrips] = useState<Trip[]>([]);
  const [completionDate, setCompletionDate] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<number>();
  const [wouldRepeat, setWouldRepeat] = useState(false);
  const [isTripsLoading, setIsTripsLoading] = useState(false);
  const [tripsLoadError, setTripsLoadError] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const tripLookupId = useRef(0);
  const generation = useRef(0);
  const activeFilter = useRef<BucketListFilter>("all");
  const cursor = useRef<BucketListCursor>();
  const loadMoreInFlight = useRef(false);
  const countsRequest = useRef(0);

  const loadCountsForGeneration = useCallback(
    async (expectedGeneration: number): Promise<void> => {
      const request = ++countsRequest.current;
      setIsCountsLoading(true);
      setCountsError(false);
      try {
        const nextCounts = await getBucketListCounts();
        if (
          generation.current === expectedGeneration &&
          countsRequest.current === request
        ) {
          setCounts(nextCounts);
        }
      } catch {
        if (
          generation.current === expectedGeneration &&
          countsRequest.current === request
        ) {
          setCountsError(true);
        }
      } finally {
        if (
          generation.current === expectedGeneration &&
          countsRequest.current === request
        ) {
          setIsCountsLoading(false);
        }
      }
    },
    []
  );

  const startGeneration = useCallback(
    async (
      nextFilter: BucketListFilter,
      preserveItems = false
    ): Promise<void> => {
      const nextGeneration = ++generation.current;
      activeFilter.current = nextFilter;
      cursor.current = undefined;
      loadMoreInFlight.current = false;

      setIsLoading(true);
      setLoadError(false);
      setLoadMoreError(false);
      setIsLoadingMore(false);
      setHasMoreItems(false);
      if (!preserveItems) {
        setItems([]);
      }

      const loadFirstPage = async (): Promise<void> => {
        try {
          const firstPage = await getBucketListItems(nextFilter);
          if (generation.current !== nextGeneration) return;

          cursor.current = toCursor(firstPage);
          setItems(firstPage);
          setHasMoreItems(firstPage.length > 0);
        } catch {
          if (generation.current !== nextGeneration) return;
          setLoadError(true);
          setHasMoreItems(false);
        } finally {
          if (generation.current === nextGeneration) {
            setIsLoading(false);
          }
        }
      };

      await Promise.all([
        loadFirstPage(),
        loadCountsForGeneration(nextGeneration)
      ]);
    },
    [loadCountsForGeneration]
  );

  const loadMoreItems = async (): Promise<void> => {
    const after = cursor.current;
    if (!after || loadMoreInFlight.current) return;

    const expectedGeneration = generation.current;
    const expectedFilter = activeFilter.current;
    loadMoreInFlight.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);
    try {
      const nextPage = await getBucketListItems(expectedFilter, after);
      if (generation.current !== expectedGeneration) return;

      if (nextPage.length === 0) {
        cursor.current = undefined;
        setHasMoreItems(false);
        return;
      }

      const nextCursor = toCursor(nextPage);
      if (!nextCursor) {
        throw new Error("Bucket list continuation did not provide a cursor");
      }
      if (!advancesDescendingCursor(after, nextCursor)) {
        throw new Error("Bucket list continuation did not advance");
      }

      setItems((current) => {
        const loadedIds = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...nextPage.filter((item) => !loadedIds.has(item.id))
        ];
      });
      cursor.current = nextCursor;
      setHasMoreItems(true);
    } catch {
      if (generation.current === expectedGeneration) {
        setLoadMoreError(true);
      }
    } finally {
      if (generation.current === expectedGeneration) {
        loadMoreInFlight.current = false;
        setIsLoadingMore(false);
      }
    }
  };

  const refreshItem = async (): Promise<void> =>
    startGeneration(activeFilter.current, true);

  useEffect(() => {
    void startGeneration("all");
    return () => {
      generation.current += 1;
    };
  }, [startGeneration]);

  const openCreate = (): void => {
    setDraft(emptyDraft());
    setFormKey((value) => value + 1);
    setIsEditorOpen(true);
  };

  const closeEditor = (): void => {
    setIsEditorOpen(false);
  };

  const saveItem = async (): Promise<void> => {
    await createBucketListItem(toRequest(draft));
    await startGeneration(activeFilter.current, true);
  };

  const loadTripsForCompletion = async (date: string): Promise<void> => {
    const lookupId = ++tripLookupId.current;
    setIsTripsLoading(true);
    setTripsLoadError(false);
    try {
      const loadedTrips = await fetchTripsContainingDate(date);
      if (tripLookupId.current === lookupId) {
        setMatchingTrips(loadedTrips);
      }
    } catch {
      if (tripLookupId.current === lookupId) {
        setTripsLoadError(true);
      }
    } finally {
      if (tripLookupId.current === lookupId) {
        setIsTripsLoading(false);
      }
    }
  };

  const openCompletionDialog = (item: BucketListItem): void => {
    tripLookupId.current += 1;
    const completedOn = item.completedOn ?? "";
    setCompletionItem(item);
    setMatchingTrips([]);
    setCompletionDate(completedOn);
    setSelectedTripId(item.tripId ?? undefined);
    setWouldRepeat(item.wouldRepeat ?? false);
    setIsTripsLoading(false);
    setTripsLoadError(false);
    setCompletionError(false);
    if (completedOn) {
      void loadTripsForCompletion(completedOn);
    }
  };

  const closeCompletionDialog = (): void => {
    tripLookupId.current += 1;
    setCompletionItem(undefined);
    setMatchingTrips([]);
    setCompletionDate("");
    setSelectedTripId(undefined);
    setWouldRepeat(false);
    setIsTripsLoading(false);
    setTripsLoadError(false);
    setCompletionError(false);
  };

  const changeCompletion = async (
    item: BucketListItem,
    completedOn?: string,
    tripId?: number,
    wouldRepeat: boolean | null = null
  ): Promise<boolean> => {
    setChangingId(item.id);
    try {
      await updateBucketListItemCompletion(item.id, {
        completedOn,
        tripId,
        wouldRepeat
      });
      const wasCompleted = !!item.completedOn;
      const isCompleted = !!completedOn;
      if (wasCompleted !== isCompleted) {
        setCounts((current) =>
          current
            ? {
                all: current.all,
                todo: current.todo + (isCompleted ? -1 : 1),
                completed: current.completed + (isCompleted ? 1 : -1)
              }
            : current
        );
      }
      if (!matchesFilter({ completedOn }, activeFilter.current)) {
        setItems((current) =>
          current.filter((currentItem) => currentItem.id !== item.id)
        );
      }
      await startGeneration(activeFilter.current, true);
      return true;
    } catch {
      return false;
    } finally {
      setChangingId(undefined);
    }
  };

  const completionTripId =
    matchingTrips.length === 1 ? matchingTrips[0].id : selectedTripId;

  const completeItem = async (): Promise<void> => {
    if (!completionItem) return;

    setCompletionError(false);
    if (
      completionDate &&
      completionTripId !== undefined &&
      (await changeCompletion(
        completionItem,
        completionDate,
        completionTripId,
        wouldRepeat
      ))
    ) {
      closeCompletionDialog();
    } else {
      setCompletionError(true);
    }
  };

  const changeSort = (column: BucketListSort["column"]): void => {
    setSort((current) => ({
      column,
      direction:
        current?.column === column && current.direction === "ascending"
          ? "descending"
          : "ascending"
    }));
  };

  const visibleItems = sort
    ? [...items].sort((first, second) => {
        const firstValue =
          sort.column === "name" ? first.name : getStatus(first);
        const secondValue =
          sort.column === "name" ? second.name : getStatus(second);
        const comparison = firstValue.localeCompare(secondValue, undefined, {
          sensitivity: "base"
        });

        return sort.direction === "ascending" ? comparison : -comparison;
      })
    : items;
  const locationIsValid =
    draft.locationType === "none" ||
    (draft.locationType === "city" && draft.cityId !== undefined) ||
    (draft.locationType === "region" && draft.regionId !== undefined);
  const isFormValid =
    draft.name.trim().length > 0 &&
    draft.name.length <= 256 &&
    draft.description.length <= 4096 &&
    locationIsValid;
  const tripChoices = matchingTrips.map((trip) => ({
    value: trip.id,
    label: trip.name
  }));
  const isEditingCompletion = !!completionItem?.completedOn;

  return (
    <div className={pageClasses.pageLayout}>
      <Navigation />
      <main className={pageClasses.content}>
        <section
          className={classes.surface}
          aria-labelledby="bucket-list-title"
        >
          <div className={classes.header}>
            <Flex gap={2}>
              <Text as="h1" id="bucket-list-title" className={classes.title}>
                Bucket list
              </Text>
              <Text className={classes.subtitle}>
                Ideas to experience, and memories worth keeping.
              </Text>
            </Flex>
            <Button
              appearance="primary"
              className={classes.addButton}
              icon={<Add24Regular />}
              onClick={openCreate}
            >
              Add item
            </Button>
          </div>

          <TabList
            className={classes.tabs}
            selectedValue={filter}
            aria-busy={isCountsLoading}
            onTabSelect={(_event, data) => {
              const nextFilter = data.value as BucketListFilter;
              if (nextFilter === activeFilter.current) return;
              setFilter(nextFilter);
              void startGeneration(nextFilter);
            }}
          >
            <Tab value="all">All ({formatCount(counts?.all)})</Tab>
            <Tab value="todo">To do ({formatCount(counts?.todo)})</Tab>
            <Tab value="completed">
              Completed ({formatCount(counts?.completed)})
            </Tab>
          </TabList>

          {countsError && (
            <MessageBar intent="error" className={classes.errorBar}>
              <MessageBarBody>
                Bucket list counters could not be loaded.
              </MessageBarBody>
              <MessageBarActions>
                <Button
                  appearance="transparent"
                  onClick={() =>
                    void loadCountsForGeneration(generation.current)
                  }
                >
                  Retry counters
                </Button>
              </MessageBarActions>
            </MessageBar>
          )}
          {loadError && (
            <MessageBar intent="error" className={classes.errorBar}>
              <MessageBarBody>Bucket list could not be loaded.</MessageBarBody>
              <MessageBarActions>
                <Button
                  appearance="transparent"
                  onClick={() =>
                    void startGeneration(activeFilter.current, true)
                  }
                >
                  Retry
                </Button>
              </MessageBarActions>
            </MessageBar>
          )}
          {isLoading && <LoadingSpinner text="Loading bucket list" />}
          {!isLoading && !loadError && visibleItems.length === 0 && (
            <Flex
              className={classes.emptyState}
              align="center"
              justify="center"
              gap={12}
            >
              <Star24Regular className={classes.emptyIcon} />
              <Text weight="semibold">
                {filter === "all"
                  ? "Your bucket list is ready for its first idea."
                  : `No ${filter === "todo" ? "to-do" : "completed"} items yet.`}
              </Text>
              {filter === "all" && (
                <Button
                  appearance="primary"
                  icon={<Add24Regular />}
                  onClick={openCreate}
                >
                  Add first item
                </Button>
              )}
            </Flex>
          )}
          {visibleItems.length > 0 && (
            <div className={classes.tableViewport}>
              <Table className={classes.table} aria-label="Bucket list items">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell
                      aria-sort={
                        sort?.column === "name" ? sort.direction : "none"
                      }
                      style={{ width: "22%" }}
                    >
                      <Button
                        appearance="subtle"
                        className={classes.sortButton}
                        aria-label="Name"
                        onClick={() => changeSort("name")}
                      >
                        Name
                        {sort?.column === "name"
                          ? sort.direction === "ascending"
                            ? " ↑"
                            : " ↓"
                          : null}
                      </Button>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "20%" }}>
                      Location
                    </TableHeaderCell>
                    <TableHeaderCell
                      aria-sort={
                        sort?.column === "status" ? sort.direction : "none"
                      }
                      style={{ width: "12%" }}
                    >
                      <Button
                        appearance="subtle"
                        className={classes.sortButton}
                        aria-label="Status"
                        onClick={() => changeSort("status")}
                      >
                        Status
                        {sort?.column === "status"
                          ? sort.direction === "ascending"
                            ? " ↑"
                            : " ↓"
                          : null}
                      </Button>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "19%" }}>
                      Completed
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "27%" }}>
                      Notes
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "120px" }}>
                      Actions
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className={classes.editableCell}>
                          <Text
                            className={
                              item.completedOn
                                ? classes.completedName
                                : classes.name
                            }
                          >
                            {item.name}
                          </Text>
                          <EditBucketListItemName
                            item={item}
                            onUpdated={refreshItem}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={classes.editableCell}>
                          <div className={classes.locationDetails}>
                            <Location16Regular
                              className={classes.locationIcon}
                              aria-hidden="true"
                            />
                            <Flex gap={2}>
                              <Text
                                className={
                                  item.cityName || item.regionName
                                    ? classes.location
                                    : classes.muted
                                }
                              >
                                {item.cityName ?? item.regionName ?? "Anywhere"}
                              </Text>
                              {(item.cityName || item.regionName) && (
                                <Text className={classes.locationType}>
                                  {item.cityName ? "City" : "Region"}
                                </Text>
                              )}
                            </Flex>
                          </div>
                          <EditBucketListItemLocation
                            item={item}
                            onUpdated={refreshItem}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          appearance="tint"
                          color={item.completedOn ? "success" : "informative"}
                        >
                          {getStatus(item)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={classes.editableCell}>
                          <Flex gap={2}>
                            <Text
                              className={
                                !item.completedOn ? classes.muted : undefined
                              }
                            >
                              {formatDate(item.completedOn)}
                            </Text>
                            {item.tripName && (
                              <Text className={classes.tripName}>
                                {item.tripName}
                              </Text>
                            )}
                            {item.completedOn && (
                              <Text size={200}>
                                {item.wouldRepeat === true
                                  ? "Would do again"
                                  : item.wouldRepeat === false
                                    ? "Would not do again"
                                    : "Repeat: not answered"}
                              </Text>
                            )}
                          </Flex>
                          <Tooltip
                            content={`Change completion details for ${item.name}`}
                            relationship="label"
                          >
                            <Button
                              appearance="subtle"
                              className={classes.propertyEditButton}
                              data-list-edit-trigger
                              icon={<Edit16Regular />}
                              onClick={() => openCompletionDialog(item)}
                            />
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={classes.editableCell}>
                          <Text
                            className={
                              item.description
                                ? classes.description
                                : classes.muted
                            }
                          >
                            {item.description || "No notes yet"}
                          </Text>
                          <EditBucketListItemDescription
                            item={item}
                            onUpdated={refreshItem}
                          />
                        </div>
                      </TableCell>
                      <TableCell className={classes.actions}>
                        <Flex direction="row" gap={4}>
                          <Tooltip
                            content={
                              item.completedOn
                                ? "Move back to bucket list"
                                : "Mark as completed"
                            }
                            relationship="label"
                          >
                            <Button
                              appearance="subtle"
                              className={classes.iconButton}
                              icon={
                                item.completedOn ? (
                                  <ArrowReset20Regular />
                                ) : (
                                  <CheckmarkCircle20Regular />
                                )
                              }
                              disabled={changingId === item.id}
                              onClick={() => {
                                if (item.completedOn) {
                                  void changeCompletion(
                                    item,
                                    undefined,
                                    undefined
                                  );
                                } else {
                                  openCompletionDialog(item);
                                }
                              }}
                            />
                          </Tooltip>
                          <Tooltip
                            content={`Delete ${item.name}`}
                            relationship="label"
                          >
                            <Button
                              appearance="subtle"
                              className={classes.iconButton}
                              icon={<Delete20Regular />}
                              onClick={() => setItemToDelete(item)}
                            />
                          </Tooltip>
                        </Flex>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && !loadError && hasMoreItems && (
            <div className={classes.pagination}>
              {loadMoreError && (
                <Text role="alert" className={classes.paginationError}>
                  More bucket list items could not be loaded.
                </Text>
              )}
              <Button
                appearance="secondary"
                icon={<ArrowDown20Regular />}
                disabled={isLoadingMore}
                onClick={() => void loadMoreItems()}
              >
                {isLoadingMore
                  ? "Loading..."
                  : loadMoreError
                    ? "Retry"
                    : "Load more"}
              </Button>
            </div>
          )}
        </section>
      </main>

      <Dialog
        open={completionItem !== undefined}
        onOpenChange={(_event, data) => {
          if (!data.open && changingId !== completionItem?.id) {
            closeCompletionDialog();
          }
        }}
      >
        <DialogSurface className={classes.completionDialog}>
          <DialogBody>
            <DialogTitle>
              {completionItem
                ? isEditingCompletion
                  ? `Edit completion for ${completionItem.name}`
                  : `Complete ${completionItem.name}`
                : "Complete bucket list item"}
            </DialogTitle>
            <DialogContent className={classes.completionContent}>
              <DateInput
                label="Completed on"
                placeholder="Select completion date..."
                aria-label="Select completion date"
                value={dateFromValue(completionDate)}
                maxDate={new Date()}
                required
                allowTextInput
                onChange={(date) => {
                  const selectedDate = valueFromDate(date);
                  setCompletionDate(selectedDate);
                  setMatchingTrips([]);
                  setSelectedTripId(undefined);
                  setTripsLoadError(false);
                  setCompletionError(false);
                  if (selectedDate) {
                    void loadTripsForCompletion(selectedDate);
                  } else {
                    tripLookupId.current += 1;
                    setIsTripsLoading(false);
                  }
                }}
              />
              <Checkbox
                label="Would do again"
                checked={wouldRepeat}
                disabled={changingId === completionItem?.id}
                onChange={(_event, data) => {
                  setWouldRepeat(data.checked === true);
                  setCompletionError(false);
                }}
              />
              {isTripsLoading && (
                <Text className={classes.muted}>Finding trip...</Text>
              )}
              {!isTripsLoading && matchingTrips.length === 1 && (
                <Field label="Trip">
                  <Text weight="semibold">{matchingTrips[0].name}</Text>
                </Field>
              )}
              {!isTripsLoading && matchingTrips.length > 1 && (
                <SelectField
                  label="Trip"
                  placeholder="Select a trip"
                  required
                  choices={tripChoices}
                  selectedValue={selectedTripId}
                  onOptionSelect={(_event, choice) => {
                    setSelectedTripId(
                      choice ? Number(choice.value) : undefined
                    );
                    setCompletionError(false);
                  }}
                />
              )}
              {!isTripsLoading &&
                !tripsLoadError &&
                completionDate &&
                matchingTrips.length === 0 && (
                  <MessageBar intent="warning">
                    <MessageBarBody>No trip includes this date.</MessageBarBody>
                  </MessageBar>
                )}
              {tripsLoadError && (
                <MessageBar intent="error">
                  <MessageBarBody>Trips could not be loaded.</MessageBarBody>
                  <MessageBarActions>
                    <Button
                      onClick={() =>
                        void loadTripsForCompletion(completionDate)
                      }
                    >
                      Retry
                    </Button>
                  </MessageBarActions>
                </MessageBar>
              )}
              {completionError && (
                <MessageBar intent="error">
                  <MessageBarBody>
                    The completion details could not be saved.
                  </MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                disabled={
                  isTripsLoading ||
                  tripsLoadError ||
                  !completionDate ||
                  completionTripId === undefined ||
                  changingId === completionItem?.id
                }
                onClick={() => void completeItem()}
              >
                {changingId === completionItem?.id
                  ? "Saving..."
                  : isEditingCompletion
                    ? "Save"
                    : "Mark completed"}
              </Button>
              <Button
                appearance="secondary"
                disabled={changingId === completionItem?.id}
                onClick={closeCompletionDialog}
              >
                Cancel
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <EditProperty
        text="bucket list item"
        title="Add bucket list item"
        editIconAriaLabel="Edit bucket list item"
        isOpen={isEditorOpen}
        onDismiss={closeEditor}
        isFormValid={isFormValid}
        onUpdateClick={saveItem}
        submitText="Create"
        pendingSubmitText="Creating..."
        saveErrorMessage="The bucket list item wasn't saved. Your details are still here, so you can try again."
        submitErrorResetKey={`${draft.name}\u0000${draft.locationType}\u0000${draft.locationLabel}\u0000${draft.description}`}
        contentClassName={classes.form}
      >
        <Flex gap={16}>
          <InputField
            label="Name"
            placeholder="e.g. Paragliding"
            value={draft.name}
            maxLength={256}
            required
            showRequiredIndicator
            onChange={(_event, value) =>
              setDraft((current) => ({ ...current, name: value ?? "" }))
            }
          />
          <Field label="Location" className={classes.locationField}>
            <RadioGroup
              className={classes.locationOptions}
              value={draft.locationType}
              onChange={(_event, data) =>
                setDraft((current) => ({
                  ...current,
                  locationType: data.value as BucketListLocationType,
                  locationLabel: "",
                  cityId: undefined,
                  regionId: undefined
                }))
              }
            >
              <Radio value="none" label="Anywhere" />
              <Radio value="city" label="City" />
              <Radio value="region" label="Region" />
            </RadioGroup>
          </Field>
          {draft.locationType === "city" && (
            <AutocompleteField
              key={`${formKey}-city`}
              label="City"
              placeholder="Type at least 3 characters"
              required
              showRequiredIndicator
              initialValue={
                draft.cityId !== undefined ? draft.locationLabel : undefined
              }
              getSuggestions={searchCity}
              onSelectItem={(cityId) =>
                setDraft((current) => ({ ...current, cityId }))
              }
              onSelectValue={(locationLabel) =>
                setDraft((current) => ({ ...current, locationLabel }))
              }
              suggestionsInFlow
              className={classes.search}
            />
          )}
          {draft.locationType === "region" && (
            <AutocompleteField
              key={`${formKey}-region`}
              label="Region"
              placeholder="Type at least 3 characters"
              required
              showRequiredIndicator
              initialValue={
                draft.regionId !== undefined ? draft.locationLabel : undefined
              }
              getSuggestions={searchRegion}
              onSelectItem={(regionId) =>
                setDraft((current) => ({ ...current, regionId }))
              }
              onSelectValue={(locationLabel) =>
                setDraft((current) => ({ ...current, locationLabel }))
              }
              suggestionsInFlow
              className={classes.search}
            />
          )}
          <InputField
            label="Description"
            placeholder="How was it? What made it memorable?"
            value={draft.description}
            maxLength={4096}
            multiline
            rows={4}
            onChange={(_event, value) =>
              setDraft((current) => ({
                ...current,
                description: value ?? ""
              }))
            }
          />
        </Flex>
      </EditProperty>

      <ConfirmDeleteDialog
        name={itemToDelete?.name ?? "bucket list item"}
        hidden={!itemToDelete}
        onDismiss={() => setItemToDelete(undefined)}
        onConfirm={async () => {
          if (!itemToDelete) return;
          await deleteBucketListItem(itemToDelete.id);
          setCounts((current) =>
            current
              ? {
                  all: current.all - 1,
                  todo: current.todo - (itemToDelete.completedOn ? 0 : 1),
                  completed:
                    current.completed - (itemToDelete.completedOn ? 1 : 0)
                }
              : current
          );
          setItems((current) =>
            current.filter((item) => item.id !== itemToDelete.id)
          );
          setItemToDelete(undefined);
          await startGeneration(activeFilter.current, true);
        }}
      />
    </div>
  );
};

export default BucketList;
