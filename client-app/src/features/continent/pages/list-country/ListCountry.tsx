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
import { ListCustomizer } from "../../../../shared/list-element/ListCustomizer";
import { useListPageClasses } from "../../../../shared/list-element/ListPage.styles";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { OrderOptions } from "../../domain/Continent.types";
import { deleteRows } from "../../domain/Country";
import { Country, LastReadCountry } from "../../domain/Country.types.";
import { CountryListCustomizerConfiguration } from "../../domain/ListCustomizerConfigurations";
import { Suggestion } from "../../domain/Suggestion.types.";
import {
  getCountries,
  getCountryById,
  searchCountry
} from "../../infra/ManagerApi";
import EditContinentDetails from "./EditContinentDetails";
import EditPropertyCountryDetails from "./EditPropertyCountryDetails";
import EditPropertyCountryIsoCode from "./EditPropertyCountryIsoCode";
import { listHeader, onRenderWhenNoMoreItems } from "./ListCountries.config";
import { useClasses } from "./ListCountry.styles";
import { CountryRow } from "./ListCountry.types";
import { toLastReadCountry } from "./ListCountry.utils";
import { Flex } from "../../../../shared/ui/Flex";

const renderCellContent = (
  className: string,
  onUpdateClick: () => void,
  country: CountryRow,
  _index: number,
  column: DataColumn
): JSX.Element | string | number => {
  if (column.id === "name") {
    return (
      <Flex gap={15} direction="row">
        <Link
          data-fluent-link
          className={className}
          href={`https://www.google.com/search?q=${country.name}`}
          target="_blank"
          rel="noopener"
          underline
        >
          {country?.name}
        </Link>
        <EditPropertyCountryDetails
          countryId={country!.id}
          text={country!.name}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "continent") {
    return (
      <Flex gap={15} direction="row">
        <Text>{country?.continent}</Text>
        <EditContinentDetails
          countryId={country!.id}
          text={country!.name}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  } else if (column.id === "isoCode") {
    return (
      <Flex gap={15} direction="row">
        <Text>{country?.isoCode?.toUpperCase()}</Text>
        <EditPropertyCountryIsoCode
          countryId={country!.id}
          text={country!.name}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  }
  return country[column.accessor as keyof Country] as string;
};

const sortOptions: SelectChoice[] = [
  { value: "DESC" as OrderOptions, label: "Newest" },
  { value: "ASC" as OrderOptions, label: "Oldest" }
];

export const CountryList: React.FunctionComponent = () => {
  const classes = useClasses();
  const pageClasses = useListPageClasses();

  const [items, setItems] = useState<CountryRow[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBooleanState(true);
  const [reloadData, { toggle: toggleReloadData }] = useBooleanState(true);
  const [order, setOrder] = useState<OrderOptions>("DESC");
  const [lastElement, setLastElement] = useState<LastReadCountry | undefined>(
    undefined
  );
  const navigate = useNavigate();
  const createCountryCustomizer = (): ListCustomizer<CountryRow> =>
    new ListCustomizer(
      setItems,
      setColumns,
      new CountryListCustomizerConfiguration()
    );
  const [countryCustomizer, setCountryCustomizer] = useState(
    createCountryCustomizer
  );
  const resetCountryPagination = (): void => {
    setCountryCustomizer(createCountryCustomizer());
    setLastElement(undefined);
  };

  useEffect(() => {
    getCountries(lastElement, order).then((data) => {
      setLoading();
      setLastElement(toLastReadCountry(data));
      const countryRows = data.map(CountryRow.from);
      const nextCustomizer = countryCustomizer.withPagedRows(countryRows);
      nextCustomizer.createColumns();
      setCountryCustomizer(nextCustomizer);
      setNotLoading();
    });
  }, [reloadData]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => {
    if (query.trim().length >= 3) {
      searchCountry(query).then((data) => {
        setSuggestions(data);
      });
    }
  }, [query]);

  return (
    <div className={pageClasses.pageLayout}>
      <Navigation />
      <main className={pageClasses.content}>
        {isLoading && <LoadingSpinner text="Updating list of contries" />}
        {!isLoading && (
          <ListElement
            items={items}
            columns={columns}
            listHeader={{
              ...listHeader,
              setItems: setSuggestions,
              showSearchBar: true,
              onSortOptionChange: (_event, choice) => {
                setOrder(choice!.value as OrderOptions);
                resetCountryPagination();
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
                getCountryById(id).then((data) => {
                  setCountryCustomizer(() => {
                    return createCountryCustomizer().withFixedRows([
                      CountryRow.from(data)
                    ]);
                  });
                  setSuggestions([]);
                });
              }
            }}
            addRowOptions={{
              text: "Add new country",
              onAddRow: () => navigate("/add-country")
            }}
            deleteRowOptions={{
              text: "Delete country",
              onDeleteRow: async (selection: DataSelection<CountryRow>) => {
                await deleteRows(selection.selectedRows());
                resetCountryPagination();
                toggleReloadData();
              }
            }}
            onLoadMore={(_index: number) =>
              onRenderWhenNoMoreItems(toggleReloadData)
            }
            renderCell={(item: Country, index: number, column: DataColumn) =>
              renderCellContent(
                classes.linkField,
                () => {
                  resetCountryPagination();
                  toggleReloadData();
                },
                item,
                index,
                column
              )
            }
            getSelectedItemName={(selection: DataSelection<Country>) => {
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

export default CountryList;
