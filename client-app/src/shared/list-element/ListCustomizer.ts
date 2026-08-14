import type React from "react";
import type { DataColumn } from "../ui/data-table/DataTable";

export type ListHeaderClickHandler = (
  event: React.MouseEvent<HTMLElement>,
  column: DataColumn
) => void;

export abstract class ListCustomizerConfiguration<T extends object> {
  public constructor(public readonly useInfiniteScroll: boolean = false) {}

  public abstract createColumns(
    items: T[],
    handleHeaderClick: ListHeaderClickHandler
  ): DataColumn[];
}

export class ListCustomizer<T extends object> {
  public columns?: DataColumn[];

  public constructor(
    private readonly notifyItemsChanged: (items: T[]) => void,
    private readonly notifyColumnsChanged: (columns: DataColumn[]) => void,
    private readonly configuration: ListCustomizerConfiguration<T>,
    public readonly items: T[] = []
  ) {}

  private copyAndSort(accessor: string, sortDescending?: boolean): T[] {
    const key = accessor as keyof T;
    return this.items
      .slice()
      .sort((first, second) =>
        (sortDescending ? first[key] < second[key] : first[key] > second[key])
          ? 1
          : -1
      );
  }

  public handleHeaderClick = (
    _event: React.MouseEvent<HTMLElement>,
    column: DataColumn
  ): void => {
    const sortDescending = column.sorted
      ? !column.sortDescending
      : column.sortDescending;

    const items = this.copyAndSort(
      column.accessor ?? column.id,
      sortDescending
    );
    const columns = (this.columns ?? []).map((currentColumn) => ({
      ...currentColumn,
      sorted: currentColumn.id === column.id,
      sortDescending:
        currentColumn.id === column.id
          ? sortDescending
          : currentColumn.sortDescending
    }));

    this.notifyItemsChanged(items);
    this.columns = columns;
    this.notifyColumnsChanged(columns);
  };

  public createColumns = (): void => {
    const columns = this.configuration.createColumns(
      this.items,
      this.handleHeaderClick
    );
    this.columns = columns;
    this.notifyColumnsChanged(columns);
  };

  public withPagedRows(newRows: T[]): ListCustomizer<T> {
    const rows = this.withoutInfiniteScrollFlag().concat(newRows);
    const nextRows =
      this.configuration.useInfiniteScroll && newRows.length > 0
        ? [...rows, null as unknown as T]
        : rows;

    return this.withRows(nextRows);
  }

  public withFixedRows(newRows: T[]): ListCustomizer<T> {
    return this.withRows(this.withoutInfiniteScrollFlag().concat(newRows));
  }

  public withMappedRows(mapRow: (row: T) => T): ListCustomizer<T> {
    return this.withRows(
      this.items.map((item) => (item === null ? item : mapRow(item)))
    );
  }

  private withRows(items: T[]): ListCustomizer<T> {
    this.notifyItemsChanged(items);
    return new ListCustomizer(
      this.notifyItemsChanged,
      this.notifyColumnsChanged,
      this.configuration,
      items
    );
  }

  private withoutInfiniteScrollFlag(): T[] {
    if (
      !this.configuration.useInfiniteScroll ||
      this.items.length === 0 ||
      this.items[this.items.length - 1] !== null
    ) {
      return this.items.slice();
    }

    return this.items.slice(0, -1);
  }
}
