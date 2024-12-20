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
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import { deleteRows } from "../../domain/Continent";
import { Continent, OrderOptions } from "../../domain/Continent.types";
import { ContinentListCustomizer } from "../../domain/ContinentListCustomizer";
import { getContinents } from "../../infra/ManagerApi";
import { listHeader, onRenderWhenNoMoreItems } from "./ListContinent.config";
import { useClasses } from "./ListContinent.styles";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import ListElement from "../../../../shared/list-element/ListElement";
import Navigation from "../../../../shared/navigation/Navigation";

const onRenderItemColumn = (
  className: string,
  onUpdateClick: () => void,
  continent?: Continent,
  column?: IColumn
): JSX.Element | string | number => {
  if (column?.key === "name") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Link
          className={className}
          href={`https://www.google.com/search?q=${continent.name}`}
          target="_blank"
          rel="noopener"
          underline
        >
          {continent?.name}
        </Link>
        <EditProperty text={continent?.name} onUpdateClick={onUpdateClick} />
      </Stack>
    );
  }
  return item[column.key as keyof Continent];
};

const sortOptions: IDropdownOption[] = [
  { key: "DESC" as OrderOptions, text: "Newest", selected: true },
  { key: "ASC" as OrderOptions, text: "Oldest" }
];

export const ContinentList: React.FunctionComponent = () => {
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
      {isLoading && <LoadingSpinner text="Updating list of continents" />}
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
            text: "Add new continent",
            onAddRow: () => navigate("/add-continent")
          }}
          deleteRowOptions={{
            text: "Delete continent",
            onDeleteRow: async (selection: Selection<Continent>) => {
              await deleteRows(selection.getSelection());
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
          selectedItemName={(selection: Selection<Continent>) =>
            selection.getSelection()[0].name
          }
        />
      )}
    </>
  );
};

export default ContinentList;
