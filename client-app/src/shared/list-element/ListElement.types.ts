import {
  DataColumn,
  DataSelection,
  DataTableVirtualizationOptions
} from "../ui/data-table/DataTable";
import { AddRowOptionsProps } from "./ui/delete-dialog/DeleteDialog.types";
import { ListHeaderProps } from "./ui/list-header/ListHeader.types";
import { AttractionRow } from "../../features/continent/pages/list-attraction/ListAttraction.types";
import type React from "react";

export interface ListElementProps<T> {
  /**
   * Items to be displayed
   */
  items: T[];

  columns: DataColumn[];

  rootClassName?: string;

  tableContainerClassName?: string;

  tableClassName?: string;

  virtualization?: DataTableVirtualizationOptions;

  listHeader: ListHeaderProps;

  addRowOptions: AddRowOptionsProps;

  deleteRowOptions: {
    text: string;
    onDeleteRow: (selection: DataSelection<T>) => void;
  };

  onLoadMore: (index: number) => React.ReactNode;

  renderCell: (item: T, index: number, column: DataColumn) => React.ReactNode;

  getSelectedItemName: (selection: DataSelection<T>) => string;
}

export interface ListElementUserProps {
  /**
   * Items to be displayed
   */
  items: AttractionRow[];

  columns: DataColumn[];

  listHeader: ListHeaderProps;

  onLoadMore: (index: number) => React.ReactNode;

  renderCell: (
    item: AttractionRow,
    index: number,
    column: DataColumn
  ) => React.ReactNode;

  getRowClassName?: (row: AttractionRow, index: number) => string | undefined;
}
