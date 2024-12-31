import { buildColumns, IColumn } from "@fluentui/react";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { RegionRow } from "../pages/list-region/ListRegion.types";

export class RegionListCustomizer extends ListElementCustomizer<RegionRow> {
  constructor(
    notifyRegionChanged: (items: RegionRow[]) => void,
    notifyListColumnChanged: (columns: IColumn[]) => void,
    items: RegionRow[] = []
  ) {
    super(items, notifyRegionChanged, notifyListColumnChanged);
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
