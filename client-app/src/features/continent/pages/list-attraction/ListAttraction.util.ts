import { Attraction, LastReadAttraction } from "../../domain/Attraction.types";

export const toLastReadAttraction = (
  region: Attraction[]
): LastReadAttraction | undefined => {
  if (region.length < 1) {
    return undefined;
  }
  return {
    id: region.at(-1)!.id,
    updatedOn: region.at(-1)!.updatedOn,
    regionName: region.at(-1)!.destination.regionName,
    cityName: region.at(-1)!.destination.cityName
  };
};
