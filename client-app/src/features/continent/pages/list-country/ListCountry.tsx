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
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { OrderOptions } from "../../domain/Continent.types";
import { Country, LastReadCountry } from "../../domain/Country.types.";
import { CountryListCustomizer } from "../../domain/CountryListCustomizer";
import { getCountries } from "../../infra/ManagerApi";
import { listHeader, onRenderWhenNoMoreItems } from "./ListCountries.config";
import { useClasses } from "./ListCountry.styles";
import { CountryRow } from "./ListCountry.types";
import { toLastReadCountry } from "./ListCountry.utils";
import { deleteRows } from "../../domain/Country";
import EditPropertyCountryDetails from "../../../../shared/list-element/ui/edit-property/EditPropertyCountryDetails";
import EditPropertyCountryContinentDetails from "../../../../shared/list-element/ui/edit-property/EditPropertyCountryContinentDetails";

const onRenderItemColumn = (
  className: string,
  onUpdateClick: () => void,
  country?: CountryRow,
  column?: IColumn
): JSX.Element | string | number => {
  if (column?.key === "skipElement") {
    return null;
  }
  if (column?.key === "name") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Link
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
      </Stack>
    );
  } else if (column?.key === "continent") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Text>{country?.continent}</Text>
        <EditPropertyCountryContinentDetails
          countryId={country!.id}
          text={country!.name}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  }
  return country[column.fieldName as keyof Country] as string;
};

const sortOptions: IDropdownOption[] = [
  { key: "DESC" as OrderOptions, text: "Newest", selected: true },
  { key: "ASC" as OrderOptions, text: "Oldest" }
];

export const CountryList: React.FunctionComponent = () => {
  const classes = useClasses();

  const [items, setItems] = useState<CountryRow[]>([]);
  const [columns, setColumns] = useState<IColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBoolean(true);
  const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
  const [order, setOrder] = useState<OrderOptions>("DESC");
  const [lastElement, setLastElement] = useState<LastReadCountry | undefined>(
    undefined
  );
  const navigate = useNavigate();
  const [countryCustomizer, setCountryCustomizer] = useState(
    new CountryListCustomizer(setItems, setColumns)
  );

  useEffect(() => {
    getCountries(lastElement, order).then((data) => {
      setLoading();
      setLastElement(toLastReadCountry(data));
      const countryRows = data.map(CountryRow.from);
      setCountryCustomizer(countryCustomizer.withRows(countryRows));
      countryCustomizer.createColumns();
      setNotLoading();
    });
  }, [reloadData]);

  return (
    <>
      <Navigation />
      {isLoading && <LoadingSpinner text="Updating list of contries" />}
      {!isLoading && (
        <ListElement
          items={items}
          columns={columns}
          listHeader={{
            ...listHeader,
            onSortOptionChange: (
              _event: React.FormEvent<HTMLDivElement>,
              option?: IDropdownOption,
              _index?: number
            ) => {
              setOrder(option!.key as OrderOptions);
              setCountryCustomizer(
                new CountryListCustomizer(setItems, setColumns)
              );
              toggleReloadData();
            },
            sortOptions: sortOptions
          }}
          addRowOptions={{
            text: "Add new country",
            onAddRow: () => navigate("/add-country")
          }}
          deleteRowOptions={{
            text: "Delete country",
            onDeleteRow: async (selection: Selection<CountryRow>) => {
              await deleteRows(selection.getSelection());
              setCountryCustomizer(
                new CountryListCustomizer(setItems, setColumns)
              );
              toggleReloadData();
            }
          }}
          onRenderMissingItem={(_index: number) =>
            onRenderWhenNoMoreItems(toggleReloadData)
          }
          onRenderItemColumn={(
            item?: Country,
            _index?: number,
            column?: IColumn
          ) =>
            onRenderItemColumn(
              classes.linkField,
              () => {
                setCountryCustomizer(
                  new CountryListCustomizer(setItems, setColumns)
                );
                toggleReloadData();
              },
              item,
              column
            )
          }
          selectedItemName={(selection: Selection<Country>) => {
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

export default CountryList;
