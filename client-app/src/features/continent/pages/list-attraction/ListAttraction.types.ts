import {
  Attraction,
  AttractionAddress,
  AttractionInfoFrom,
  AttractionOptimalVisitPeriod
} from "../../domain/Attraction.types";

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

export interface EditPropertyAttractionDetailsProps {
  /**
   * Text to display as the header
   */
  text: string;

  attractionId: number;

  onUpdateClick: () => void;
}

export interface EditAttractionDestinationProps {
  attractionId: number;

  destination: Attraction["destination"];

  onUpdateClick: () => void;
}

export interface EditAttractionAddressProps {
  attractionId: number;

  address: AttractionAddress;

  onUpdateClick: () => void;
}

export interface EditAttractionMustVisitProps {
  attractionId: number;

  attractionName: string;

  mustVisit: boolean;

  onUpdateClick: () => void;
}

export interface EditAttractionTraditionalProps {
  attractionId: number;

  attractionName: string;

  isTraditional: boolean;

  onUpdateClick: () => void;
}

export interface EditAttractionInfoFromDetailsProps {
  attractionId: number;

  infoFrom: AttractionInfoFrom;

  onUpdateClick: () => void;
}

export interface EditAttractionVisitPeriodProps {
  attractionId: number;

  attractionName: string;

  visitPeriod?: AttractionOptimalVisitPeriod;

  onUpdateClick: () => void;
}

export interface EditAttractionTipProps {
  attractionId: number;

  attractionName: string;

  tip?: string;

  onUpdateClick: () => void;
}

export interface EditAttractionCategoryProps {
  attractionId: number;

  category: string;

  onUpdateClick: () => void;
}

export interface EditAttractionTypeProps {
  attractionId: number;

  type: string;

  onUpdateClick: () => void;
}
