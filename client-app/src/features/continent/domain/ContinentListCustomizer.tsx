import { buildColumns, IColumn } from "@fluentui/react";
import { Continent } from "./Continent.types";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";

export class ContinentListCustomizer extends ListElementCustomizer<Continent> {
  constructor(
    items: Continent[],
    callback: (items: Continent[]) => void,
    callback2: (columns: IColumn[]) => void
  ) {
    super(items, callback, callback2);
    this.notifyItemsChanged(items);
  }

  private setSetupForSortIcon = (column: IColumn): IColumn => {
    const result = { ...column };
    if (result.name) {
      result.showSortIconWhenUnsorted = true;
      result.isCollapsible = true;
      result.isMultiline = true;
      result.minWidth = 100;
    }
    return result;
  };

  private setDefaultLayout = (column: IColumn): IColumn => {
    const result = { ...column };

    result.ariaLabel = `Operations for ${column.name}`;
    result.isMultiline = false;
    result.minWidth = 100;
    result.isResizable = true;

    return result;
  };

  public createColumns = (): void => {
    const columns = buildColumns(this.items, true, this.onColumnClick)
      .map((column) => this.setSetupForSortIcon(column))
      .map((column) => this.setDefaultLayout(column));

    this.columns = columns;
    this.notifyListColumnChanged(this.columns);
  };
}
