import { buildColumns, IColumn } from "@fluentui/react";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";
import { CountryRow } from "../pages/list-country/ListCountry.types";

export class CountryListCustomizer extends ListElementCustomizer<CountryRow> {
  constructor(
    notifyCountryChanged: (items: CountryRow[]) => void,
    notifyListColumnChanged: (columns: IColumn[]) => void,
    items: CountryRow[] = []
  ) {
    super(items, notifyCountryChanged, notifyListColumnChanged);
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

  public withRows(newRows: CountryRow[]): CountryListCustomizer {
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

  private addInfiniteScrollFlag(result: CountryRow[]): CountryRow[] {
    return [...result, null];
  }

  private removeInfiniteScrollFlag(items: CountryRow[]): CountryRow[] {
    return items.length > 0 ? items.slice(0, items.length - 1) : items.slice();
  }
}
