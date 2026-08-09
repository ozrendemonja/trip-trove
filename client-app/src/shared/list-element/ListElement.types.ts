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

export abstract class ListElementCustomizer<T> {
  items: T[];
  columns?: DataColumn[] = undefined;
  notifyItemsChanged: (items: T[]) => void;
  notifyListColumnChanged: (columns: DataColumn[]) => void;

  constructor(
    items: T[],
    notifyItemsChanged: (items: T[]) => void,
    notifyListColumnChanged: (columns: DataColumn[]) => void
  ) {
    this.items = items;
    this.notifyItemsChanged = notifyItemsChanged;
    this.notifyListColumnChanged = notifyListColumnChanged;
  }

  private copyAndSort(accessor: string, sortDescending?: boolean): T[] {
    const key = accessor as keyof T;
    return this.items
      .slice(0)
      .sort((a, b) =>
        (sortDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1
      );
  }

  handleHeaderClick = (
    _event: React.MouseEvent<HTMLElement>,
    column: DataColumn
  ): void => {
    let sortDescending = column.sortDescending;

    // // If we've sorted this column, flip it.
    if (column.sorted) {
      sortDescending = !sortDescending;
    }

    // // Sort the items.
    this.items = this.copyAndSort(
      column.accessor ?? column.id,
      sortDescending
    ) as T[];

    // // Reset the items and columns to match the state.
    this.columns =
      this.columns?.map((col) => {
        col.sorted = col.id === column.id;

        if (col.sorted) {
          col.sortDescending = sortDescending;
        }

        return col;
      }) ?? [];

    this.notifyItemsChanged(this.items);
    this.notifyListColumnChanged(this.columns);
  };

  abstract createColumns(): void;

  abstract withPagedRows(newRows: T[]): ListElementCustomizer<T>;
}
