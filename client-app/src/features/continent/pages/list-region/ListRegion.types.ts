import { Region } from "../../domain/Region.types";

export class RegionRow {
  public readonly id: number;
  public readonly name: string;
  public readonly country: string;

  private constructor(id: number, name: string, country: string) {
    this.id = id;
    this.name = name;
    this.country = country;
  }

  public static from(region: Region): RegionRow {
    return new RegionRow(region.id, region.name, region.inCountry);
  }
}

export interface EditRegionDetailsProps {
  /**
   * Text to display as the header
   */
  text: string;

  regionId: number;

  onUpdateClick: () => void;
}
