import { DataTable, DataSelection } from "../ui/data-table/DataTable";
import React, { useState } from "react";
import { useClasses } from "./ListElement.styles";
import { ListElementProps } from "./ListElement.types";
import DeleteDialog from "./ui/delete-dialog/DeleteDialog";
import ListHeader from "./ui/list-header/ListHeader";
import { Flex } from "../ui/Flex";
import { mergeClasses } from "@fluentui/react-components";

export const ListElement = <T,>(props: ListElementProps<T>) => {
  const classes = useClasses();
  const sortedItems = props.items;
  const columns = props.columns;

  const [haveSelectedItem, setHaveSelectedItem] = useState(true);
  const [selectedItemName, setSelectedItemName] = useState("");
  const onSelectedItemChange = (): void => {
    setHaveSelectedItem(selection.selectedCount() === 0);
    setSelectedItemName(props.getSelectedItemName(selection));
  };
  const selection = React.useMemo(() => {
    const selection = new DataSelection<T>({
      onChange: onSelectedItemChange
    });
    selection.replaceRows(sortedItems, false);
    return selection;
  }, []);

  const table = (
    <DataTable
      className={mergeClasses(classes.listBody, props.tableClassName)}
      rows={sortedItems ?? []}
      selection={selection}
      columns={columns}
      selectable
      aria-label="Item details"
      selectionButtonAriaLabel="select row"
      onLoadMore={props.onLoadMore}
      renderCell={props.renderCell}
    />
  );

  return (
    <>
      <Flex className={mergeClasses(classes.root, props.rootClassName)}>
        <ListHeader {...props.listHeader} />
        <DeleteDialog
          selectedItem={{
            haveSelectedItem: haveSelectedItem,
            name: selectedItemName
          }}
          addRowOptions={props.addRowOptions}
          deleteRowOptions={{
            text: props.deleteRowOptions.text,
            onDeleteRow: () => props.deleteRowOptions.onDeleteRow(selection)
          }}
        />
      </Flex>
      {props.tableContainerClassName ? (
        <div className={props.tableContainerClassName}>{table}</div>
      ) : (
        table
      )}
    </>
  );
};

export default ListElement;
