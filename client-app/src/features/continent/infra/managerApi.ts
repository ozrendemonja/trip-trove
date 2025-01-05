import {
  deleteAttraction,
  deleteCity,
  deleteContinent,
  deleteCountry,
  deleteRegion,
  getAllCities,
  getAllContinents,
  getAllCountries,
  getAllRegions,
  getAttractions,
  getCity,
  getCountry,
  getRegion,
  getSearchedElements,
  saveCity,
  saveContinent,
  saveCountry,
  saveRegion,
  updateCityDetail,
  updateCityRegion,
  updateContinent,
  updateCountryContinent,
  updateCountryDetail,
  updateRegionCountry,
  updateRegionDetail
} from "../../../clients/manager";
import managerClient from "../../../config/ClientsApiConfig";
import { Attraction, LastReadAttraction } from "../domain/Attraction.types";
import { City, LastReadCity } from "../domain/City.types";
import {
  Continent,
  LastReadCountry,
  OrderOptions
} from "../domain/Continent.types";
import { Country } from "../domain/Country.types.";
import { LastReadRegion, Region } from "../domain/Region.types";
import { Suggestion } from "../domain/Suggestion.types.";

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
    throw new Error("Invalid countries data");
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

export const getCountryById = async (id: number): Promise<Country> => {
  const { data, error } = await getCountry({
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while getting country", error);
  }

  if (
    !data ||
    !data.countryId ||
    !data.continentName ||
    !data.countryName ||
    !data.changedOn
  ) {
    throw new Error("Invalid country data");
  }

  return {
    id: data.countryId,
    name: data.countryName!,
    inContinent: data.continentName!,
    updatedOn: data.changedOn
  };
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

export const changeCountryDetails = async (
  id: string,
  newName: string
): Promise<void> => {
  const { error } = await updateCountryDetail({
    body: {
      countryName: newName
    },
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while updating country details", error);
  }
};

export const changeCountryContinent = async (
  id: string,
  newContinentName: string
): Promise<void> => {
  const { error } = await updateCountryContinent({
    body: {
      continentName: newContinentName
    },
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while updating country countinent", error);
  }
};

export const searchCountry = async (query: string): Promise<Suggestion[]> => {
  const { data, error } = await getSearchedElements({
    query: {
      q: query,
      i: "COUNTRY"
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while searching for country", error);
  }

  return (
    data?.suggestions?.map((suggestion) => {
      return { value: suggestion.value, id: suggestion.id } as Suggestion;
    }) ?? []
  );
};

export const getRegions = async (
  lastReadRegion?: LastReadRegion,
  orderBy?: OrderOptions
): Promise<Region[]> => {
  const { data, error } = await getAllRegions({
    headers: {
      "x-api-version": "1"
    },
    query: {
      sd: orderBy,
      regionId: lastReadRegion?.id,
      updatedOn: lastReadRegion?.updatedOn
    }
  });

  if (error) {
    throw new Error("Error while getting data", error);
  }
  if (
    !data ||
    data?.find((region) => !region.regionName || !region.countryName)
  ) {
    throw new Error("Invalid regions data");
  }

  return data.map((region) => {
    return {
      id: region.regionId!,
      name: region.regionName!,
      inCountry: region.countryName!,
      updatedOn: region.changedOn!
    };
  });
};

export const deleteRegionWithId = async (id: number): Promise<void> => {
  const { error } = await deleteRegion({
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while deleting region", error);
  }
};

export const saveNewRegion = async (
  name: string,
  countryId: number
): Promise<void> => {
  const { error } = await saveRegion({
    body: {
      countryId: countryId,
      regionName: name
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while saving region", error);
  }
};

export const changeRegionDetails = async (
  id: string,
  newName: string
): Promise<void> => {
  const { error } = await updateRegionDetail({
    body: {
      regionName: newName
    },
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while updating region details", error);
  }
};

export const changeRegionCountry = async (
  id: string,
  countryId: number
): Promise<void> => {
  const { error } = await updateRegionCountry({
    body: {
      countryId: countryId
    },
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while updating region country", error);
  }
};

export const searchRegion = async (query: string): Promise<Suggestion[]> => {
  const { data, error } = await getSearchedElements({
    query: {
      q: query,
      i: "REGION"
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while searching for region", error);
  }

  return (
    data?.suggestions?.map((suggestion) => {
      return { value: suggestion.value, id: suggestion.id } as Suggestion;
    }) ?? []
  );
};

export const getRegionById = async (id: number): Promise<Region> => {
  const { data, error } = await getRegion({
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while getting region", error);
  }

  if (
    !data ||
    data.regionId == undefined ||
    !data.regionName ||
    !data.countryName ||
    !data.changedOn
  ) {
    throw new Error("Invalid region data");
  }

  return {
    id: data.regionId,
    name: data.regionName!,
    inCountry: data.countryName!,
    updatedOn: data.changedOn
  };
};

export const getCities = async (
  lastReadCity?: LastReadCity,
  orderBy?: OrderOptions
): Promise<City[]> => {
  const { data, error } = await getAllCities({
    headers: {
      "x-api-version": "1"
    },
    query: {
      sd: orderBy,
      cityId: lastReadCity?.id,
      updatedOn: lastReadCity?.updatedOn
    }
  });

  if (error) {
    throw new Error("Error while getting data", error);
  }
  if (
    !data ||
    data?.find(
      (city) => !city.cityName || !city.regionName || !city.countryName
    )
  ) {
    throw new Error("Invalid city data");
  }

  return data.map((city) => {
    return {
      id: city.cityId!,
      name: city.cityName,
      inRegion: city.regionName,
      inCountry: city.countryName,
      updatedOn: city.changedOn!
    };
  });
};

export const deleteCityWithId = async (id: number): Promise<void> => {
  const { error } = await deleteCity({
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while deleting city", error);
  }
};

export const saveNewCity = async (
  name: string,
  regionId: number
): Promise<void> => {
  const { error } = await saveCity({
    body: {
      regionId: regionId,
      cityName: name
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while saving city", error);
  }
};

export const getCityById = async (id: number): Promise<City> => {
  const { data, error } = await getCity({
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while getting city", error);
  }

  if (
    !data ||
    data.cityId == undefined ||
    !data.cityName ||
    !data.regionName ||
    !data.countryName ||
    !data.changedOn
  ) {
    throw new Error("Invalid city data");
  }

  return {
    id: data.cityId,
    name: data.cityName,
    inRegion: data.regionName,
    inCountry: data.countryName,
    updatedOn: data.changedOn
  };
};

export const searchCity = async (query: string): Promise<Suggestion[]> => {
  const { data, error } = await getSearchedElements({
    query: {
      q: query,
      i: "CITY"
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while searching for city", error);
  }

  return (
    data?.suggestions?.map((suggestion) => {
      return { value: suggestion.value, id: suggestion.id } as Suggestion;
    }) ?? []
  );
};

export const changeCityDetails = async (
  id: string,
  newName: string
): Promise<void> => {
  const { error } = await updateCityDetail({
    body: {
      cityName: newName
    },
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while updating city details", error);
  }
};

export const changeCityRegion = async (
  id: string,
  regionId: number
): Promise<void> => {
  const { error } = await updateCityRegion({
    body: {
      regionId: regionId
    },
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while updating city region", error);
  }
};

export const getPagedAttractions = async (
  lastReadAttraction?: LastReadAttraction,
  orderBy?: OrderOptions
): Promise<Attraction[]> => {
  const { data, error } = await getAttractions({
    headers: {
      "x-api-version": "1"
    },
    query: {
      sd: orderBy,
      attractionId: lastReadAttraction?.id,
      updatedOn: lastReadAttraction?.updatedOn
    }
  });

  if (error) {
    throw new Error("Error while getting data", error);
  }
  if (
    !data ||
    data?.find(
      (attraction) =>
        attraction.attractionId == undefined ||
        !attraction.attractionName ||
        !attraction.regionName ||
        !attraction.countryName ||
        attraction.isCountrywide == undefined ||
        !attraction.attractionCategory ||
        !attraction.attractionType ||
        attraction.mustVisit == undefined ||
        attraction.isTraditional == undefined ||
        !attraction.infoFrom ||
        !attraction.infoRecorded ||
        !attraction.changedOn
    )
  ) {
    throw new Error("Invalid attraction data");
  }

  return data.map((attraction) => {
    return {
      id: attraction.attractionId!,
      name: {
        name: attraction.attractionName!,
        mainAttractionName: attraction.mainAttractionName
      },
      destination: {
        cityName: attraction.cityName,
        regionName: attraction.regionName,
        countryName: attraction.countryName,
        isCountrywide: attraction.isCountrywide
      },
      address: {
        streetAddress: attraction.attractionAddress,
        location: attraction.attractionLocation
          ? {
              latitude: attraction.attractionLocation.latitude,
              longitude: attraction.attractionLocation.longitude
            }
          : undefined
      },
      category: attraction.attractionCategory,
      type: attraction.attractionType,
      mustVisit: attraction.mustVisit,
      isTraditional: attraction.isTraditional,
      tip: attraction.tip,
      infoFrom: {
        source: attraction.infoFrom,
        recorded: attraction.infoRecorded
      },
      optimalVisitPeriod: attraction.optimalVisitPeriod
        ? {
            fromDate: attraction.optimalVisitPeriod.fromDate,
            toDate: attraction.optimalVisitPeriod.toDate
          }
        : undefined,
      updatedOn: attraction.changedOn
    };
  });
};

export const deleteAttractionWithId = async (id: number): Promise<void> => {
  const { error } = await deleteAttraction({
    path: {
      id: id
    },
    headers: {
      "x-api-version": "1"
    }
  });

  if (error) {
    throw new Error("Error while deleting attraction", error);
  }
};
