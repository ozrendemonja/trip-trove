import { InputFieldProps } from "../../../../shared/ui/forms/InputField";
import { AutocompleteFieldProps } from "../../../../shared/autocomplete-field/AutocompleteField.types";

// Extended interface
export interface ExtendedAutocompleteFieldProps extends AutocompleteFieldProps {
  value: number | undefined;
}

export type AddRegionFormElements = {
  regionName: string;
  countryId: number | undefined;
};

type FormFields = {
  regionName: InputFieldProps;
  countryId: ExtendedAutocompleteFieldProps;
};

// Utility type to enforce that CountryFormFieldProps includes all keys from AddCountryFormElements
type EnsureAllKeys<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : never;
};

// This will cause a TypeScript error if NewType is missing any keys from MainElements
type AllFormFields = EnsureAllKeys<AddRegionFormElements, FormFields>;

export interface RegionFormFieldProps {
  formFields: AllFormFields;
  isFormValid: boolean;
}
