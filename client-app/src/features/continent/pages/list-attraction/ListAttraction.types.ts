import { Attraction } from "../../domain/Attraction.types";

export class AttractionRow implements Omit<Attraction, "updatedOn"> {
  private constructor(
    public readonly id: number,
    public readonly name: Attraction["name"],
    public readonly destination: Attraction["destination"],
    public readonly address: Attraction["address"],
    public readonly category: Attraction["category"],
    public readonly type: Attraction["type"],
    public readonly mustVisit: boolean,
    public readonly isTraditional: boolean,
    public readonly infoFrom: Attraction["infoFrom"],
    public readonly optimalVisitPeriod: Attraction["optimalVisitPeriod"],
    public readonly tip?: string
  ) {}

  public static from(attraction: Attraction): AttractionRow {
    return new AttractionRow(
      attraction.id,
      attraction.name,
      attraction.destination,
      attraction.address,
      attraction.category,
      attraction.type,
      attraction.mustVisit,
      attraction.isTraditional,
      attraction.infoFrom,
      attraction.optimalVisitPeriod,
      attraction.tip
    );
  }
}
