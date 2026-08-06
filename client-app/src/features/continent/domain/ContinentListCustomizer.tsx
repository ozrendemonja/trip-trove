import {
  createDataColumns,
  DataColumn
} from "../../../shared/ui/data-table/DataTable";
import { Continent } from "./Continent.types";
import { ListElementCustomizer } from "../../../shared/list-element/ListElement.types";

export class ContinentListCustomizer extends ListElementCustomizer<Continent> {
  constructor(
    items: Continent[],
    callback: (items: Continent[]) => void,
    callback2: (columns: DataColumn[]) => void
  ) {
    super(items, callback, callback2);
    this.notifyItemsChanged(items);
  }

  private setSetupForSortIcon = (column: DataColumn): DataColumn => {
    const result = { ...column };
    if (result.header) {
      result.multiline = true;
      result.minWidth = 100;
    }
    return result;
  };

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
    const columns = createDataColumns(this.items, this.handleHeaderClick)
      .filter(isUserFacingColumn)
      .map((column) => this.setSetupForSortIcon(column))
      .map((column) => this.setDefaultLayout(column));

    this.columns = columns;
    this.notifyListColumnChanged(this.columns);
  };

  public withPagedRows(newRows: Continent[]): ContinentListCustomizer {
    const result = this.items.concat(newRows);
    this.notifyItemsChanged(result);
    return new ContinentListCustomizer(
      result,
      this.notifyItemsChanged,
      this.notifyListColumnChanged
    );
  }
}
