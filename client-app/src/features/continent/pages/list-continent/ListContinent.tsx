import { IColumn, Link, Selection, Stack } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import { deleteRows } from "../../domain/Continent";
import { Continent } from "../../domain/Continent.types";
import { ContinentListCustomizer } from "../../domain/ContinentListCustomizer";
import { getContinents } from "../../infra/ManagerApi";
import { listHeader, onRenderWhenNoMoreItems } from "./ListContinent.config";
import { useClasses } from "./ListContinent.styles";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import ListElement from "../../../../shared/list-element/ListElement";

const onRenderItemColumn = (
  onUpdateClick: () => void,
  continent?: Continent,
  column?: IColumn,
  className: string
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

export const ContinentList: React.FunctionComponent = () => {
  const classes = useClasses();

  const [items, setItems] = useState(undefined);
  const [columns, setColumns] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
  const navigate = useNavigate();

  useEffect(() => {
    getContinents().then((data) => {
      setIsLoading(true);
      new ContinentListCustomizer(data, setItems, setColumns).createColumns();
      setIsLoading(false);
    });
  }, [reloadData]);

  return (
    <>
      {isLoading && <LoadingSpinner text="Updating list of continents" />}
      {!isLoading && (
        <ListElement
          items={items}
          columns={columns}
          listHeader={listHeader}
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
              toggleReloadData,
              item,
              column,
              classes.linkField
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
