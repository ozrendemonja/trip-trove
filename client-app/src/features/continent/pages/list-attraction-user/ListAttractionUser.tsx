import PermanentlyClosedStatus, {
  PermanentlyClosedSince
} from "../../../../shared/attraction-status/PermanentlyClosedStatus";
import {
  Alert16Regular,
  ArrowRepeatAll16Regular,
  BuildingBank16Regular,
  Flag16Regular,
  Location20Regular,
  Pin12Filled
} from "@fluentui/react-icons";
import { DataColumn } from "../../../../shared/ui/data-table/DataTable";
import { Link, SearchBox, Text } from "@fluentui/react-components";
import { useBooleanState } from "../../../../shared/hooks/useBooleanState";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { ListCustomizer } from "../../../../shared/list-element/ListCustomizer";
import { ListElementUser } from "../../../../shared/list-element/ListElementUser";
import DateRangePicker from "../../../../shared/list-element/ui/date-picker/DateRangePicker";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import {
  AttractionVisitStatus,
  LastReadAttraction
} from "../../domain/Attraction.types";
import { AttractionUserListCustomizerConfiguration } from "../../domain/ListCustomizerConfigurations";
import { onRenderWhenNoMoreItems } from "../list-attraction/ListAttraction.config";
import {
  AttractionRow,
  ListAttractionPageInfo
} from "../list-attraction/ListAttraction.types";
import { toLastReadAttraction } from "../list-attraction/ListAttraction.util";
import { useClasses } from "./ListAttractionUser.styles";
import {
  createGetPagedAttractions,
  createGetPageInfoById,
  stringToBoolean,
  toggleQueryParam
} from "./ListAttractionUser.utils";
import { Filter } from "./ui/Filter";
import { Flex } from "../../../../shared/ui/Flex";

const renderCellContent = (
  classes: ReturnType<typeof useClasses>,
  className: string,
  atraction: AttractionRow,
  _index: number,
  column: DataColumn
): JSX.Element | string | number => {
  if (column.id === "name") {
    const permanentlyClosedAt = atraction?.permanentlyClosedAt;
    const isPermanentlyClosed = !!permanentlyClosedAt;
    const wantsReturn =
      !isPermanentlyClosed &&
      atraction?.visitStatus === AttractionVisitStatus.VISITED_WANT_RETURN;
    const visitedDone =
      atraction?.visitStatus === AttractionVisitStatus.VISITED_DONE;
    // Already been and done with it — the must-visit pin no longer applies.
    const showPin =
      !isPermanentlyClosed &&
      atraction?.mustVisit &&
      !wantsReturn &&
      !visitedDone;
    return (
      <Flex direction="row">
        <div className={classes.markerSlot}>
          {atraction && (
            <PermanentlyClosedStatus
              attractionName={atraction.name.name}
              closedAt={permanentlyClosedAt}
            />
          )}
          {wantsReturn && (
            <ArrowRepeatAll16Regular
              data-icon-name="Revisit"
              className={classes.returnIcon}
              title="Visited, would return"
            />
          )}
          {showPin && (
            <Pin12Filled data-icon-name="Pinned" className={classes.pinIcon} />
          )}
        </div>
        <Flex className="attraction-list-name-details" gap={2}>
          <Link
            data-fluent-link
            className={className}
            href={`https://www.google.com/search?q=${atraction?.name.name}`}
            target="_blank"
            rel="noopener"
            underline
          >
            <div
              className={
                isPermanentlyClosed ? "permanently-closed-list-name" : undefined
              }
            >
              {atraction?.name.name}
            </div>
            {atraction?.name.mainAttractionName && (
              <div>(part of {atraction?.name.mainAttractionName})</div>
            )}
          </Link>
          <PermanentlyClosedSince closedAt={permanentlyClosedAt} />
        </Flex>
        <Flex gap={2} direction="row">
          {atraction?.isTraditional && (
            <BuildingBank16Regular
              data-icon-name="Traditional"
              className={classes.traditionalIcon}
              title="Traditional"
            />
          )}
        </Flex>
      </Flex>
    );
  } else if (column.id === "destination") {
    return (
      <Flex direction="row">
        <Text>
          {(atraction?.destination.cityName
            ? atraction?.destination.cityName + ", "
            : "") +
            atraction?.destination.regionName +
            ", " +
            atraction?.destination.countryName}
        </Text>
        {atraction?.destination.isCountrywide && (
          <Flag16Regular data-icon-name="Flag" className={classes.flagIcon} />
        )}
      </Flex>
    );
  } else if (column.id === "address") {
    return (
      <Text>
        {atraction?.address.streetAddress && (
          <div>{atraction?.address.streetAddress}</div>
        )}
        {atraction?.address.location && (
          <div>
            (
            {atraction?.address.location.latitude +
              " " +
              atraction?.address.location.longitude}
            )
          </div>
        )}
      </Text>
    );
  } else if (column.id === "infoFrom") {
    return (
      <Flex className={classes.infoText}>
        <div>{atraction?.infoFrom.source}</div>
        <div>({atraction?.infoFrom.recorded})</div>
      </Flex>
    );
  } else if (column.id === "optimalVisitPeriod") {
    return (
      <Flex>
        {atraction?.optimalVisitPeriod && (
          <DateRangePicker
            fromDate={atraction.optimalVisitPeriod.fromDate}
            toDate={atraction.optimalVisitPeriod.toDate}
            disable={true}
          ></DateRangePicker>
        )}
      </Flex>
    );
  } else if (column.id === "tip") {
    return <Text>{atraction?.tip}</Text>;
  } else if (column.id === "category") {
    return (
      <Flex direction="row">
        <Text className={classes.categoryText}>{atraction?.category}</Text>
        {atraction?.needsBellIcon() && (
          <Alert16Regular
            data-icon-name="Ringer"
            className={
              atraction?.willChangeSoon()
                ? classes.changeSoonIcon
                : classes.changePotentialIcon
            }
          />
        )}
      </Flex>
    );
  }

  return atraction[column.accessor as keyof AttractionRow] as string;
};

