import { buildColumns, IColumn } from "@fluentui/react";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { Country } from "./Country.types.";

export class CountryListCustomizer extends ListElementCustomizer<Country> {
  constructor(
    items: Country[],
    callback: (items: Country[]) => void,
    callback2: (columns: IColumn[]) => void
  ) {
    super(items, callback, callback2);
    this.callback(items);
  }

  private setDefaultLayout = (column: IColumn): IColumn => {
    const result = { ...column };

    result.ariaLabel = `Operations for ${column.name}`;
    result.isMultiline = false;
    result.minWidth = 100;
    result.isResizable = true;
    result.isCollapsible = true;

    return result;
  };

  public createColumns = (): void => {
    const columns = buildColumns(this.items, true, this.onColumnClick).map(
      (column) => this.setDefaultLayout(column)
    );

    this.columns = columns;
    this.callback2(this.columns);
  };
}
