import { ITextFieldProps } from "@fluentui/react";
import { SearchTextProps } from "../../../../shared/search-text/SearchText.types";

// Extended interface
export interface ExtendedSearchTextProps extends SearchTextProps {
  value: number | undefined;
}

export type AddCityFormElements {
  cityName: string;
  regionId: number | undefined;
}

type FormFields = {
  cityName: ITextFieldProps;
  regionId: ExtendedSearchTextProps
};

// Utility type to enforce that CountryFormFieldProps includes all keys from AddCountryFormElements
type EnsureAllKeys<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : never;
};

// This will cause a TypeScript error if NewType is missing any keys from MainElements
type AllFormFields = EnsureAllKeys<AddCityFormElements, FormFields>;

export interface CityFormFieldProps {
  formFields: AllFormFields;
  isFormValid: boolean;
}
