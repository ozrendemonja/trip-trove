import { SelectChoice } from "../../../../shared/ui/forms/SelectField";
import { InputFieldProps } from "../../../../shared/ui/forms/InputField";
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
const buildIsoCodeOptions = (): SelectChoice[] =>
  getIsoCountryOptions().map((c) => ({
    value: c.code,
    label: `${c.name} (${c.code.toUpperCase()})`
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

  const countryNameField: InputFieldProps = {
    name: "name",
    label: "Country name",
    value: values.countryName,
    onChange: (_event, value: string | undefined): void => {
      setTouched((current) => ({ ...current, countryName: true }));
      setValues((current) => ({ ...current, countryName: value ?? "" }));
    },
    validate: (_value: string) =>
      touched.countryName ? errorMessage?.countryNameError : undefined,
    validateOnBlur: true,
    required: true
  };

  const continentDropdown = {
    placeholder: "Select a continent",
    "aria-label": "Select a continent",
    required: true,
    selectedValue: values.continentName,
    onOptionSelect: (
      _event: React.FormEvent<HTMLElement>,
      choice?: SelectChoice
    ) => {
      setTouched((current) => ({ ...current, continentName: true }));
      setValues((current) => ({
        ...current,
        continentName: String(choice?.value ?? "")
      }));
    },
    value: values.continentName
  };

  const isoCodeDropdown = {
    label: "ISO code",
    placeholder: "Search by country name or ISO code",
    "aria-label": "Select ISO 3166-1 alpha-2 country code",
    required: true,
    selectedValue: values.isoCode || null,
    choices: buildIsoCodeOptions(),
    allowFreeform: false,
    errorMessage: touched.isoCode ? errorMessage?.isoCodeError : undefined,
    onOptionSelect: (
      _event: React.FormEvent<HTMLElement>,
      choice?: SelectChoice
    ) => {
      setTouched((current) => ({ ...current, isoCode: true }));
      setValues((current) => ({
        ...current,
        isoCode: String(choice?.value ?? "")
      }));
    },
    value: values.isoCode
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

  const countryNameField: InputFieldProps = {
    name: "name",
    label: "Country name",
    value: values.countryName,
    onChange: (_event, value: string | undefined): void => {
      setTouched((current) => ({ ...current, countryName: true }));
      setValues((current) => ({ ...current, countryName: value ?? "" }));
    },
    validate: (_value: string) =>
      touched.countryName ? errorMessage?.countryNameError : undefined,
    validateOnBlur: true,
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
    "aria-label": "Select a continent",
    required: true,
    selectedValue: values.continentName,
    onOptionSelect: (
      _event: React.FormEvent<HTMLElement>,
      choice?: SelectChoice
    ) => {
      setTouched((current) => ({ ...current, continentName: true }));
      setValues((current) => ({
        ...current,
        continentName: String(choice?.value ?? "")
      }));
    },
    value: values.continentName
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
    "aria-label": "Select ISO 3166-1 alpha-2 country code",
    required: true,
    selectedValue: values.isoCode || null,
    choices: buildIsoCodeOptions(),
    allowFreeform: false,
    errorMessage: touched.isoCode ? errorMessage?.isoCodeError : undefined,
    onOptionSelect: (
      _event: React.FormEvent<HTMLElement>,
      choice?: SelectChoice
    ) => {
      setTouched((current) => ({ ...current, isoCode: true }));
      setValues((current) => ({
        ...current,
        isoCode: String(choice?.value ?? "")
      }));
    },
    value: values.isoCode
  };

  return {
    formFields: {
      isoCode: isoCodeDropdown
    },
    isFormValid: isValid
  };
};
