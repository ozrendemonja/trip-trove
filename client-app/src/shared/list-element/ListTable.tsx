import { mergeClasses } from "@fluentui/react-components";
import React from "react";
import { DataSelection, DataTable } from "../ui/data-table/DataTable";
import { useClasses } from "./ListElement.styles";
import { ListTableProps } from "./ListElement.types";

interface ListTableInternalProps<T> extends ListTableProps<T> {
  selection?: DataSelection<T>;
  selectable?: boolean;
}

export const ListTable = <T,>(
  props: ListTableInternalProps<T>
): React.ReactElement => {
  const classes = useClasses();
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const isVirtualized = props.virtualization !== undefined;

  const table = (
    <DataTable
      className={mergeClasses(classes.listBody, props.tableClassName)}
      rows={props.items}
      selection={props.selection}
      columns={props.columns}
      selectable={props.selectable}
      aria-label="Item details"
      selectionButtonAriaLabel="select row"
      onLoadMore={props.onLoadMore}
      renderCell={props.renderCell}
      getRowClassName={props.getRowClassName}
      virtualization={props.virtualization}
      scrollContainerRef={isVirtualized ? tableContainerRef : undefined}
    />
  );

  return props.tableContainerClassName || isVirtualized ? (
    <div ref={tableContainerRef} className={props.tableContainerClassName}>
      {table}
    </div>
  ) : (
    table
  );
};
