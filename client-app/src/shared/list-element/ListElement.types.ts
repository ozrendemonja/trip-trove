import { IColumn, Selection } from "@fluentui/react";
import { Continent } from "../../features/continent/domain/Continent.types";
import { AddRowOptionsProps } from "./ui/delete-dialog/DeleteDialog.types";
import { ListHeaderProps } from "./ui/list-header/ListHeader.types";

export interface ListElementProps<T> {
  /**
   * Items to be displayed
   */
  items: T[];

  columns: IColumn[];

  listHeader: ListHeaderProps;

  addRowOptions: AddRowOptionsProps;

  deleteRowOptions: {
    text: string;
    onDeleteRow: (selection: Selection<Continent>) => void;
  };

  onRenderMissingItem: (index?: number) => null;

  onRenderItemColumn: (
    item?: T,
    index?: number,
    column?: IColumn
  ) => JSX.Element | string | number;

  selectedItemName: (selection: Selection) => string;
}

export abstract class ListElementCustomizer<T> {
  items: T[];
  columns?: IColumn[] = undefined;
  callback: (items: T[]) => void;
  callback2: (columns: IColumn[]) => void;

  constructor(
    items: T[],
    callback: (items: T[]) => void,
    callback2: (columns: IColumn[]) => void
  ) {
    this.items = items;
    this.callback = callback;
    this.callback2 = callback2;
  }

  private copyAndSort<T>(columnKey: string, isSortedDescending?: boolean): T[] {
    const key = columnKey as keyof T;
    return this.items
      .slice(0)
      .sort((a: T, b: T) =>
        (isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1
      );
  }

  onColumnClick = (
    event: React.MouseEvent<HTMLElement>,
    column: IColumn
  ): void => {
    let isSortedDescending = column.isSortedDescending;

    // // If we've sorted this column, flip it.
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending;
    }

    // // Sort the items.
    this.items = this.copyAndSort(column.fieldName!, isSortedDescending) as T[];

    // // Reset the items and columns to match the state.
    this.columns = this.columns.map((col) => {
      col.isSorted = col.key === column.key;

      if (col.isSorted) {
        col.isSortedDescending = isSortedDescending;
      }

      return col;
    });

    this.callback(this.items);
    this.callback2(this.columns);
  };

  abstract createColumns(): void;
}
