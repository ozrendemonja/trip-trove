import { ITextFieldProps } from "@fluentui/react";
import { useState } from "react";
import { searchCountry } from "../../infra/ManagerApi";
import { Validator } from "../../infra/Validator";
import {
  AddRegionFormElements,
  ExtendedSearchTextProps,
  RegionFormFieldProps
} from "./AddRegion.types";

export const useRegionFormField = (): RegionFormFieldProps => {
  const initialTouched = {
    regionName: false,
    countryId: false
  };
  const initialValues: AddRegionFormElements = {
    regionName: "",
    countryId: undefined
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const regionNameField: ITextFieldProps = {
    name: "name",
    label: "Region name",
    value: values.regionName,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, regionName: true });
      setValues({ ...values, regionName: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.regionName ? errorMessage?.regionNameError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: true
  };

  const countrySearchText: ExtendedSearchTextProps = {
    label: "Select a country",
    placeholder: "Search",
    required: true,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, countryId: true });
      setValues({ ...values, countryId: id });
    },
    onGetErrorMessage: (_value: string) =>
      touched.countryId ? errorMessage?.countryIdError : undefined,
    getSuggestions: searchCountry,
    value: values.countryId
  };

  return {
    formFields: {
      regionName: regionNameField,
      countryId: countrySearchText
    },
    isFormValid: isValid
  };
};

export const useRegionDetailsFormField = (): RegionFormFieldProps => {
  const initialTouched = {
    regionName: false
  };
  const initialValues: Partial<AddRegionFormElements> = {
    regionName: ""
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const regionNameField: ITextFieldProps = {
    name: "name",
    label: "Region name",
    value: values.regionName,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, regionName: true });
      setValues({ ...values, regionName: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.regionName ? errorMessage?.regionNameError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: true
  };

  return {
    formFields: {
      regionName: regionNameField
    },
    isFormValid: isValid
  };
};

export const useRegionCountryFormField = (): RegionFormFieldProps => {
  const initialTouched = {
    countryId: false
  };
  const initialValues: Partial<AddRegionFormElements> = {
    countryId: undefined
  };
  const validator = new Validator();

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const countrySearchText: ExtendedSearchTextProps = {
    label: "Select a country",
    placeholder: "Search",
    required: true,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, countryId: true });
      setValues({ ...values, countryId: id });
    },
    onGetErrorMessage: (_value: string) =>
      touched.countryId ? errorMessage?.countryIdError : undefined,
    getSuggestions: searchCountry,
    value: values.countryId
  };

  return {
    formFields: {
      countryId: countrySearchText
    },
    isFormValid: isValid
  };
};
