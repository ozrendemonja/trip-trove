import { buildColumns, IColumn } from "@fluentui/react";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { AttractionRow } from "../pages/list-attraction/ListAttraction.types";

export class AttractionListCustomizer extends ListElementCustomizer<AttractionRow> {
  constructor(
    notifyAttractionChanged: (items: AttractionRow[]) => void,
    notifyListColumnChanged: (columns: IColumn[]) => void,
    items: AttractionRow[] = []
  ) {
    super(items, notifyAttractionChanged, notifyListColumnChanged);
  }

  private setDefaultLayout = (column: IColumn): IColumn => {
    const result = { ...column };

    result.ariaLabel = `Operations for ${column.name}`;
    result.isMultiline = true;

    if (column?.key === "mustVisit" || column?.key === "isTraditional") {
      result.maxWidth = 60;
    } else if (column?.key === "type") {
      result.maxWidth = 140;
    } else if (column?.key === "optimalVisitPeriod") {
      result.minWidth = 280;
    } else {
      result.minWidth = 150;
    }

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

  public withPagedRows(newRows: AttractionRow[]): AttractionListCustomizer {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);
    if (newRows.length > 0) {
      result = this.addInfiniteScrollFlag(result);
    }

    this.notifyItemsChanged(result);
    return new AttractionListCustomizer(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  public withFixedRows(newRows: AttractionRow[]): AttractionListCustomizer {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);

    this.notifyItemsChanged(result);
    return new AttractionListCustomizer(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  private addInfiniteScrollFlag(result: AttractionRow[]): AttractionRow[] {
    return [...result, null];
  }

  private removeInfiniteScrollFlag(items: AttractionRow[]): AttractionRow[] {
    return items.length > 0 ? items.slice(0, items.length - 1) : items.slice();
  }
}
