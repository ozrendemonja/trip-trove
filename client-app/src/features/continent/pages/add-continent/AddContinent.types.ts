import { ITextFieldProps } from "@fluentui/react";

export type AddContinentFormElements {
  continentName: string;
}

type FormFields<T> = {
  [K in keyof T]: ITextFieldProps;
};

export interface ContinentFormFieldProps {
  formFields: FormFields<AddContinentFormElements>;
  isFormValid: boolean;
}
