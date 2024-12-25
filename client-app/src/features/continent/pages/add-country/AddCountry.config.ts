import {
  IDropdownOption,
  IDropdownProps,
  ITextFieldProps
} from "@fluentui/react";
import { useState } from "react";
import { Validator } from "../../infra/Validator";
import {
  AddCountryFormElements,
  CountryFormFieldProps
} from "./AddCountry.types";

export const useCountryFormField = (): CountryFormFieldProps => {
  const initialTouched = {
    countryName: false,
    continentName: false
  };
  const initialValues: AddCountryFormElements = {
    countryName: "",
    continentName: ""
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const countryNameField: ITextFieldProps = {
    name: "name",
    label: "Country name",
    value: values.countryName,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, countryName: true });
      setValues({ ...values, countryName: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.countryName ? errorMessage?.countryNameError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: true
  };

  const continentDropdown = {
    placeholder: "Select a continent",
    ariaLabel: "Select a continent",
    required: true,
    value: values.continentName,
    onChange: (
      _event: React.FormEvent<HTMLDivElement>,
      option?: IDropdownOption,
      _index?: number
    ) => {
      setTouched({ ...touched, continentName: true });
      setValues({ ...values, continentName: option?.key as string });
    }
  };

  return {
    formFields: {
      countryName: countryNameField,
      continentName: continentDropdown
    },
    isFormValid: isValid
  };
};

export const useCountryDetailsFormField = (): CountryFormFieldProps => {
  const initialTouched = {
    countryName: false
  };
  const initialValues: AddCountryFormElements = {
    countryName: ""
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const countryNameField: ITextFieldProps = {
    name: "name",
    label: "Country name",
    value: values.countryName,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, countryName: true });
      setValues({ ...values, countryName: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.countryName ? errorMessage?.countryNameError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: true
  };

  return {
    formFields: {
      countryName: countryNameField
    },
    isFormValid: isValid
  };
};

export const useCountryContinentFormField = (): CountryFormFieldProps => {
  const initialTouched = {
    continentName: false
  };
  const initialValues: AddCountryFormElements = {
    continentName: ""
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const continentDropdown = {
    placeholder: "Select a continent",
    ariaLabel: "Select a continent",
    required: true,
    value: values.continentName,
    onChange: (
      _event: React.FormEvent<HTMLDivElement>,
      option?: IDropdownOption,
      _index?: number
    ) => {
      setTouched({ ...touched, continentName: true });
      setValues({ ...values, continentName: option?.key as string });
    }
  };

  return {
    formFields: {
      continentName: continentDropdown
    },
    isFormValid: isValid
  };
};
