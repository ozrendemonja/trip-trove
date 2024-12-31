import { deleteCityWithId } from "../infra/ManagerApi";
import { CityRow } from "../pages/list-city/ListCity.types";

export const deleteRows = async (cities: CityRow[]): Promise<void> => {
  for (const city of cities) {
    await deleteCityWithId(city.id);
  }
};
