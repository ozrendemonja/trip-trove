import {
  createDataColumns,
  DataColumn
} from "../../../shared/ui/data-table/DataTable";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { AttractionRow } from "../pages/list-attraction/ListAttraction.types";

export class AttractionListCustomizer extends ListElementCustomizer<AttractionRow> {
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

    if (column.id === "mustVisit" || column.id === "isTraditional") {
      result.maxWidth = 60;
    } else if (column.id === "type") {
      result.maxWidth = 140;
    } else if (column.id === "optimalVisitPeriod") {
      result.minWidth = 280;
      result.maxWidth = 280;
    } else {
      result.minWidth = 150;
    }

    return result;
  };

  public createColumns = (): void => {
    const columns = createDataColumns(this.items)
      .filter(
        (column) =>
          column.id !== "id" &&
          column.id !== "visitStatus" &&
          column.id !== "permanentlyClosedAt"
      )
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

  public withPermanentClosure(
    attractionId: number,
    permanentlyClosedAt?: string
  ): AttractionListCustomizer {
    const result = this.items.map((item) =>
      item?.id === attractionId
        ? item.withPermanentlyClosedAt(permanentlyClosedAt)
        : item
    );

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
