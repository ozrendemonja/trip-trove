import { DateInputProps } from "../../../../shared/ui/forms/DateInput";
import { SelectFieldProps } from "../../../../shared/ui/forms/SelectField";
import {
  MaskedInputFieldProps,
  InputFieldProps
} from "../../../../shared/ui/forms/InputField";
import { SearchTextProps } from "../../../../shared/search-text/SearchText.types";
import { DateRangePickerProps } from "../../../../shared/list-element/ui/date-picker/DateRangePicker.types";
import type { Period } from "../../../../shared/list-element/ui/date-picker/DateRangePicker.types";
import { AttractionType, CategoryType } from "../../domain/Attraction.types";

// Extended interface
export interface ExtendedSearchTextProps extends SearchTextProps {
  value: number | undefined;
}

// Free-text autocomplete: the form value IS the displayed string
// (used for fields like InformationProvider.sourceName where users may
// type a brand-new value or pick an existing one from suggestions).
export interface ValueSearchTextProps extends SearchTextProps {
  value: string | undefined;
}

export type Location = {
  latitude: number;
  longitude: number;
};

export type AddAttractionFormElements = {
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
};

type FormFields = {
  countryId: ExtendedSearchTextProps;
  regionId: ExtendedSearchTextProps;
  cityId: ExtendedSearchTextProps;
  name: InputFieldProps;
  mainAttractionId: ExtendedSearchTextProps;
  address: InputFieldProps;
  geoLocation: MaskedInputFieldProps;
  category: Omit<SelectFieldProps, "choices"> & { value: CategoryType };
  type: Omit<SelectFieldProps, "choices"> & { value: AttractionType };
  optimalVisitPeriod: DateRangePickerProps;
  tip: InputFieldProps;
  source: ValueSearchTextProps;
  sourceFrom: DateInputProps;
};

// Utility type to enforce that CountryFormFieldProps includes all keys from AddCountryFormElements
type EnsureAllKeys<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : never;
};

// This will cause a TypeScript error if NewType is missing any keys from MainElements
type AllFormFields = EnsureAllKeys<AddAttractionFormElements, FormFields>;

export interface GoogleMapsImportData {
  name?: string;
  address?: string;
  geoLocation: string;
}

export interface AttractionFormFieldProps {
  formFields: AllFormFields;
  isFormValid: boolean;
  prepareForNextSubimssion: () => void;
  applyGoogleMapsData?: (data: GoogleMapsImportData) => void;
}
