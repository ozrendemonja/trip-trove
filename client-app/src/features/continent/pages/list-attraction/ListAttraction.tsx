import {
  IColumn,
  Icon,
  IDropdownOption,
  Link,
  Selection,
  Stack,
  Text
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ListElement from "../../../../shared/list-element/ListElement";
import DateRangePicker from "../../../../shared/list-element/ui/date-picker/DateRangePicker";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { deleteRows } from "../../domain/Attraction";
import { Attraction, LastReadAttraction } from "../../domain/Attraction.types";
import { AttractionListCustomizer } from "../../domain/AttractionListCustomizer";
import { OrderOptions } from "../../domain/Continent.types";
import { Suggestion } from "../../domain/Suggestion.types.";
import {
  getAttractionById,
  getPagedAttractions,
  searchAttraction
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

const onRenderItemColumn = (
  className: string,
  onUpdateClick: () => void,
  atraction?: AttractionRow,
  column?: IColumn
): JSX.Element | string | number => {
  if (column?.key === "skipElement") {
    return <></>;
  }
  if (column?.key === "name") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Link
          className={className}
          href={`https://www.google.com/search?q=${atraction?.name.name}`}
          target="_blank"
          rel="noopener"
          underline
        >
          <div>{atraction?.name.name}</div>
          {atraction?.name.mainAttractionName && (
            <div>(part of {atraction?.name.mainAttractionName})</div>
          )}
        </Link>
        <EditPropertyAttractionDetails
          attractionId={atraction!.id}
          text={atraction!.name.name}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "destination") {
    return (
      <Stack tokens={{ childrenGap: 10 }} horizontal={true}>
        <Text>
          {(atraction?.destination.cityName
            ? atraction?.destination.cityName + ", "
            : "") +
            atraction?.destination.regionName +
            ", " +
            atraction?.destination.countryName}
        </Text>
        {atraction?.destination.isCountrywide && (
          <Icon iconName="Flag" styles={{ root: { color: "green" } }} />
        )}
        <EditAttractionDestination
          attractionId={atraction!.id}
          destination={atraction!.destination}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "address") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
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
          address={atraction?.address}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "mustVisit") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <EditAttractionMustVisit
          attractionId={atraction!.id}
          attractionName={atraction?.name.name!}
          mustVisit={atraction?.mustVisit || false}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "isTraditional") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <EditAttractionTraditional
          attractionId={atraction!.id}
          attractionName={atraction?.name.name!}
          isTraditional={atraction?.isTraditional || false}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "infoFrom") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <div>
          <div>{atraction?.infoFrom.source}</div>
          <div>({atraction?.infoFrom.recorded})</div>
        </div>
        <EditAttractionInfoFromDetails
          attractionId={atraction!.id}
          infoFrom={atraction?.infoFrom!}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "optimalVisitPeriod") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        {atraction?.optimalVisitPeriod && (
          <DateRangePicker
            fromDate={atraction.optimalVisitPeriod.fromDate}
            toDate={atraction.optimalVisitPeriod.toDate}
            disable={true}
          ></DateRangePicker>
        )}
        <EditAttractionVisitPeriod
          attractionId={atraction!.id}
          attractionName={atraction?.name.name!}
          visitPeriod={atraction!.optimalVisitPeriod}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "tip") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Text>{atraction?.tip}</Text>
        <EditAttractionTip
          attractionId={atraction!.id}
          attractionName={atraction?.name.name!}
          tip={atraction!.tip}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "category") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Text>{atraction?.category}</Text>
        <EditAttractionCategory
          attractionId={atraction!.id}
          category={atraction?.category!}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "type") {
    return (
      <Stack tokens={{ childrenGap: 6 }} horizontal={true}>
        <Text>{atraction?.type}</Text>
        <EditAttractionType
          attractionId={atraction!.id}
          type={atraction?.type!}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  }

  return atraction[column?.fieldName as keyof AttractionRow] as string;
};

// Repeated
const sortOptions: IDropdownOption[] = [
  { key: "DESC" as OrderOptions, text: "Newest", selected: true },
  { key: "ASC" as OrderOptions, text: "Oldest" }
];

export const AttractionList: React.FunctionComponent = () => {
  const classes = useClasses();

  const [items, setItems] = useState<AttractionRow[]>([]);
  const [columns, setColumns] = useState<IColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBoolean(true);
  const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
  const [order, setOrder] = useState<OrderOptions>("DESC");
  const [lastElement, setLastElement] = useState<
    LastReadAttraction | undefined
  >(undefined);
  const navigate = useNavigate();
  const [attractionCustomizer, setAttractionCustomizer] = useState(
    new AttractionListCustomizer(setItems, setColumns)
  );

  useEffect(() => {
    getPagedAttractions(lastElement, order).then((data) => {
      setLoading();
      setLastElement(toLastReadAttraction(data));
      const attractionRows = data.map(AttractionRow.from);
      setAttractionCustomizer(
        attractionCustomizer.withPagedRows(attractionRows)
      );
      attractionCustomizer.createColumns();
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
    <>
      <Navigation />
      {isLoading && <LoadingSpinner text="Updating list of attractions" />}
      {!isLoading && (
        <ListElement
          items={items}
          columns={columns}
          listHeader={{
            ...listHeader,
            setItems: setSuggestions,
            onSortOptionChange: (
              _event: React.FormEvent<HTMLDivElement>,
              option?: IDropdownOption,
              _index?: number
            ) => {
              setOrder(option!.key as OrderOptions);
              setAttractionCustomizer(
                new AttractionListCustomizer(setItems, setColumns)
              );
              toggleReloadData();
            },
            sortOptions: sortOptions,
            items: suggestions,
            onSearchTyped: (
              _event?: React.ChangeEvent<HTMLInputElement>,
              newValue?: string
            ) => {
              setQuery(newValue ?? "");
            },
            onFindItem: (id: number) => {
              getAttractionById(id).then((data) => {
                setAttractionCustomizer(() => {
                  return new AttractionListCustomizer(
                    setItems,
                    setColumns
                  ).withFixedRows([AttractionRow.from(data)]);
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
            onDeleteRow: async (selection: Selection<AttractionRow>) => {
              await deleteRows(selection.getSelection());
              setAttractionCustomizer(
                new AttractionListCustomizer(setItems, setColumns)
              );
              toggleReloadData();
            }
          }}
          onRenderMissingItem={(_index: number) =>
            onRenderWhenNoMoreItems(toggleReloadData)
          }
          onRenderItemColumn={(
            item?: AttractionRow,
            _index?: number,
            column?: IColumn
          ) =>
            onRenderItemColumn(
              classes.linkField,
              () => {
                setAttractionCustomizer(
                  new AttractionListCustomizer(setItems, setColumns)
                );
                toggleReloadData();
              },
              item,
              column
            )
          }
          selectedItemName={(selection: Selection<Attraction>) => {
            if (
              selection &&
              selection.getSelection() &&
              selection.getSelection().length > 0
            ) {
              return selection.getSelection()[0].name.name;
            }
          }}
        />
      )}
    </>
  );
};

export default AttractionList;
