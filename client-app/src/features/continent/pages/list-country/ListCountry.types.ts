import { Country } from "../../domain/Country.types.";

export class CountryRow {
  public readonly name: string;
  public readonly continent: string;

  private constructor(name: string, continent: string) {
    this.name = name;
    this.continent = continent;
  }

  public static from(country: Country): CountryRow {
    return new CountryRow(country.name, country.inContinent);
  }
}
