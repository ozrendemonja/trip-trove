import {
  IColumn,
  IDropdownOption,
  Link,
  Selection,
  Stack
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ListElement from "../../../../shared/list-element/ListElement";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { Continent, OrderOptions } from "../../domain/Continent.types";
import { ContinentListCustomizer } from "../../domain/ContinentListCustomizer";
import { Country } from "../../domain/Country.types.";
import { getContinents } from "../../infra/ManagerApi";
import { useClasses } from "./ListCountry.styles";
import { listHeader, onRenderWhenNoMoreItems } from "./ListCountries.config";

const onRenderItemColumn = (
  className: string,
  onUpdateClick: () => void,
  country?: Country,
  column?: IColumn
): JSX.Element | string | number => {
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
        <EditProperty text={country?.name} onUpdateClick={onUpdateClick} />
      </Stack>
    );
  }
  return item[column.key as keyof Country];
};

const sortOptions: IDropdownOption[] = [
  { key: "DESC" as OrderOptions, text: "Newest", selected: true },
  { key: "ASC" as OrderOptions, text: "Oldest" }
];

export const CountryList: React.FunctionComponent = () => {
  const classes = useClasses();

  const [items, setItems] = useState(undefined);
  const [columns, setColumns] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
  const [order, setOrder] = useState<OrderOptions>("ASC");
  const navigate = useNavigate();

  useEffect(() => {
    getContinents(order).then((data) => {
      setIsLoading(true);
      new ContinentListCustomizer(data, setItems, setColumns).createColumns();
      setIsLoading(false);
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
            onDeleteRow: async (selection: Selection<Country>) => {
              //   await deleteRows(selection.getSelection());
              toggleReloadData();
            }
          }}
          onRenderMissingItem={onRenderWhenNoMoreItems}
          onRenderItemColumn={(
            item?: Continent,
            _index?: number,
            column?: IColumn
          ) =>
            onRenderItemColumn(
              classes.linkField,
              toggleReloadData,
              item,
              column
            )
          }
          selectedItemName={(selection: Selection<Country>) =>
            selection.getSelection()[0].name
          }
        />
      )}
    </>
  );
};

export default CountryList;
