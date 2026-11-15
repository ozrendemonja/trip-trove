import { SetURLSearchParams } from "react-router";
import { AttractionVisitStatus } from "../../domain/Attraction.types";
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
import {
  AttractionRow,
  ListAttractionPageInfo
} from "../list-attraction/ListAttraction.types";

const visitStatusRank = (row: AttractionRow | null): number => {
  if (!row) {
    return 4;
  }
  if (row.permanentlyClosedAt) {
    return 3;
  }
  switch (row.visitStatus) {
    case AttractionVisitStatus.VISITED_WANT_RETURN:
      return 1;
    case AttractionVisitStatus.VISITED_DONE:
      return 2;
    default:
      return 0;
  }
};

// Stable sorting preserves the backend's location order within each status.
export const sortAttractionRows = (items: AttractionRow[]): AttractionRow[] =>
  [...items].sort((a, b) => visitStatusRank(a) - visitStatusRank(b));

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
            name: data.name.name,
            under: data.destination.countryName
          };
        });
  }
};
