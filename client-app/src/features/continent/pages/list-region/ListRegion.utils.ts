import { LastReadCountry } from "../../domain/Country.types.";
import { Region } from "../../domain/Region.types";

export const toLastReadRegion = (
  region: Region[]
): LastReadCountry | undefined => {
  if (region.length < 1) {
    return undefined;
  }
  return {
    id: region.at(-1)!.id,
    updatedOn: region.at(-1)!.updatedOn
  };
};
