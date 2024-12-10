import { getAllContinents } from "../../../clients/manager";
import managerClient from "../../../config/clientsApiConfig";
import { Continent } from "../domain/continent.types";

managerClient();

export const getContinents = async (): Promise<Continent[]> => {
    const { data, error } = await getAllContinents({
        headers: {
            "x-api-version": "1"
        }
    });

    if (error) {
        throw new Error("Error while getting data", error);
    }
    if (!data || data?.find(continent => !continent.continentName)) {
        throw new Error("Invalid continent name");
    }

    return data.map(continent => { return { name: continent.continentName! } });
}
