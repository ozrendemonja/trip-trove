import {
  DataColumn,
  DataSelection
} from "../../../../shared/ui/data-table/DataTable";
import { SelectChoice } from "../../../../shared/ui/forms/SelectField";
import { Link, Text } from "@fluentui/react-components";
import { Flag16Regular } from "@fluentui/react-icons";
import { useBooleanState } from "../../../../shared/hooks/useBooleanState";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ListElement from "../../../../shared/list-element/ListElement";
import { ListCustomizer } from "../../../../shared/list-element/ListCustomizer";
import { useListPageClasses } from "../../../../shared/list-element/ListPage.styles";
import { useListReload } from "../../../../shared/list-element/UseListReload";
import DateRangePicker from "../../../../shared/list-element/ui/date-picker/DateRangePicker";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { deleteRows } from "../../domain/Attraction";
import { LastReadAttraction } from "../../domain/Attraction.types";
import { OrderOptions } from "../../domain/Continent.types";
import { AttractionListCustomizerConfiguration } from "../../domain/ListCustomizerConfigurations";
import { Suggestion } from "../../domain/Suggestion.types.";
import {
  getAttractionById,
  getPagedAttractions,
  searchAttraction,
  setAttractionPermanentlyClosed
} from "../../infra/ManagerApi";
import EditAttractionAddress from "./EditAttractionAddress";
import EditAttractionCategory from "./EditAttractionCategory";
import EditAttractionDestination from "./EditAttractionDestination";
import EditAttractionInfoFromDetails from "./EditAttractionInfoFromDetails";
import EditAttractionMustVisit from "./EditAttractionMustVisit";
import EditAttractionTip from "./EditAttractionTip";
import EditAttractionTraditional from "./EditAttractionTraditional";
import EditAttractionType from "./EditAttractionType";
import EditAttractionVisitPeriod from "./EditAttractionVisitPeriod";
import EditPropertyAttractionDetails from "./EditPropertyAttractionDetails";
import { listHeader, onRenderWhenNoMoreItems } from "./ListAttraction.config";
import { useClasses } from "./ListAttraction.styles";
import { AttractionRow } from "./ListAttraction.types";
import { toLastReadAttraction } from "./ListAttraction.util";
import PermanentlyClosedStatus, {
  PermanentlyClosedSince
} from "../../../../shared/attraction-status/PermanentlyClosedStatus";
import { Flex } from "../../../../shared/ui/Flex";

