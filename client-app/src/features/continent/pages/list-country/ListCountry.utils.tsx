import { Country, LastReadCountry } from "../../domain/Country.types.";

export const toLastReadCountry = (
  countries: Country[]
): LastReadCountry | undefined => {
  if (countries.length < 1) {
    return undefined;
  }
  return {
    id: countries.at(-1)!.id,
    updatedOn: countries.at(-1)!.updatedOn
  };
};
