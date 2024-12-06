import { IExampleItem } from "@fluentui/example-data";
import { IColumn } from "@fluentui/react";
import { ListHeaderProps } from "./ui/ListHeader/ListHeader.types";

export interface ListElementProps {
  /**
* Items to be displayed
*/
  items: IExampleItem[];

  columns: IColumn[];
  onAddRow: () => void;
  addRowText: string;
  onDeleteRow: (selection: Selection) => void;
  onDeleteRowText: string;
  onRenderMissingItem: (index?: number) => null;
  onRenderItemColumn: (item?: IExampleItem, index?: number, column?: IColumn) => JSX.Element | string | number;
  listHeader: ListHeaderProps;
}

export abstract class ListElementCustomizer {
  items: IExampleItem[];
  columns?: IColumn[] = undefined;
  callback: (items: IExampleItem[]) => void;
  callback2: (columns: IColumn[]) => void;

  constructor(items: IExampleItem[], callback: (items: IExampleItem[]) => void, callback2: (columns: IColumn[]) => void) {
    this.items = items;
    this.callback = callback;
    this.callback2 = callback2;
  }

  private copyAndSort<T>(columnKey: string, isSortedDescending?: boolean): T[] {
    const key = columnKey as keyof T;
    return this.items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
  }

  onColumnClick = (event: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    let isSortedDescending = column.isSortedDescending;

    // // If we've sorted this column, flip it.
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending;
    }

    // // Sort the items.
    this.items = this.copyAndSort(column.fieldName!, isSortedDescending) as IExampleItem[];

    // // Reset the items and columns to match the state.
    this.columns = this.columns.map(col => {
      col.isSorted = col.key === column.key;

      if (col.isSorted) {
        col.isSortedDescending = isSortedDescending;
      }

      return col;
    });

    this.callback(this.items);
    this.callback2(this.columns);
  }

  abstract createColumns(): void;
}