import { deleteContinentWithName } from "../infra/ManagerApi";
import { Continent } from "./Continent.types";

export const deleteRows = async (continents: Continent[]): Promise<void> => {
  for (const continent of continents) {
    await deleteContinentWithName(continent.name);
  }
};
