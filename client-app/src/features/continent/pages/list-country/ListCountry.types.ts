import { Country } from "../../domain/Country.types.";

export class CountryRow {
  public readonly id: number;
  public readonly name: string;
  public readonly continent: string;

  private constructor(id: number, name: string, continent: string) {
    this.id = id;
    this.name = name;
    this.continent = continent;
  }

  public static from(country: Country): CountryRow {
    return new CountryRow(country.id, country.name, country.inContinent);
  }
}
