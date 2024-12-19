import { useState } from "react";
import {
  AddContinentFormElements,
  ContinentFormFieldProps
} from "./AddContinent.types";
import { Validator } from "../../infra/Validator";

export const useContinentFormField = (): ContinentFormFieldProps => {
  const initialTouched = {
    continentName: false
  };
  const initialValues: AddContinentFormElements = {
    continentName: ""
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const continentNameField = {
    name: "name",
    label: "Continent name",
    value: values.continentName,
    onChange: (_, value: string) => {
      setTouched({ ...touched, continentName: true });
      setValues({ ...values, continentName: value || "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.continentName ? errorMessage : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: true
  };

  return {
    formFields: {
      continentName: continentNameField
    },
    isFormValid: isValid
  };
};
