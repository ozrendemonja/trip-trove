import {
  deleteContinent,
  deleteCountry,
  getAllContinents,
  getAllCountries,
  saveContinent,
  saveCountry,
  updateContinent
} from "../../../clients/manager";
import managerClient from "../../../config/ClientsApiConfig";
import {
  Continent,
  LastReadCountry,
  OrderOptions
} from "../domain/Continent.types";
import { Country } from "../domain/Country.types.";

managerClient();

export const getContinents = async (
  orderBy?: OrderOptions
): Promise<Continent[]> => {
  const { data, error } = await getAllContinents({
    headers: {
      "x-api-version": "1"
    },
    query: {
      sd: orderBy
    }
  });

  if (error) {
    throw new Error("Error while getting data", error);
  }
  if (!data || data?.find((continent) => !continent.continentName)) {
    throw new Error("Invalid continent name");
  }

  return data.map((continent) => {
    return { name: continent.continentName! };
  });
};

export const deleteContinentWithName = async (name: string): Promise<void> => {
  const { error } = await deleteContinent({
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
};

export const saveNewContinent = async (name: string): Promise<void> => {
  const { error } = await saveContinent({
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
};

export const changeContinentName = async (
  oldName: string,
  newName: string
): Promise<void> => {
  const { error } = await updateContinent({
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
};

export const saveNewCountry = async (
  name: string,
  continentName: string
): Promise<void> => {
  const { error } = await saveCountry({
    body: {
      countryName: name,
      continentName: continentName
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while saving country", error);
  }
};

export const getCountries = async (
  lastReadCountry?: LastReadCountry,
  orderBy?: OrderOptions
): Promise<Country[]> => {
  const { data, error } = await getAllCountries({
    headers: {
      "x-api-version": "1"
    },
    query: {
      sd: orderBy,
      countryId: lastReadCountry?.id,
      updatedOn: lastReadCountry?.updatedOn
    }
  });

  if (error) {
    throw new Error("Error while getting data", error);
  }
  if (
    !data ||
    data?.find((country) => !country.continentName || !country.countryName)
  ) {
    throw new Error("Invalid country data");
  }

  return data.map((country) => {
    return {
      id: country.countryId,
      name: country.countryName!,
      inContinent: country.continentName!,
      updatedOn: country.changedOn
    };
  });
};

export const deleteCountryWithId = async (id: number): Promise<void> => {
  const { error } = await deleteCountry({
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while deleting country", error);
  }
};
