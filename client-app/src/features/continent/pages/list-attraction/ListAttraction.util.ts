import { Attraction, LastReadAttraction } from "../../domain/Attraction.types";

export const toLastReadAttraction = (
  region: Attraction[]
): LastReadAttraction | undefined => {
  if (region.length < 1) {
    return undefined;
  }
  return {
    id: region.at(-1)!.id,
    updatedOn: region.at(-1)!.updatedOn
  };
};