const getVisitStatusRowClass = (
  classes: ReturnType<typeof useClasses>,
  row: AttractionRow
): string | undefined =>
  row.visitStatus === AttractionVisitStatus.VISITED_DONE
    ? classes.doneRow
    : undefined;

// Groups rows by how the traveller relates to each place: still-to-see first,
// then the ones worth another trip, those already seen and done, and finally
// permanently closed attractions. The infinite-scroll sentinel (null) sinks
// below every attraction.
const visitStatusRank = (row: AttractionRow | null): number => {
  if (!row) {
    return 4;
  }
  if (row.permanentlyClosedAt) {
    return 3;
  }
  switch (row.visitStatus) {
    case AttractionVisitStatus.VISITED_WANT_RETURN:
      return 1;
    case AttractionVisitStatus.VISITED_DONE:
      return 2;
    default:
      return 0;
  }
};

// Array.prototype.sort is stable, so rows keep their fetched order within a group.
const sortByVisitStatus = (items: AttractionRow[]): AttractionRow[] =>
  [...items].sort((a, b) => visitStatusRank(a) - visitStatusRank(b));

export const AttractionListUser: React.FunctionComponent = () => {
  const classes = useClasses();

  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AttractionRow[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBooleanState(true);
  const [reloadData, { toggle: toggleReloadData }] = useBooleanState(true);
  const [lastElement, setLastElement] = useState<
    LastReadAttraction | undefined
  >(undefined);
  const createAttractionCustomizer = (): ListCustomizer<AttractionRow> =>
    new ListCustomizer(
      setItems,
      setColumns,
      new AttractionUserListCustomizerConfiguration()
    );
  const [attractionCustomizer, setAttractionCustomizer] = useState(
    createAttractionCustomizer
  );

  const { whereToSearch, id } = useParams();
  const getPagedAttractions = (lastAttraction?: LastReadAttraction) =>
    createGetPagedAttractions(whereToSearch)(id, lastAttraction, {
      category: searchParams.get("category") ?? undefined,
      isCountrywide: stringToBoolean(searchParams.get("isCountrywide")),
      isTraditional: stringToBoolean(searchParams.get("isTraditional")),
      mustVisit: stringToBoolean(searchParams.get("mustVisit")),
      q: searchParams.get("q"),
      type: searchParams.get("type") ?? undefined
    });

  const [pageInfo, setPageInfo] = useState<ListAttractionPageInfo>({
    name: "",
    under: ""
  });
  useEffect(() => {
    createGetPageInfoById(whereToSearch)(id!).then(setPageInfo);
  }, []);

  useEffect(() => {
    getPagedAttractions(lastElement).then((data) => {
      setLoading();
      setLastElement(toLastReadAttraction(data));
      const attractionRows = data.map(AttractionRow.from);
      const nextCustomizer = attractionCustomizer.withPagedRows(attractionRows);
      nextCustomizer.createColumns();
      setAttractionCustomizer(nextCustomizer);
      setNotLoading();
    });
  }, [reloadData]);

  const createFilter = (param: string) => ({
    has: (value: string) =>
      searchParams.has(param) && searchParams.get(param) === value,
    onClick: (filterValue: string) => {
      toggleQueryParam(param, filterValue, searchParams, setSearchParams);
      setAttractionCustomizer(createAttractionCustomizer());
      setLastElement(undefined);
      toggleReloadData();
    }
  });

  const orderedItems = useMemo(() => sortByVisitStatus(items), [items]);

  return (
    <div className={classes.pageLayout}>
      <Navigation />
      <main className={classes.content}>
        {isLoading && <LoadingSpinner text="Updating list of attractions" />}
        {!isLoading && (
          <>
            <Flex direction="row" className={classes.pageInfo}>
              <Location20Regular data-icon-name="MapPin" />
              <Text className={classes.pageName}>{pageInfo.name}</Text>
              <Text className={classes.pageUnder}>
                {pageInfo.under && `, ${pageInfo.under}`}
              </Text>
            </Flex>
            <Flex direction="row" className={classes.root}>
              <Text as="h1" className={classes.heading}>
                Attractions
              </Text>
              <SearchBox
                placeholder="Search for name, source or tip"
                value={searchParams.get("q") ?? undefined}
                onChange={(_event, data) => {
                  if (data.value !== "") {
                    return;
                  }
                  const filter = createFilter("q");
                  if (searchParams.has("q")) {
                    filter.onClick(searchParams.get("q")!);
                  }
                }}
                onSearch={(_event, data) => {
                  createFilter("q").onClick(data.value);
                }}
                dismiss={{ role: "button", "aria-label": "Clear text" }}
                className={classes.searchBox}
              />
              <Filter
                countrywide={createFilter("isCountrywide")}
                mustVisit={createFilter("mustVisit")}
                traditional={createFilter("isTraditional")}
                category={createFilter("category")}
                type={createFilter("type")}
              ></Filter>
            </Flex>
            <div className={classes.listViewport}>
              <ListElementUser
                items={orderedItems}
                columns={columns}
                onLoadMore={(_index: number) =>
                  onRenderWhenNoMoreItems(toggleReloadData)
                }
                getRowClassName={(row) => getVisitStatusRowClass(classes, row)}
                renderCell={(
                  item: AttractionRow,
                  index: number,
                  column: DataColumn
                ) =>
                  renderCellContent(
                    classes,
                    classes.linkField,
                    item,
                    index,
                    column
                  )
                }
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AttractionListUser;
