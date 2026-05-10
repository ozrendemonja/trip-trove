import {
  IComboBox,
  IComboBoxOption,
  IDropdownOption,
  ITextFieldProps
} from "@fluentui/react";
import { useState } from "react";
import { getIsoCountryOptions } from "../../infra/IsoCountries";
import { Validator } from "../../infra/Validator";
import {
  AddCountryFormElements,
  CountryFormFieldProps
} from "./AddCountry.types";
import { createPlaceValidation } from "../../infra/PlaceValidationRules";

// ComboBox uses option `text` for type-ahead. Putting the country name first
// (e.g. "Belgium (BE)") lets users jump to it by typing the country name.
const buildIsoCodeOptions = (): IComboBoxOption[] =>
  getIsoCountryOptions().map((c) => ({
    key: c.code,
    text: `${c.name} (${c.code.toUpperCase()})`
  }));

export const useCountryFormField = (): CountryFormFieldProps => {
  const initialTouched = {
    countryName: false,
    continentName: false,
    isoCode: false
  };
  const initialValues: AddCountryFormElements = {
    countryName: "",
    continentName: "",
    isoCode: ""
  };
  const validator = new Validator(createPlaceValidation());

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

  const isoCodeDropdown = {
    label: "ISO code",
    placeholder: "Search by country name or ISO code",
    ariaLabel: "Select ISO 3166-1 alpha-2 country code",
    required: true,
    value: values.isoCode,
    selectedKey: values.isoCode || null,
    options: buildIsoCodeOptions(),
    autoComplete: "on" as const,
    allowFreeform: false,
    useComboBoxAsMenuWidth: true,
    errorMessage: touched.isoCode ? errorMessage?.isoCodeError : undefined,
    onChange: (
      _event: React.FormEvent<IComboBox>,
      option?: IComboBoxOption,
      _index?: number,
      _value?: string
    ) => {
      setTouched({ ...touched, isoCode: true });
      setValues({ ...values, isoCode: (option?.key as string) ?? "" });
    }
  };

  return {
    formFields: {
      countryName: countryNameField,
      continentName: continentDropdown,
      isoCode: isoCodeDropdown
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
  const validator = new Validator(createPlaceValidation());

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
  const validator = new Validator(createPlaceValidation());

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

export const useCountryIsoCodeFormField = (): CountryFormFieldProps => {
  const initialTouched = {
    isoCode: false
  };
  const initialValues: AddCountryFormElements = {
    isoCode: ""
  };
  const validator = new Validator(createPlaceValidation());

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const isoCodeDropdown = {
    label: "ISO code",
    placeholder: "Search by country name or ISO code",
    ariaLabel: "Select ISO 3166-1 alpha-2 country code",
    required: true,
    value: values.isoCode,
    selectedKey: values.isoCode || null,
    options: buildIsoCodeOptions(),
    autoComplete: "on" as const,
    allowFreeform: false,
    useComboBoxAsMenuWidth: true,
    errorMessage: touched.isoCode ? errorMessage?.isoCodeError : undefined,
    onChange: (
      _event: React.FormEvent<IComboBox>,
      option?: IComboBoxOption,
      _index?: number,
      _value?: string
    ) => {
      setTouched({ ...touched, isoCode: true });
      setValues({ ...values, isoCode: (option?.key as string) ?? "" });
    }
  };

  return {
    formFields: {
      isoCode: isoCodeDropdown
    },
    isFormValid: isValid
  };
};
