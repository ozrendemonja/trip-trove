import { DataSelection } from "../ui/data-table/DataTable";
import React, { useState } from "react";
import { useClasses } from "./ListElement.styles";
import { ListElementProps } from "./ListElement.types";
import { ListTable } from "./ListTable";
import DeleteDialog from "./ui/delete-dialog/DeleteDialog";
import ListHeader from "./ui/list-header/ListHeader";
import { Flex } from "../ui/Flex";
import { mergeClasses } from "@fluentui/react-components";

export const ListElement = <T,>(
  props: ListElementProps<T>
): React.ReactElement => {
  const classes = useClasses();
  const sortedItems = props.items;

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
      <ListTable
        items={sortedItems}
        columns={props.columns}
        tableContainerClassName={props.tableContainerClassName}
        tableClassName={props.tableClassName}
        virtualization={props.virtualization}
        selection={selection}
        selectable
        onLoadMore={props.onLoadMore}
        renderCell={props.renderCell}
        getRowClassName={props.getRowClassName}
      />
    </>
  );
};

export default ListElement;
