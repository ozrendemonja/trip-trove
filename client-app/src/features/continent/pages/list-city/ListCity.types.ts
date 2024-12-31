import { City } from "../../domain/City.types";

export class CityRow {
  public readonly id: number;
  public readonly name: string;
  public readonly region: string;
  public readonly country: string;

  private constructor(
    id: number,
    name: string,
    region: string,
    country: string
  ) {
    this.id = id;
    this.name = name;
    this.region = region;
    this.country = country;
  }

  public static from(city: City): CityRow {
    return new CityRow(city.id, city.name, city.inRegion, city.inCountry);
  }
}

export interface EditPropertyCityDetailsProps {
  /**
   * Text to display as the header
   */
  text: string;

  cityId: number;

  onUpdateClick: () => void;
}
