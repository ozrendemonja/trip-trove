import {
  createDataColumns,
  DataColumn
} from "../../../shared/ui/data-table/DataTable";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { RegionRow } from "../pages/list-region/ListRegion.types";

export class RegionListCustomizer extends ListElementCustomizer<RegionRow> {
  constructor(
    notifyRegionChanged: (items: RegionRow[]) => void,
    notifyListColumnChanged: (columns: DataColumn[]) => void,
    items: RegionRow[] = []
  ) {
    super(items, notifyRegionChanged, notifyListColumnChanged);
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

  public withPagedRows(newRows: RegionRow[]): RegionListCustomizer {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);
    if (newRows.length > 0) {
      result = this.addInfiniteScrollFlag(result);
    }

    this.notifyItemsChanged(result);
    return new RegionListCustomizer(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  public withFixedRows(newRows: RegionRow[]): RegionListCustomizer {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);

    this.notifyItemsChanged(result);
    return new RegionListCustomizer(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  private addInfiniteScrollFlag(result: RegionRow[]): RegionRow[] {
    return [...result, null];
  }

  private removeInfiniteScrollFlag(items: RegionRow[]): RegionRow[] {
    return items.length > 0 ? items.slice(0, items.length - 1) : items.slice();
  }
}
