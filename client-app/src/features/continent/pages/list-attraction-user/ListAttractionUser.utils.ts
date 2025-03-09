import { SetURLSearchParams } from "react-router";
import {
  getPagedAttractionsByCityId,
  getPagedAttractionsByContinentName,
  getPagedAttractionsByCountryId,
  getPagedAttractionsByMainAttractionId,
  getPagedAttractionsByRegionId
} from "../../infra/ManagerApi";

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
