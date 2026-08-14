import {
  createDataColumns,
  type DataColumn
} from "../../../shared/ui/data-table/DataTable";
import {
  ListCustomizerConfiguration,
  type ListHeaderClickHandler
} from "../../../shared/list-element/ListCustomizer";
import type { AttractionRow } from "../pages/list-attraction/ListAttraction.types";
import type { CityRow } from "../pages/list-city/ListCity.types";
import type { CountryRow } from "../pages/list-country/ListCountry.types";
import type { RegionRow } from "../pages/list-region/ListRegion.types";
import type { Continent } from "./Continent.types";

abstract class GeographyListCustomizerConfiguration<
  T extends object
> extends ListCustomizerConfiguration<T> {
  protected constructor() {
    super(true);
  }

  public createColumns(items: T[]): DataColumn[] {
    return createDataColumns(items)
      .filter((column) => column.id !== "id")
      .map((column) => this.withDefaultLayout(column));
  }

  protected withDefaultLayout(column: DataColumn): DataColumn {
    return {
      ...column,
      headerAriaLabel: `Operations for ${column.header}`,
      multiline: false,
      minWidth: 100
    };
  }
}

export class CityListCustomizerConfiguration extends GeographyListCustomizerConfiguration<CityRow> {}

export class CountryListCustomizerConfiguration extends GeographyListCustomizerConfiguration<CountryRow> {}

export class RegionListCustomizerConfiguration extends GeographyListCustomizerConfiguration<RegionRow> {}

abstract class BaseAttractionListCustomizerConfiguration extends ListCustomizerConfiguration<AttractionRow> {
  protected constructor() {
    super(true);
  }

  protected withBaseLayout(column: DataColumn): DataColumn {
    return {
      ...column,
      headerAriaLabel: `Operations for ${column.header}`,
      multiline: true
    };
  }
}

export class AttractionListCustomizerConfiguration extends BaseAttractionListCustomizerConfiguration {
  public createColumns(items: AttractionRow[]): DataColumn[] {
    return createDataColumns(items)
      .filter(
        (column) =>
          column.id !== "id" &&
          column.id !== "visitStatus" &&
          column.id !== "permanentlyClosedAt"
      )
      .map((column) => this.withLayout(column));
  }

  private withLayout(column: DataColumn): DataColumn {
    const result = this.withBaseLayout(column);

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
  }
}

export class AttractionUserListCustomizerConfiguration extends BaseAttractionListCustomizerConfiguration {
  private readonly hiddenColumns = new Set([
    "id",
    "type",
    "mustVisit",
    "isTraditional",
    "visitStatus",
    "permanentlyClosedAt"
  ]);

  public createColumns(items: AttractionRow[]): DataColumn[] {
    return createDataColumns(items)
      .map((column) => this.withLayout(column))
      .filter((column) => !this.hiddenColumns.has(column.id));
  }

  private withLayout(column: DataColumn): DataColumn {
    const result = this.withBaseLayout(column);

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
  }
}

export class ContinentListCustomizerConfiguration extends ListCustomizerConfiguration<Continent> {
  public createColumns(
    items: Continent[],
    handleHeaderClick: ListHeaderClickHandler
  ): DataColumn[] {
    return createDataColumns(items, handleHeaderClick)
      .filter((column) => column.id !== "id")
      .map((column) => this.withDefaultLayout(column));
  }

  private withDefaultLayout(column: DataColumn): DataColumn {
    return {
      ...column,
      headerAriaLabel: `Operations for ${column.header}`,
      multiline: false,
      minWidth: 100
    };
  }
}
