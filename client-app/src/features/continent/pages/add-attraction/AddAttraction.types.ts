import { IDatePickerProps, IDropdownProps, IMaskedTextFieldProps, ITextFieldProps } from "@fluentui/react";
import { SearchTextProps } from "../../../../shared/search-text/SearchText.types";
import { DateRangePickerProps } from "../../../../shared/list-element/ui/date-picker/DateRangePicker.types";
import { AttractionType, CategoryType } from "../../domain/Attraction.types";

// Extended interface
export interface ExtendedSearchTextProps extends SearchTextProps {
  value: number | undefined;
}

export type Location {
    latitude: number;
    longitude: number;
}

export type Period {
    from: string;
    to: string;
}

export type AddAttractionFormElements {
  countryId: number;
  regionId?: number;
  cityId?: number;
  name: string;
  mainAttractionId?: number;
  mustVisit: boolean;
  address?: string;
  geoLocation?: string;
  category: CategoryType;
 type: AttractionType;
 isTraditional: boolean;
 optimalVisitPeriod?: Period;
 tip?: string;
 source: string;
 sourceFrom: Date | undefined;
}

type FormFields = {
  countryId: ExtendedSearchTextProps;
  regionId: ExtendedSearchTextProps;
  cityId: ExtendedSearchTextProps;
  name: ITextFieldProps;
  mainAttractionId: ExtendedSearchTextProps;
  address: ITextFieldProps;
  geoLocation: IMaskedTextFieldProps,
  category: Omit<IDropdownProps, "options"> & {value: string},
  type: Omit<IDropdownProps, "options"> & {value: string};
  optimalVisitPeriod: DateRangePickerProps;
  tip: ITextFieldProps;
  source: ITextFieldProps;
  sourceFrom: IDatePickerProps;
};

// Utility type to enforce that CountryFormFieldProps includes all keys from AddCountryFormElements
type EnsureAllKeys<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : never;
};

// This will cause a TypeScript error if NewType is missing any keys from MainElements
type AllFormFields = EnsureAllKeys<AddAttractionFormElements, FormFields>;

export interface AttractionFormFieldProps {
  formFields: AllFormFields;
  isFormValid: boolean;
}
