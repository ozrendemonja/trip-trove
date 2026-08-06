import { DataTable } from "../ui/data-table/DataTable";
import React from "react";
import { useClasses } from "./ListElement.styles";
import { ListElementUserProps } from "./ListElement.types";

export const ListElementUser: React.FunctionComponent<ListElementUserProps> = (
  props
) => {
  const classes = useClasses();
  const sortedItems = props.items;
  const columns = props.columns;

  return (
    <DataTable
      className={classes.listBody}
      rows={sortedItems ?? []}
      columns={columns}
      aria-label="Item details"
      onLoadMore={props.onLoadMore}
      renderCell={props.renderCell}
      getRowClassName={props.getRowClassName}
    />
  );
};

export default ListElementUser;
