import { AddCityFormElements } from "../pages/add-city/AddCity.types";
import { AddContinentFormElements } from "../pages/add-continent/AddContinent.types";
import { AddCountryFormElements } from "../pages/add-country/AddCountry.types";
import { AddRegionFormElements } from "../pages/add-region/AddRegion.types";

export type FormFields =
  | AddContinentFormElements
  | AddCountryFormElements
  | AddRegionFormElements
  | AddCityFormElements;

type ErrorMessages<T> = {
  [K in keyof T as `${K & string}Error`]?: string;
};

export type ErrorMessagesFormFields = ErrorMessages<FormFields>;

export interface ValidationResponse {
  readonly isValid: boolean;
  readonly errorMessage?: ErrorMessagesFormFields;
}
