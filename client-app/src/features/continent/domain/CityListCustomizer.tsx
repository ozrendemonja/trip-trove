import { buildColumns, IColumn } from "@fluentui/react";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { CityRow } from "../pages/list-city/ListCity.types";

export class CityListCustomizer extends ListElementCustomizer<CityRow> {
  constructor(
    notifyCityChanged: (items: CityRow[]) => void,
    notifyListColumnChanged: (columns: IColumn[]) => void,
    items: CityRow[] = []
  ) {
    super(items, notifyCityChanged, notifyListColumnChanged);
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

  private hideIdHeader(column: IColumn): any {
    const result = { ...column };

    if (result.key == "id") {
      result.maxWidth = 1;
      result.isResizable = true;
      result.key = "skipElement";
      result.onRenderHeader = () => {
        return null;
      };
    }

    return result;
  }

  public createColumns = (): void => {
    const columns = buildColumns(this.items, true)
      .map((column) => this.hideIdHeader(column))
      .map((column) => this.setDefaultLayout(column));

    this.columns = columns;
    this.notifyListColumnChanged(this.columns);
  };

  public withPagedRows(newRows: CityRow[]): CityListCustomizer {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);
    if (newRows.length > 0) {
      result = this.addInfiniteScrollFlag(result);
    }

    this.notifyItemsChanged(result);
    return new CityListCustomizer(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  public withFixedRows(newRows: CityRow[]): CityListCustomizer {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);

    this.notifyItemsChanged(result);
    return new CityListCustomizer(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  private addInfiniteScrollFlag(result: CityRow[]): CityRow[] {
    return [...result, null];
  }

  private removeInfiniteScrollFlag(items: CityRow[]): CityRow[] {
    return items.length > 0 ? items.slice(0, items.length - 1) : items.slice();
  }
}
