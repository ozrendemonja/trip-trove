import { IDropdownProps, ITextFieldProps } from "@fluentui/react";

export type AddCountryFormElements {
  continentName: string;
  countryName: string;
}

type FormFields = {
  continentName: Omit<IDropdownProps, "options">;
  countryName: ITextFieldProps;
};

// Utility type to enforce that CountryFormFieldProps includes all keys from AddCountryFormElements
type EnsureAllKeys<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : never;
};

// This will cause a TypeScript error if NewType is missing any keys from MainElements
type AllFormFields = EnsureAllKeys<AddCountryFormElements, FormFields>;

export interface CountryFormFieldProps {
  formFields: AllFormFields;
  isFormValid: boolean;
}
