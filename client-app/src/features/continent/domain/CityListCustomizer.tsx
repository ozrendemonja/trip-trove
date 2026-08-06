import {
  createDataColumns,
  DataColumn
} from "../../../shared/ui/data-table/DataTable";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { CityRow } from "../pages/list-city/ListCity.types";

export class CityListCustomizer extends ListElementCustomizer<CityRow> {
  constructor(
    notifyCityChanged: (items: CityRow[]) => void,
    notifyListColumnChanged: (columns: DataColumn[]) => void,
    items: CityRow[] = []
  ) {
    super(items, notifyCityChanged, notifyListColumnChanged);
  }

  private setDefaultLayout = (column: DataColumn): DataColumn => {
    const result = { ...column };

    result.headerAriaLabel = `Operations for ${column.header}`;
    result.multiline = false;
    result.minWidth = 100;

    return result;
  };

  public createColumns = (): void => {
    const isUserFacingColumn = (column: DataColumn): boolean =>
      column.id !== "id";
    const columns = createDataColumns(this.items)
      .filter(isUserFacingColumn)
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
