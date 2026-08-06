import {
  createDataColumns,
  DataColumn
} from "../../../shared/ui/data-table/DataTable";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { AttractionRow } from "../pages/list-attraction/ListAttraction.types";

export class AttractionListCustomizerUser extends ListElementCustomizer<AttractionRow> {
  constructor(
    notifyAttractionChanged: (items: AttractionRow[]) => void,
    notifyListColumnChanged: (columns: DataColumn[]) => void,
    items: AttractionRow[] = []
  ) {
    super(items, notifyAttractionChanged, notifyListColumnChanged);
  }

  private setDefaultLayout = (column: DataColumn): DataColumn => {
    const result = { ...column };

    result.headerAriaLabel = `Operations for ${column.header}`;
    result.multiline = true;

    if (column.id === "infoFrom") {
      result.maxWidth = 150;
    } else if (column.id === "address") {
      result.maxWidth = 200;
    } else if (column.id === "destination") {
      result.maxWidth = 250;
    } else if (column.id === "category") {
      result.maxWidth = 260;
    } else if (column.id === "optimalVisitPeriod") {
      result.maxWidth = 230;
    } else {
      result.minWidth = 100;
    }

    return result;
  };

  public createColumns = (): void => {
    const skipColumns = new Set([
      "id",
      "type",
      "mustVisit",
      "isTraditional",
      "visitStatus",
      "permanentlyClosedAt"
    ]);
    const columns = createDataColumns(this.items)
      .map((column) => this.setDefaultLayout(column))
      .filter((column) => !skipColumns.has(column.id));

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
    return [...result, null as unknown as AttractionRow];
  }

  private removeInfiniteScrollFlag(items: AttractionRow[]): AttractionRow[] {
    return items.length > 0 ? items.slice(0, items.length - 1) : items.slice();
  }
}
