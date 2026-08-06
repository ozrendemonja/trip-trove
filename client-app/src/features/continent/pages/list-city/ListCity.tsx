import {
  DataColumn,
  DataSelection
} from "../../../../shared/ui/data-table/DataTable";
import { SelectChoice } from "../../../../shared/ui/forms/SelectField";
import { Link, Text } from "@fluentui/react-components";
import { useBooleanState } from "../../../../shared/hooks/useBooleanState";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ListElement from "../../../../shared/list-element/ListElement";
import { useListPageClasses } from "../../../../shared/list-element/ListPage.styles";
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
import { Flex } from "../../../../shared/ui/Flex";

const renderCellContent = (
  className: string,
  onUpdateClick: () => void,
  city: CityRow,
  _index: number,
  column: DataColumn
): JSX.Element | string | number => {
  if (column.id === "name") {
    return (
      <Flex gap={15} direction="row">
        <Link
          data-fluent-link
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
      </Flex>
    );
  } else if (column.id === "region") {
    return (
      <Flex gap={15} direction="row">
        <Text>{city?.region}</Text>
        <EditCityRegionDetails
          cityId={city!.id}
          text={city!.region}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  }

  return city[column.accessor as keyof CityRow] as string;
};

// Repeated
const sortOptions: SelectChoice[] = [
  { value: "DESC" as OrderOptions, label: "Newest" },
  { value: "ASC" as OrderOptions, label: "Oldest" }
];

export const CityList: React.FunctionComponent = () => {
  const classes = useClasses();
  const pageClasses = useListPageClasses();

  const [items, setItems] = useState<CityRow[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBooleanState(true);
  const [reloadData, { toggle: toggleReloadData }] = useBooleanState(true);
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
    <div className={pageClasses.pageLayout}>
      <Navigation />
      <main className={pageClasses.content}>
        {isLoading && <LoadingSpinner text="Updating list of cities" />}
        {!isLoading && (
          <ListElement
            items={items}
            columns={columns}
            listHeader={{
              ...listHeader,
              setItems: setSuggestions,
              onSortOptionChange: (_event, choice) => {
                setOrder(choice!.value as OrderOptions);
                setCityCustomizer(new CityListCustomizer(setItems, setColumns));
                toggleReloadData();
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
              onDeleteRow: async (selection: DataSelection<CityRow>) => {
                await deleteRows(selection.selectedRows());
                setCityCustomizer(new CityListCustomizer(setItems, setColumns));
                toggleReloadData();
              }
            }}
            onLoadMore={(_index: number) =>
              onRenderWhenNoMoreItems(toggleReloadData)
            }
            renderCell={(item: CityRow, index: number, column: DataColumn) =>
              renderCellContent(
                classes.linkField,
                () => {
                  setCityCustomizer(
                    new CityListCustomizer(setItems, setColumns)
                  );
                  toggleReloadData();
                },
                item,
                index,
                column
              )
            }
            getSelectedItemName={(selection: DataSelection<City>) => {
              const selectedRows = selection.selectedRows();
              if (selectedRows.length > 0) {
                return selectedRows[0].name;
              }

              return "";
            }}
          />
        )}
      </main>
    </div>
  );
};

export default CityList;
