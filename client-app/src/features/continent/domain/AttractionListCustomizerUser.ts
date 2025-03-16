import { buildColumns, IColumn } from "@fluentui/react";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { AttractionRow } from "../pages/list-attraction/ListAttraction.types";

export class AttractionListCustomizerUser extends ListElementCustomizer<AttractionRow> {
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

    if (column?.key === "infoFrom") {
      result.maxWidth = 150;
    } else if (column?.key === "address") {
      result.maxWidth = 200;
    } else if (column?.key === "destination") {
      result.maxWidth = 250;
    } else if (column?.key === "category") {
      result.maxWidth = 260;
    } else if (column?.key === "optimalVisitPeriod") {
      result.maxWidth = 230;
    } else {
      result.minWidth = 100;
    }
    result.isResizable = true;
    result.isCollapsible = true;

    return result;
  };

  public createColumns = (): void => {
    const skipColumns = new Set(["id", "type", "mustVisit", "isTraditional"]);
    const columns = buildColumns(this.items, true)
      .map((column) => this.setDefaultLayout(column))
      .filter((column) => !skipColumns.has(column.key));

    this.columns = columns;
    this.notifyListColumnChanged(this.columns);
  };

  public withPagedRows(newRows: AttractionRow[]): AttractionListCustomizerUser {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);
    if (newRows.length > 0) {
      result = this.addInfiniteScrollFlag(result);
    }

    this.notifyItemsChanged(result);
    return new AttractionListCustomizerUser(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  public withFixedRows(newRows: AttractionRow[]): AttractionListCustomizerUser {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);

    this.notifyItemsChanged(result);
    return new AttractionListCustomizerUser(
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
