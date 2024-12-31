import { City, LastReadCity } from "../../domain/City.types";

export const toLastReadCity = (region: City[]): LastReadCity | undefined => {
  if (region.length < 1) {
    return undefined;
  }
  return {
    id: region.at(-1)!.id,
    updatedOn: region.at(-1)!.updatedOn
  };
};
