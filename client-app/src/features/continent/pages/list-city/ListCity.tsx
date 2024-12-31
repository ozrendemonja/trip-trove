import {
  IColumn,
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
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { deleteRows } from "../../domain/City";
import { City, LastReadCity } from "../../domain/City.types";
import { CityListCustomizer } from "../../domain/CityListCustomizer";
import { OrderOptions } from "../../domain/Continent.types";
import { Suggestion } from "../../domain/Suggestion.types.";
import { getCities, getCityById, searchCity } from "../../infra/ManagerApi";
import { CityRow } from "../list-city/ListCity.types";
import { listHeader, onRenderWhenNoMoreItems } from "./ListCity.config";
import { useClasses } from "./ListCity.styles";
import { toLastReadCity } from "./ListCity.utils";
import EditPropertyCityDetails from "./EditPropertyCityDetails";
import EditCityRegionDetails from "./EditCityRegionDetails";

const onRenderItemColumn = (
  className: string,
  onUpdateClick: () => void,
  city?: CityRow,
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
          href={`https://www.google.com/search?q=${city?.name}`}
          target="_blank"
          rel="noopener"
          underline
        >
          {city?.name}
        </Link>
        <EditPropertyCityDetails
          cityId={city!.id}
          text={city!.name}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "region") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Text>{city?.region}</Text>
        <EditCityRegionDetails
          cityId={city!.id}
          text={city!.region}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  }

  return city[column?.fieldName as keyof CityRow] as string;
};

// Repeated
const sortOptions: IDropdownOption[] = [
  { key: "DESC" as OrderOptions, text: "Newest", selected: true },
  { key: "ASC" as OrderOptions, text: "Oldest" }
];

export const CityList: React.FunctionComponent = () => {
  const classes = useClasses();

  const [items, setItems] = useState<CityRow[]>([]);
  const [columns, setColumns] = useState<IColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBoolean(true);
  const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
  const [order, setOrder] = useState<OrderOptions>("DESC");
  const [lastElement, setLastElement] = useState<LastReadCity | undefined>(
    undefined
  );
  const navigate = useNavigate();
  const [cityCustomizer, setCityCustomizer] = useState(
    new CityListCustomizer(setItems, setColumns)
  );

  useEffect(() => {
    getCities(lastElement, order).then((data) => {
      setLoading();
      setLastElement(toLastReadCity(data));
      const cityRows = data.map(CityRow.from);
      setCityCustomizer(cityCustomizer.withPagedRows(cityRows));
      cityCustomizer.createColumns();
      setNotLoading();
    });
  }, [reloadData]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => {
    if (query.trim().length >= 3) {
      searchCity(query).then(setSuggestions);
    }
  }, [query]);

  return (
    <>
      <Navigation />
      {isLoading && <LoadingSpinner text="Updating list of cities" />}
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
              setCityCustomizer(new CityListCustomizer(setItems, setColumns));
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
              getCityById(id).then((data) => {
                setCityCustomizer(() => {
                  return new CityListCustomizer(
                    setItems,
                    setColumns
                  ).withFixedRows([CityRow.from(data)]);
                });
                setSuggestions([]);
              });
            }
          }}
          addRowOptions={{
            text: "Add new city",
            onAddRow: () => navigate("/add-city")
          }}
          deleteRowOptions={{
            text: "Delete city",
            onDeleteRow: async (selection: Selection<CityRow>) => {
              await deleteRows(selection.getSelection());
              setCityCustomizer(new CityListCustomizer(setItems, setColumns));
              toggleReloadData();
            }
          }}
          onRenderMissingItem={(_index: number) =>
            onRenderWhenNoMoreItems(toggleReloadData)
          }
          onRenderItemColumn={(
            item?: CityRow,
            _index?: number,
            column?: IColumn
          ) =>
            onRenderItemColumn(
              classes.linkField,
              () => {
                setCityCustomizer(new CityListCustomizer(setItems, setColumns));
                toggleReloadData();
              },
              item,
              column
            )
          }
          selectedItemName={(selection: Selection<City>) => {
            if (
              selection &&
              selection.getSelection() &&
              selection.getSelection().length > 0
            ) {
              return selection.getSelection()[0].name;
            }
          }}
        />
      )}
    </>
  );
};

export default CityList;
