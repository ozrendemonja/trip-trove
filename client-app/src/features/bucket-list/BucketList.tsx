import {
  Badge,
  Button,
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
  Edit20Regular,
  Star24Regular
} from "@fluentui/react-icons";
import React, { useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../shared/navigation/Navigation";
import { SearchText } from "../../shared/search-text/SearchText";
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
  getBucketListItem,
  getBucketListItems,
  updateBucketListItem,
  updateBucketListItemCompletion
} from "./BucketListApi";
import { useBucketListClasses } from "./BucketList.styles";
import {
  BucketListCursor,
  BucketListDraft,
  BucketListFilter,
  BucketListItem,
  BucketListLocationType,
  SaveBucketListItem
} from "./BucketList.types";

type BucketListSort = {
  column: "experience" | "status";
  direction: "ascending" | "descending";
};

const emptyDraft = (): BucketListDraft => ({
  name: "",
  completedOn: "",
  locationType: "none",
  locationLabel: "",
  description: ""
});

const draftFromItem = (item: BucketListItem): BucketListDraft => ({
  name: item.name,
  completedOn: item.completedOn ?? "",
  locationType:
    item.cityId != null ? "city" : item.regionId != null ? "region" : "none",
  locationLabel: item.cityName ?? item.regionName ?? "",
  cityId: item.cityId ?? undefined,
  regionId: item.regionId ?? undefined,
  description: item.description ?? "",
  tripId: item.tripId ?? undefined
});

