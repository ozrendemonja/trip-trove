import { InputFieldProps } from "../../../../shared/ui/forms/InputField";

export type AddContinentFormElements = {
  continentName: string;
};

type FormFields<T> = {
  [K in keyof T]: InputFieldProps;
};

export interface ContinentFormFieldProps {
  formFields: FormFields<AddContinentFormElements>;
  isFormValid: boolean;
}