const renderCellContent = (
  className: string,
  countrywideFlagClassName: string,
  onUpdateClick: () => void,
  onClosureChange: (attractionId: number, permanentlyClosedAt?: string) => void,
  atraction: AttractionRow,
  _index: number,
  column: DataColumn
): React.ReactNode => {
  if (column.id === "name") {
    const permanentlyClosedAt = atraction?.permanentlyClosedAt;
    return (
      <Flex
        className="attraction-list-name-cell"
        gap={10}
        direction="row"
        align="center"
      >
        {atraction && (
          <PermanentlyClosedStatus
            attractionName={atraction.name.name}
            closedAt={permanentlyClosedAt}
            onChange={(isClosed) => {
              void setAttractionPermanentlyClosed(atraction.id, isClosed)
                .then(() =>
                  onClosureChange(
                    atraction.id,
                    isClosed ? new Date().toISOString() : undefined
                  )
                )
                .catch((error) =>
                  console.error(
                    "Failed to save attraction closure status",
                    atraction.id,
                    error
                  )
                );
            }}
          />
        )}
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
                permanentlyClosedAt ? "permanently-closed-list-name" : undefined
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
        <EditPropertyAttractionDetails
          attractionId={atraction!.id}
          text={atraction!.name.name}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "destination") {
    return (
      <Flex gap={10} direction="row">
        <Text>
          {(atraction?.destination.cityName
            ? atraction?.destination.cityName + ", "
            : "") +
            atraction?.destination.regionName +
            ", " +
            atraction?.destination.countryName}
        </Text>
        {atraction?.destination.isCountrywide && (
          <Flag16Regular className={countrywideFlagClassName} />
        )}
        <EditAttractionDestination
          attractionId={atraction!.id}
          destination={atraction!.destination}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "address") {
    return (
      <Flex gap={15} direction="row">
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
        <EditAttractionAddress
          attractionId={atraction!.id}
          address={atraction!.address}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "mustVisit") {
    return (
      <Flex gap={15} direction="row">
        <EditAttractionMustVisit
          attractionId={atraction!.id}
          attractionName={atraction.name.name}
          mustVisit={atraction?.mustVisit || false}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "isTraditional") {
    return (
      <Flex gap={15} direction="row">
        <EditAttractionTraditional
          attractionId={atraction!.id}
          attractionName={atraction.name.name}
          isTraditional={atraction?.isTraditional || false}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "infoFrom") {
    return (
      <Flex gap={15} direction="row">
        <div>
          <div>{atraction?.infoFrom.source}</div>
          <div>({atraction?.infoFrom.recorded})</div>
        </div>
        <EditAttractionInfoFromDetails
          attractionId={atraction!.id}
          infoFrom={atraction.infoFrom}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "optimalVisitPeriod") {
    return (
      <Flex gap={15} direction="row">
        {atraction?.optimalVisitPeriod && (
          <DateRangePicker
            fromDate={atraction.optimalVisitPeriod.fromDate}
            toDate={atraction.optimalVisitPeriod.toDate}
            disable={true}
          ></DateRangePicker>
        )}
        <EditAttractionVisitPeriod
          attractionId={atraction!.id}
          attractionName={atraction.name.name}
          visitPeriod={atraction!.optimalVisitPeriod}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "tip") {
    return (
      <Flex gap={15} direction="row">
        <Text>{atraction?.tip}</Text>
        <EditAttractionTip
          attractionId={atraction!.id}
          attractionName={atraction.name.name}
          tip={atraction!.tip}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "category") {
    return (
      <Flex gap={15} direction="row">
        <Text>{atraction?.category}</Text>
        <EditAttractionCategory
          attractionId={atraction!.id}
          category={atraction.category}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "type") {
    return (
      <Flex gap={6} direction="row">
        <Text>{atraction?.type}</Text>
        <EditAttractionType
          attractionId={atraction!.id}
          type={atraction.type}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  }

  if (!column.accessor) {
    return "";
  }

  return atraction[column.accessor as keyof AttractionRow] as string;
};

// Repeated
const sortOptions: SelectChoice[] = [
  { value: "DESC" as OrderOptions, label: "Newest" },
  { value: "ASC" as OrderOptions, label: "Oldest" }
];

const virtualization = {
  estimatedRowHeight: 64,
  overscan: 2
};

export const AttractionList: React.FunctionComponent = () => {
  const classes = useClasses();
  const pageClasses = useListPageClasses();

  const [items, setItems] = useState<AttractionRow[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBooleanState(true);
  const [order, setOrder] = useState<OrderOptions>("DESC");
  const [lastElement, setLastElement] = useState<
    LastReadAttraction | undefined
  >(undefined);
  const navigate = useNavigate();
  const createAttractionCustomizer = (): ListCustomizer<AttractionRow> =>
    new ListCustomizer(
      setItems,
      setColumns,
      new AttractionListCustomizerConfiguration()
    );
  const [attractionCustomizer, setAttractionCustomizer] = useState(
    createAttractionCustomizer
  );
  const resetAttractionPagination = (): void => {
    setAttractionCustomizer(createAttractionCustomizer());
    setLastElement(undefined);
  };
  const {
    reloadData,
    loadMore,
    reload: reloadAttractions
  } = useListReload(resetAttractionPagination);

  useEffect(() => {
    getPagedAttractions(lastElement, order).then((data) => {
      setLoading();
      setLastElement(toLastReadAttraction(data));
      const attractionRows = data.map(AttractionRow.from);
      const nextCustomizer = attractionCustomizer.withPagedRows(attractionRows);
      nextCustomizer.createColumns();
      setAttractionCustomizer(nextCustomizer);
      setNotLoading();
    });
  }, [reloadData]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => {
    if (query.trim().length >= 3) {
      searchAttraction(query).then(setSuggestions);
    }
  }, [query]);

  return (
    <div className={pageClasses.pageLayout}>
      <Navigation />
      <main className={pageClasses.content}>
        {isLoading && <LoadingSpinner text="Updating list of attractions" />}
        {!isLoading && (
          <ListElement
            items={items}
            columns={columns}
            rootClassName={classes.headerRoot}
            tableContainerClassName={classes.listViewport}
            tableClassName={classes.table}
            virtualization={virtualization}
            listHeader={{
              text: listHeader.text ?? "All attractions",
              showSearchBar: listHeader.showSearchBar ?? true,
              setItems: setSuggestions,
              onSortOptionChange: (_event, choice) => {
                setOrder(choice!.value as OrderOptions);
                reloadAttractions();
              },
              sortOptions: sortOptions,
              selectedSortValue: order,
              items: suggestions,
              onSearchTyped: (
                _event?: React.ChangeEvent<HTMLInputElement>,
                newValue?: string
              ) => {
                setQuery(newValue ?? "");
              },
              onFindItem: (id) => {
                if (typeof id !== "number") return;
                getAttractionById(id).then((data) => {
                  setAttractionCustomizer(() => {
                    return createAttractionCustomizer().withFixedRows([
                      AttractionRow.from(data)
                    ]);
                  });
                  setSuggestions([]);
                });
              }
            }}
            addRowOptions={{
              text: "Add new attraction",
              onAddRow: () => navigate("/add-attraction")
            }}
            deleteRowOptions={{
              text: "Delete attraction",
              onDeleteRow: async (selection: DataSelection<AttractionRow>) => {
                await deleteRows(selection.selectedRows());
                reloadAttractions();
              }
            }}
            onLoadMore={(_index: number) => {
              onRenderWhenNoMoreItems(loadMore);
              return null;
            }}
            renderCell={(
              item: AttractionRow,
              index: number,
              column: DataColumn
            ) =>
              renderCellContent(
                classes.linkField,
                classes.countrywideFlag,
                reloadAttractions,
                (attractionId, permanentlyClosedAt) =>
                  setAttractionCustomizer(
                    attractionCustomizer.withMappedRows((item) =>
                      item.id === attractionId
                        ? item.withPermanentlyClosedAt(permanentlyClosedAt)
                        : item
                    )
                  ),
                item,
                index,
                column
              )
            }
            getSelectedItemName={(selection: DataSelection<AttractionRow>) => {
              const selectedRows = selection.selectedRows();
              if (selectedRows.length > 0) {
                return selectedRows[0].name.name;
              }

              return "";
            }}
          />
        )}
      </main>
    </div>
  );
};

export default AttractionList;
