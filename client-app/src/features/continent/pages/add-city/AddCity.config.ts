import { ITextFieldProps } from "@fluentui/react";
import { useState } from "react";
import { Validator } from "../../infra/Validator";
import {
  AddCityFormElements,
  CityFormFieldProps,
  ExtendedSearchTextProps
} from "./AddCity.types";
import { searchRegion } from "../../infra/ManagerApi";

export const useCityFormField = (): CityFormFieldProps => {
  const initialTouched = {
    cityName: false,
    regionId: false
  };
  const initialValues: AddCityFormElements = {
    cityName: "",
    regionId: undefined
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const cityNameField: ITextFieldProps = {
    name: "name",
    label: "City name",
    value: values.cityName,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, cityName: true });
      setValues({ ...values, cityName: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.cityName ? errorMessage?.cityNameError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: true
  };

  const regionSearchText: ExtendedSearchTextProps = {
    label: "Select a region",
    placeholder: "Search",
    required: true,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, regionId: true });
      setValues({ ...values, regionId: id });
    },
    onGetErrorMessage: (_value: string) =>
      touched.regionId ? errorMessage?.regionIdError : undefined,
    getSuggestions: searchRegion,
    value: values.regionId
  };

  return {
    formFields: {
      cityName: cityNameField,
      regionId: regionSearchText
    },
    isFormValid: isValid
  };
};

export const useCityDetailsFormField = (): CityFormFieldProps => {
  const initialTouched = {
    cityName: false
  };
  const initialValues: Partial<AddCityFormElements> = {
    cityName: ""
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const cityNameField: ITextFieldProps = {
    name: "name",
    label: "City name",
    value: values.cityName,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, cityName: true });
      setValues({ ...values, cityName: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.cityName ? errorMessage?.cityNameError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: true
  };

  return {
    formFields: {
      cityName: cityNameField
    },
    isFormValid: isValid
  };
};

export const useCityRegionFormField = (): CityFormFieldProps => {
  const initialTouched = {
    regionId: false
  };
  const initialValues: Partial<AddCityFormElements> = {
    regionId: undefined
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const regionSearchText: ExtendedSearchTextProps = {
    label: "Select a region",
    placeholder: "Search",
    required: true,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, regionId: true });
      setValues({ ...values, regionId: id });
    },
    onGetErrorMessage: (_value: string) =>
      touched.regionId ? errorMessage?.regionIdError : undefined,
    getSuggestions: searchRegion,
    value: values.regionId
  };

  return {
    formFields: {
      regionId: regionSearchText
    },
    isFormValid: isValid
  };
};
