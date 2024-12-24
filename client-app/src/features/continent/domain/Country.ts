import { deleteCountryWithId } from "../infra/ManagerApi";
import { CountryRow } from "../pages/list-country/ListCountry.types";

export const deleteRows = async (countries: CountryRow[]): Promise<void> => {
  for (const country of countries) {
    await deleteCountryWithId(country.id);
  }
};