const toRequest = (draft: BucketListDraft): SaveBucketListItem => ({
  name: draft.name.trim(),
  completedOn: draft.completedOn || undefined,
  cityId: draft.locationType === "city" ? draft.cityId : undefined,
  regionId: draft.locationType === "region" ? draft.regionId : undefined,
  description: draft.description.trim() || undefined,
  tripId: draft.completedOn ? draft.tripId : undefined
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

export const BucketList: React.FC = () => {
  const classes = useBucketListClasses();
  const pageClasses = useListPageClasses();
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [filter, setFilter] = useState<BucketListFilter>("all");
  const [sort, setSort] = useState<BucketListSort>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [lastReadItem, setLastReadItem] = useState<BucketListCursor>();
  const [hasMoreItems, setHasMoreItems] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketListItem>();
  const [draft, setDraft] = useState<BucketListDraft>(emptyDraft);
  const [formKey, setFormKey] = useState(0);
  const [itemToDelete, setItemToDelete] = useState<BucketListItem>();
  const [changingId, setChangingId] = useState<number>();
  const [completionItem, setCompletionItem] = useState<BucketListItem>();
  const [matchingTrips, setMatchingTrips] = useState<Trip[]>([]);
  const [completionDate, setCompletionDate] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<number>();
  const [isTripsLoading, setIsTripsLoading] = useState(false);
  const [tripsLoadError, setTripsLoadError] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const tripLookupId = useRef(0);

  const loadItems = async (): Promise<void> => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const firstPage = await getBucketListItems();
      setItems(firstPage);
      setLastReadItem(toCursor(firstPage));
      setHasMoreItems(firstPage.length > 0);
      setLoadMoreError(false);
    } catch {
      setLoadError(true);
      setHasMoreItems(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreItems = async (): Promise<void> => {
    if (!lastReadItem || isLoadingMore) return;

    setIsLoadingMore(true);
    setLoadMoreError(false);
    try {
      const nextPage = await getBucketListItems(lastReadItem);
      setItems((current) => {
        const loadedIds = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...nextPage.filter((item) => !loadedIds.has(item.id))
        ];
      });
      setLastReadItem(toCursor(nextPage));
      setHasMoreItems(nextPage.length > 0);
    } catch {
      setLoadMoreError(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openCreate = (): void => {
    setEditingItem(undefined);
    setDraft(emptyDraft());
    setFormKey((value) => value + 1);
    setIsEditorOpen(true);
  };

  const openEdit = (item: BucketListItem): void => {
    setEditingItem(item);
    setDraft(draftFromItem(item));
    setFormKey((value) => value + 1);
    setIsEditorOpen(true);
  };

  const closeEditor = (): void => {
    setIsEditorOpen(false);
    setEditingItem(undefined);
  };

  const saveItem = async (): Promise<void> => {
    if (editingItem) {
      await updateBucketListItem(editingItem.id, toRequest(draft));
    } else {
      await createBucketListItem(toRequest(draft));
    }
    await loadItems();
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
    setCompletionItem(item);
    setMatchingTrips([]);
    setCompletionDate("");
    setSelectedTripId(undefined);
    setIsTripsLoading(false);
    setTripsLoadError(false);
    setCompletionError(false);
  };

  const closeCompletionDialog = (): void => {
    tripLookupId.current += 1;
    setCompletionItem(undefined);
    setMatchingTrips([]);
    setCompletionDate("");
    setSelectedTripId(undefined);
    setIsTripsLoading(false);
    setTripsLoadError(false);
    setCompletionError(false);
  };

  const changeCompletion = async (
    item: BucketListItem,
    completedOn?: string,
    tripId?: number
  ): Promise<boolean> => {
    setChangingId(item.id);
    try {
      await updateBucketListItemCompletion(item.id, {
        completedOn: item.completedOn ? undefined : completedOn,
        tripId: item.completedOn ? undefined : tripId
      });
      const updatedItem = await getBucketListItem(item.id);
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === updatedItem.id ? updatedItem : candidate
        )
      );
      return true;
    } catch {
      return false;
    } finally {
      setChangingId(undefined);
    }
  };

  const completeItem = async (): Promise<void> => {
    if (!completionItem) return;

    setCompletionError(false);
    const tripId =
      matchingTrips.length === 1 ? matchingTrips[0].id : selectedTripId;
    if (
      completionDate &&
      tripId !== undefined &&
      (await changeCompletion(completionItem, completionDate, tripId))
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

  const visibleItems = items
    .filter((item) => {
      if (filter === "todo") return !item.completedOn;
      if (filter === "completed") return !!item.completedOn;
      return true;
    })
    .sort((first, second) => {
      if (!sort) return 0;

      const firstValue =
        sort.column === "experience" ? first.name : getStatus(first);
      const secondValue =
        sort.column === "experience" ? second.name : getStatus(second);
      const comparison = firstValue.localeCompare(secondValue, undefined, {
        sensitivity: "base"
      });

      return sort.direction === "ascending" ? comparison : -comparison;
    });
  const todoCount = items.filter((item) => !item.completedOn).length;
  const completedCount = items.length - todoCount;
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
  const completionTripId =
    matchingTrips.length === 1 ? matchingTrips[0].id : selectedTripId;

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
            onTabSelect={(_event, data) =>
              setFilter(data.value as BucketListFilter)
            }
          >
            <Tab value="all">All ({items.length})</Tab>
            <Tab value="todo">To do ({todoCount})</Tab>
            <Tab value="completed">Completed ({completedCount})</Tab>
          </TabList>

          {loadError && (
            <MessageBar intent="error" className={classes.errorBar}>
              <MessageBarBody>Bucket list could not be loaded.</MessageBarBody>
              <MessageBarActions>
                <Button
                  appearance="transparent"
                  onClick={() => void loadItems()}
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
          {!isLoading && !loadError && visibleItems.length > 0 && (
            <div className={classes.tableViewport}>
              <Table className={classes.table} aria-label="Bucket list items">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell
                      aria-sort={
                        sort?.column === "experience" ? sort.direction : "none"
                      }
                      style={{ width: "29%" }}
                    >
                      <Button
                        appearance="subtle"
                        className={classes.sortButton}
                        aria-label="Experience"
                        onClick={() => changeSort("experience")}
                      >
                        Experience
                        {sort?.column === "experience"
                          ? sort.direction === "ascending"
                            ? " ↑"
                            : " ↓"
                          : null}
                      </Button>
                    </TableHeaderCell>
                    <TableHeaderCell
                      aria-sort={
                        sort?.column === "status" ? sort.direction : "none"
                      }
                      style={{ width: "15%" }}
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
                    <TableHeaderCell style={{ width: "20%" }}>
                      Completed
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "36%" }}>
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
                        <Flex className={classes.nameCell} gap={2}>
                          <Text
                            className={
                              item.completedOn
                                ? classes.completedName
                                : classes.name
                            }
                          >
                            {item.name}
                          </Text>
                        </Flex>
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
                        </Flex>
                      </TableCell>
                      <TableCell>
                        <Text
                          className={
                            item.description
                              ? classes.description
                              : classes.muted
                          }
                        >
                          {item.description || "No notes yet"}
                        </Text>
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
                                  void changeCompletion(item);
                                } else {
                                  openCompletionDialog(item);
                                }
                              }}
                            />
                          </Tooltip>
                          <Tooltip
                            content={`Edit ${item.name}`}
                            relationship="label"
                          >
                            <Button
                              appearance="subtle"
                              className={classes.iconButton}
                              icon={<Edit20Regular />}
                              onClick={() => openEdit(item)}
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
                ? `Complete ${completionItem.name}`
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
                    The item could not be marked as completed.
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
                  ? "Completing..."
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
        text={editingItem?.name ?? "bucket list item"}
        title={
          editingItem ? `Edit ${editingItem.name}` : "Add bucket list item"
        }
        editIconAriaLabel="Edit bucket list item"
        isOpen={isEditorOpen}
        onDismiss={closeEditor}
        isFormValid={isFormValid}
        onUpdateClick={saveItem}
        submitText={editingItem ? "Update" : "Create"}
        pendingSubmitText={editingItem ? "Updating..." : "Creating..."}
        saveErrorMessage="The bucket list item wasn't saved. Your details are still here, so you can try again."
        submitErrorResetKey={`${draft.name}\u0000${draft.completedOn}\u0000${draft.locationType}\u0000${draft.locationLabel}\u0000${draft.description}\u0000${draft.tripId ?? ""}`}
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
            <SearchText
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
            <SearchText
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
          setItems((current) =>
            current.filter((item) => item.id !== itemToDelete.id)
          );
          setItemToDelete(undefined);
        }}
      />
    </div>
  );
};

export default BucketList;
