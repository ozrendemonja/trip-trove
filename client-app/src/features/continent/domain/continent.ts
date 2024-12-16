import { deleteContinentWithName } from "../infra/managerApi";
import { Continent } from "./continent.types";

export const deleteRows = async (continents: Continent[]): Promise<void> => {
    for (const continent of continents) {
        await deleteContinentWithName(continent.name);
    }
};