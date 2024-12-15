import { deleteContinent, getAllContinents, saveContinent, updateContinent } from "../../../clients/manager";
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

export const deleteContinentWithName = async (name: string): Promise<void> => {
    const { data, error } = await deleteContinent({
        path: {
            name: name
        },
        headers: {
            "x-api-version": "1"
        }
    });

    if (error) {
        throw new Error("Error while deleting continent", error);
    }
}

export const saveNewContinent = async (name: string): Promise<void> => {
    const { data, error } = await saveContinent({
        body: {
            continentName: name
        },
        headers: {
            "x-api-version": "1"
        }
    });

    if (error) {
        throw new Error("Error while saving continent", error);
    }
}

export const changeContinentName = async (oldName: string, newName: string): Promise<void> => {
    const { data, error } = await updateContinent({
        body: {
            continentName: newName
        },
        path: {
            name: oldName
        },
        headers: {
            "x-api-version": "1"
        }
    });

    if (error) {
        throw new Error("Error while updating continent", error);
    }
}