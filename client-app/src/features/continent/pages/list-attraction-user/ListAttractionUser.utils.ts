import { SetURLSearchParams } from "react-router";
import {
  getAttractionById,
  getCityById,
  getCountryById,
  getPagedAttractionsByCityId,
  getPagedAttractionsByContinentName,
  getPagedAttractionsByCountryId,
  getPagedAttractionsByMainAttractionId,
  getPagedAttractionsByRegionId,
  getRegionById
} from "../../infra/ManagerApi";
import { ListAttractionPageInfo } from "../list-attraction/ListAttraction.types";

export const stringToBoolean = (str: string | null): boolean | undefined => {
  return str !== null ? str.toLowerCase() === "true" : undefined;
};

export const toggleQueryParam = (
  parameter: string,
  value: string,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams
) => {
  if (searchParams.has(parameter) && searchParams.get(parameter) === value) {
    searchParams.delete(parameter);
  } else {
    searchParams.set(parameter, value);
  }
  setSearchParams(searchParams);
};

const continent = "continent";
const country = "country";
const region = "region";
const city = "city";
export const createGetPagedAttractions = (use?: string) => {
  switch (use) {
    case continent:
      return getPagedAttractionsByContinentName;
    case country:
      return getPagedAttractionsByCountryId;
    case region:
      return getPagedAttractionsByRegionId;
    case city:
      return getPagedAttractionsByCityId;
    default:
      return getPagedAttractionsByMainAttractionId;
  }
};

export const createGetPageInfoById = (
  use?: string
): ((id: number | string) => Promise<ListAttractionPageInfo>) => {
  switch (use) {
    case continent:
      return (id: number | string) => {
        const continentName = id as string;
        return Promise.resolve({ name: continentName, under: "" });
      };
    case country:
      return (id: number | string) =>
        getCountryById(id as number).then((data) => {
          return { name: data.name, under: "" };
        });
    case region:
      return (id: number | string) =>
        getRegionById(id as number).then((data) => {
          return { name: data.name, under: data.inCountry };
        });
    case city:
      return (id: number | string) =>
        getCityById(id as number).then((data) => {
          return { name: data.name, under: data.inCountry };
        });
    default:
      return (id: number | string) =>
        getAttractionById(id as number).then((data) => {
          return {
            name: data.name,
            under: data.destination.countryName
          };
        });
  }
};
