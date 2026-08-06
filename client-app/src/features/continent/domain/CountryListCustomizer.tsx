import {
  createDataColumns,
  DataColumn
} from "../../../shared/ui/data-table/DataTable";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { CountryRow } from "../pages/list-country/ListCountry.types";

export class CountryListCustomizer extends ListElementCustomizer<CountryRow> {
  constructor(
    notifyCountryChanged: (items: CountryRow[]) => void,
    notifyListColumnChanged: (columns: DataColumn[]) => void,
    items: CountryRow[] = []
  ) {
    super(items, notifyCountryChanged, notifyListColumnChanged);
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

  public withPagedRows(newRows: CountryRow[]): CountryListCustomizer {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);
    if (newRows.length > 0) {
      result = this.addInfiniteScrollFlag(result);
    }

    this.notifyItemsChanged(result);
    return new CountryListCustomizer(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  public withFixedRows(newRows: CountryRow[]): CountryListCustomizer {
    let result = this.removeInfiniteScrollFlag(this.items);
    result = result.concat(newRows);

    this.notifyItemsChanged(result);
    return new CountryListCustomizer(
      this.notifyItemsChanged,
      this.notifyListColumnChanged,
      result
    );
  }

  private addInfiniteScrollFlag(result: CountryRow[]): CountryRow[] {
    return [...result, null as unknown as CountryRow];
  }

  private removeInfiniteScrollFlag(items: CountryRow[]): CountryRow[] {
    return items.length > 0 ? items.slice(0, items.length - 1) : items.slice();
  }
}
