import {
  DataColumn,
  DataSelection,
  DataTableVirtualizationOptions
} from "../ui/data-table/DataTable";
import { AddRowOptionsProps } from "./ui/delete-dialog/DeleteDialog.types";
import { ListHeaderProps } from "./ui/list-header/ListHeader.types";
import type React from "react";

export interface ListTableProps<T> {
  /**
   * Items to be displayed
   */
  items: T[];

  columns: DataColumn[];

  tableContainerClassName?: string;

  tableClassName?: string;

  virtualization?: DataTableVirtualizationOptions;

  onLoadMore: (index: number) => React.ReactNode;

  renderCell: (item: T, index: number, column: DataColumn) => React.ReactNode;

  getRowClassName?: (row: T, index: number) => string | undefined;
}

export interface ListElementProps<T> extends ListTableProps<T> {
  rootClassName?: string;

  listHeader: ListHeaderProps;

  addRowOptions: AddRowOptionsProps;

  deleteRowOptions: {
    text: string;
    onDeleteRow: (selection: DataSelection<T>) => void;
  };

  getSelectedItemName: (selection: DataSelection<T>) => string;
}
