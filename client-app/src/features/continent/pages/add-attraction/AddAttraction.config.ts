import {
  addMonths,
  addYears,
  defaultDatePickerStrings,
  DateInputProps,
  DateInputStrings
} from "../../../../shared/ui/forms/DateInput";
import {
  ComboBoxFieldProps,
  SelectChoice,
  SelectFieldProps
} from "../../../../shared/ui/forms/SelectField";
import { InputFieldProps } from "../../../../shared/ui/forms/InputField";
import { Location24Filled } from "@fluentui/react-icons";
import React, { useState } from "react";
import { DateRangePickerProps } from "../../../../shared/list-element/ui/date-picker/DateRangePicker.types";
import { AttractionType, CategoryType } from "../../domain/Attraction.types";
import { createAttractionValidation } from "../../infra/AttractionValidationRules";
import {
  searchAttraction,
  searchCity,
  searchCountry,
  searchInformationProvider,
  searchRegion
} from "../../infra/ManagerApi";
import { Validator } from "../../infra/Validator";
import {
  AddAttractionFormElements,
  AttractionFormFieldProps,
  ExtendedSearchTextProps,
  GoogleMapsImportData,
  ValueSearchTextProps
} from "./AddAttraction.types";

export const useAttractionFormField = (): AttractionFormFieldProps => {
  const initialTouched = {
    countryId: false,
    regionId: false,
    cityId: false,
    name: false,
    mainAttractionId: false,
    address: false,
    geoLocation: false,
    category: false,
    type: false,
    tip: false,
    source: false,
    sourceFrom: false,
    optimalVisitPeriod: false
  };
  const initialValues: AddAttractionFormElements = {
    countryId: undefined,
    regionId: undefined,
    cityId: undefined,
    name: undefined,
    mainAttractionId: undefined,
    address: "",
    geoLocation: undefined,
    category: undefined,
    type: AttractionType.STABLE,
    tip: "",
    source: undefined,
    sourceFrom: undefined,
    optimalVisitPeriod: undefined
  };
  const validator = new Validator(createAttractionValidation());

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const [today] = useState(() => new Date());
  const { isValid, errorMessage } = validator.validate(values);

  const countryIdSearchText: ExtendedSearchTextProps = {
    label: "Select a country",
    placeholder: "Search",
    required: true,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, countryId: true });
      setValues({ ...values, countryId: id });
    },
    validate: (_value: string) =>
      touched.countryId ? errorMessage?.countryIdError : undefined,
    getSuggestions: searchCountry,
    value: values.countryId
  };

  const regionIdSearchText: ExtendedSearchTextProps = {
    label: "Select a region",
    placeholder: "Search",
    required: true,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, regionId: true });
      setValues({ ...values, regionId: id });
    },
    validate: (_value: string) =>
      touched.regionId ? errorMessage?.regionIdError : undefined,
    getSuggestions: (query: string) => searchRegion(query, values.countryId),
    value: values.regionId
  };

  const cityIdSearchText: ExtendedSearchTextProps = {
    label: "Select a city",
    placeholder: "Search",
    required: true,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, cityId: true });
      setValues({ ...values, cityId: id });
    },
    validate: (_value: string) =>
      touched.cityId ? errorMessage?.cityIdError : undefined,
    getSuggestions: (query: string) => searchCity(query, values.countryId),
    value: values.cityId
  };

  const attractionNameField: InputFieldProps = {
    name: "name",
    label: "Attraction name",
    value: values.name,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, name: true });
      setValues({ ...values, name: value ?? "" });
    },
    validate: (_value: string) =>
      touched.name ? errorMessage?.nameError : undefined,
    validateOnBlur: true,
    required: true
  };

  const mainAttractionIdSearchText: ExtendedSearchTextProps = {
    label: "Select main attraction name",
    placeholder: "Search",
    required: false,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, mainAttractionId: true });
      setValues({ ...values, mainAttractionId: id });
    },
    validate: (_value: string) =>
      touched.mainAttractionId
        ? errorMessage?.mainAttractionIdError
        : undefined,
    getSuggestions: searchAttraction,
    value: values.mainAttractionId
  };

  const attractionAddressField: InputFieldProps = {
    name: "name",
    label: "Attraction address",
    placeholder: "Attraction address",
    value: values.address,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, address: true });
      setValues({ ...values, address: value ?? "" });
    },
    validate: (_value: string) =>
      touched.address ? errorMessage?.addressError : undefined,
    validateOnBlur: true,
    required: false
  };

  const geoLocationField: InputFieldProps = {
    label: "Geo location",
    icon: React.createElement(Location24Filled),
    placeholder: "Latitude, Longitude",
    name: "geoLocation",
    value: values.geoLocation,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, geoLocation: true });
      setValues({
        ...values,
        geoLocation: value ?? ""
      });
    },
    validate: (_value: string) =>
      touched.geoLocation ? errorMessage?.geoLocationError : undefined,
    validateOnBlur: true,
    required: false
  };

  const categoryDropdown: Omit<ComboBoxFieldProps, "choices"> & {
    value: CategoryType;
  } = {
    placeholder: "Attraction category",
    label: "Attraction category",
    required: true,
    selectedValue: values.category,
    onOptionSelect: (
      _event: React.FormEvent<HTMLElement>,
      _choice?: SelectChoice,
      inputValue?: string
    ) => {
      setTouched({ ...touched, category: true });
      setValues({
        ...values,
        category: inputValue ? CategoryType[inputValue] : undefined
      });
    },
    value: values.category
  };

  const typeDropdown: Omit<SelectFieldProps, "choices"> & {
    value: AttractionType;
  } = {
    placeholder: "Attraction type",
    label: "Attraction type",
    required: true,
    selectedValue: values.type,
    onOptionSelect: (
      _event: React.FormEvent<HTMLElement>,
      choice?: SelectChoice
    ) => {
      setTouched({ ...touched, type: true });
      setValues({
        ...values,
        type: choice?.value ? AttractionType[choice.value] : undefined
      });
    },
    value: values.type
  };

  const tipField: InputFieldProps = {
    name: "name",
    label: "Tip",
    value: values.tip,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, tip: true });
      setValues({ ...values, tip: value ?? "" });
    },
    validate: (_value: string) =>
      touched.tip ? errorMessage?.tipError : undefined,
    validateOnBlur: true,
    multiline: true
  };

  const sourceField: ValueSearchTextProps = {
    label: "Where information comes from",
    placeholder: "Search or type a new source",
    required: true,
    multiline: true,
    onSelectItem: (_id: number | undefined) => {
      // Free-text field: the value IS the displayed string;
      // selecting a suggestion fills it via onSelectValue below.
    },
    onSelectValue: (value: string) => {
      setTouched({ ...touched, source: true });
      setValues({ ...values, source: value });
    },
    validate: (_value: string) =>
      touched.source ? errorMessage?.sourceError : undefined,
    getSuggestions: searchInformationProvider,
    value: values.source
  };

  const sourceFromDataPicker: DateInputStrings = {
    ...defaultDatePickerStrings,
    isOutOfBoundsErrorMessage: "Date must be today or earlier"
  };
  const sourceFromField: DateInputProps = {
    placeholder: "Select recorded date...",
    "aria-label": "Select recorded date...",
    label: "Date of information recording",
    onChange: (date: Date | null | undefined): void => {
      setTouched({ ...touched, sourceFrom: true });
      setValues({ ...values, sourceFrom: date });
    },
    value: values.sourceFrom,
    required: true,
    strings: sourceFromDataPicker,
    maxDate: today,
    allowTextInput: true
  };

  const minDate = addMonths(today, -1);
  const maxDate = addYears(today, 1);
  const optimalVisitPeriodField: DateRangePickerProps = {
    placeholder: "Select a date...",
    "aria-label": "Select a date",
    onStartDateChange: (date: Date | null | undefined): void => {
      setTouched({ ...touched, optimalVisitPeriod: true });
      setValues((currentValues) => ({
        ...currentValues,
        optimalVisitPeriod: {
          from: date?.toISOString() ?? "",
          to: currentValues.optimalVisitPeriod?.to ?? ""
        }
      }));
    },
    onEndDateChange: (date: Date | null | undefined): void => {
      setTouched({ ...touched, optimalVisitPeriod: true });
      setValues((currentValues) => ({
        ...currentValues,
        optimalVisitPeriod: {
          from: currentValues.optimalVisitPeriod?.from ?? "",
          to: date?.toISOString() ?? ""
        }
      }));
    },
    value: values.optimalVisitPeriod,
    minDate: minDate,
    maxDate: maxDate,
    allowTextInput: false
  };

  const prepareForNextSubimssion = (): void => {
    setTouched({
      ...touched,
      name: false,
      mainAttractionId: false,
      address: false,
      geoLocation: false,
      category: false,
      type: false,
      tip: false,
      optimalVisitPeriod: false
    });
    setValues({
      ...values,
      name: "",
      mainAttractionId: undefined,
      address: "",
      geoLocation: "",
      category: "",
      type: AttractionType.STABLE,
      tip: "",
      optimalVisitPeriod: undefined
    });
  };

  const applyGoogleMapsData = (data: GoogleMapsImportData): void => {
    setTouched({
      ...touched,
      ...(data.name !== undefined ? { name: true } : {}),
      ...(data.address !== undefined ? { address: true } : {}),
      geoLocation: true
    });
    setValues({
      ...values,
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      geoLocation: data.geoLocation
    });
  };

  return {
    formFields: {
      countryId: countryIdSearchText,
      regionId: regionIdSearchText,
      cityId: cityIdSearchText,
      name: attractionNameField,
      mainAttractionId: mainAttractionIdSearchText,
      address: attractionAddressField,
      geoLocation: geoLocationField,
      category: categoryDropdown,
      type: typeDropdown,
      tip: tipField,
      source: sourceField,
      sourceFrom: sourceFromField,
      optimalVisitPeriod: optimalVisitPeriodField
    },
    isFormValid: isValid,
    prepareForNextSubimssion: prepareForNextSubimssion,
    applyGoogleMapsData: applyGoogleMapsData
  };
};

export const useAttractionDetailsFormField = (): AttractionFormFieldProps => {
  const initialTouched = {
    name: false,
    mainAttractionId: false
  };
  const initialValues: AddAttractionFormElements = {
    name: undefined,
    mainAttractionId: undefined
  };
  const validator = new Validator(createAttractionValidation());

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const attractionNameField: InputFieldProps = {
    name: "name",
    label: "Attraction name",
    value: values.name,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, name: true });
      setValues({ ...values, name: value ?? "" });
    },
    validate: (_value: string) =>
      touched.name ? errorMessage?.nameError : undefined,
    validateOnBlur: true,
    required: true
  };

  const mainAttractionIdSearchText: ExtendedSearchTextProps = {
    label: "Select main attraction name",
    placeholder: "Search",
    required: false,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, mainAttractionId: true });
      setValues({ ...values, mainAttractionId: id });
    },
    validate: (_value: string) =>
      touched.mainAttractionId
        ? errorMessage?.mainAttractionIdError
        : undefined,
    getSuggestions: searchAttraction,
    value: values.mainAttractionId
  };

  return {
    formFields: {
      name: attractionNameField,
      mainAttractionId: mainAttractionIdSearchText
    },
    isFormValid: isValid
  };
};

export const useAttractionDestinationFormField =
  (): AttractionFormFieldProps => {
    const initialTouched = {
      countryId: false,
      regionId: false,
      cityId: false
    };
    const initialValues: AddAttractionFormElements = {
      countryId: undefined,
      regionId: undefined,
      cityId: undefined
    };
    const validator = new Validator(createAttractionValidation());

    const [touched, setTouched] = useState(initialTouched);
    const [values, setValues] = useState(initialValues);
    const { isValid, errorMessage } = validator.validate(values);

    const countryIdSearchText: ExtendedSearchTextProps = {
      label: "Select a country",
      placeholder: "Search",
      required: true,
      onSelectItem: (id: number | undefined) => {
        setTouched({ ...touched, countryId: true });
        setValues({ ...values, countryId: id });
      },
      validate: (_value: string) =>
        touched.countryId ? errorMessage?.countryIdError : undefined,
      getSuggestions: searchCountry,
      value: values.countryId
    };

    const regionIdSearchText: ExtendedSearchTextProps = {
      label: "Select a region",
      placeholder: "Search",
      required: true,
      onSelectItem: (id: number | undefined) => {
        setTouched({ ...touched, regionId: true });
        setValues({ ...values, regionId: id });
      },
      validate: (_value: string) =>
        touched.regionId ? errorMessage?.regionIdError : undefined,
      getSuggestions: searchRegion,
      value: values.regionId
    };

    const cityIdSearchText: ExtendedSearchTextProps = {
      label: "Select a city",
      placeholder: "Search",
      required: true,
      onSelectItem: (id: number | undefined) => {
        setTouched({ ...touched, cityId: true });
        setValues({ ...values, cityId: id });
      },
      validate: (_value: string) =>
        touched.cityId ? errorMessage?.cityIdError : undefined,
      getSuggestions: searchCity,
      value: values.cityId
    };

    return {
      formFields: {
        countryId: countryIdSearchText,
        regionId: regionIdSearchText,
        cityId: cityIdSearchText
      },
      isFormValid: isValid
    };
  };

export const useAttractionAddressFormField = (): AttractionFormFieldProps => {
  const initialTouched = {
    address: false,
    geoLocation: false
  };
  const initialValues: AddAttractionFormElements = {
    address: undefined,
    geoLocation: undefined
  };
  const validator = new Validator(createAttractionValidation());

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const attractionAddressField: InputFieldProps = {
    name: "name",
    label: "Attraction address",
    value: values.address,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, address: true });
      setValues({ ...values, address: value ?? "" });
    },
    validate: (_value: string) =>
      touched.address ? errorMessage?.addressError : undefined,
    validateOnBlur: true,
    required: false
  };

  const geoLocationField: InputFieldProps = {
    label: "Geo location",
    icon: React.createElement(Location24Filled),
    placeholder: "Latitude, Longitude",
    name: "geoLocation",
    value: values.geoLocation,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, geoLocation: true });
      setValues({
        ...values,
        geoLocation: value ?? ""
      });
    },
    validate: (_value: string) =>
      touched.geoLocation ? errorMessage?.geoLocationError : undefined,
    validateOnBlur: true,
    required: false
  };

  return {
    formFields: {
      address: attractionAddressField,
      geoLocation: geoLocationField
    },
    isFormValid: isValid
  };
};

export const useAttractionInfoFromFormField = (): AttractionFormFieldProps => {
  const initialTouched = {
    source: false,
    sourceFrom: false
  };
  const initialValues: AddAttractionFormElements = {
    source: undefined,
    sourceFrom: undefined
  };
  const validator = new Validator(createAttractionValidation());

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const [today] = useState(() => new Date());
  const { isValid, errorMessage } = validator.validate(values);

  const sourceField: ValueSearchTextProps = {
    label: "Where information comes from",
    placeholder: "Search or type a new source",
    required: true,
    multiline: true,
    onSelectItem: (_id: number | undefined) => {
      // Free-text field: the value IS the displayed string;
      // selecting a suggestion fills it via onSelectValue below.
    },
    onSelectValue: (value: string) => {
      setTouched({ ...touched, source: true });
      setValues({ ...values, source: value });
    },
    validate: (_value: string) =>
      touched.source ? errorMessage?.sourceError : undefined,
    getSuggestions: searchInformationProvider,
    value: values.source
  };

  const sourceFromDataPicker: DateInputStrings = {
    ...defaultDatePickerStrings,
    isOutOfBoundsErrorMessage: "Date must be today or earlier"
  };
  const sourceFromField: DateInputProps = {
    placeholder: "Select recorded date...",
    "aria-label": "Select recorded date...",
    label: "Date of information recording",
    onChange: (date: Date | null | undefined): void => {
      setTouched({ ...touched, sourceFrom: true });
      setValues({ ...values, sourceFrom: date });
    },
    value: values.sourceFrom,
    required: true,
    strings: sourceFromDataPicker,
    maxDate: today,
    allowTextInput: true
  };

  return {
    formFields: {
      source: sourceField,
      sourceFrom: sourceFromField
    },
    isFormValid: isValid
  };
};

export const useAttractionVisitPeriodFormField =
  (): AttractionFormFieldProps => {
    const initialTouched = {
      optimalVisitPeriod: false
    };
    const initialValues: AddAttractionFormElements = {
      optimalVisitPeriod: undefined
    };
    const validator = new Validator(createAttractionValidation());

    const [touched, setTouched] = useState(initialTouched);
    const [values, setValues] = useState(initialValues);
    const [today] = useState(() => new Date());
    const { isValid, errorMessage } = validator.validate(values);

    const minDate = addMonths(today, -1);
    const maxDate = addYears(today, 1);
    const optimalVisitPeriodField: DateRangePickerProps = {
      placeholder: "Select a date...",
      "aria-label": "Select a visit period date",
      onStartDateChange: (date: Date | null | undefined): void => {
        setTouched({ ...touched, optimalVisitPeriod: true });
        setValues((currentValues) => ({
          ...currentValues,
          optimalVisitPeriod: {
            from: date?.toISOString() ?? "",
            to: currentValues.optimalVisitPeriod?.to ?? ""
          }
        }));
      },
      onEndDateChange: (date: Date | null | undefined): void => {
        setTouched({ ...touched, optimalVisitPeriod: true });
        setValues((currentValues) => ({
          ...currentValues,
          optimalVisitPeriod: {
            from: currentValues.optimalVisitPeriod?.from ?? "",
            to: date?.toISOString() ?? ""
          }
        }));
      },
      value: values.optimalVisitPeriod,
      minDate: minDate,
      maxDate: maxDate,
      allowTextInput: false
    };

    return {
      formFields: {
        optimalVisitPeriod: optimalVisitPeriodField
      },
      isFormValid: isValid
    };
  };

export const useAttractionTipFormField = (): AttractionFormFieldProps => {
  const initialTouched = {
    tip: false
  };
  const initialValues: AddAttractionFormElements = {
    tip: undefined
  };
  const validator = new Validator(createAttractionValidation());

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const tipField: InputFieldProps = {
    name: "name",
    label: "Tip",
    value: values.tip,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, tip: true });
      setValues({ ...values, tip: value ?? "" });
    },
    validate: (_value: string) =>
      touched.tip ? errorMessage?.tipError : undefined,
    validateOnBlur: true,
    multiline: true
  };

  return {
    formFields: {
      tip: tipField
    },
    isFormValid: isValid
  };
};

export const useAttractionCategoryFormField = (): AttractionFormFieldProps => {
  const initialTouched = {
    category: false
  };
  const initialValues: AddAttractionFormElements = {
    category: undefined
  };
  const validator = new Validator(createAttractionValidation());

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const categoryDropdown: Omit<SelectFieldProps, "choices"> & {
    value: CategoryType;
  } = {
    placeholder: "Attraction category",
    label: "Attraction category",
    required: true,
    selectedValue: values.category,
    onOptionSelect: (
      _event: React.FormEvent<HTMLElement>,
      choice?: SelectChoice
    ) => {
      setTouched({ ...touched, category: true });
      setValues({
        ...values,
        category: choice?.value
          ? CategoryType[CategoryType[choice.value]]
          : undefined
      });
    },
    value: values.category
  };

  return {
    formFields: {
      category: categoryDropdown
    },
    isFormValid: isValid
  };
};

export const useAttractionTypeFormField = (): AttractionFormFieldProps => {
  const initialTouched = {
    type: false
  };
  const initialValues: AddAttractionFormElements = {
    type: undefined
  };
  const validator = new Validator(createAttractionValidation());

  const [touched, setTouched] = useState(initialTouched);
  const [values, setValues] = useState(initialValues);
  const { isValid, errorMessage } = validator.validate(values);

  const typeDropdown: Omit<SelectFieldProps, "choices"> & {
    value: AttractionType;
  } = {
    placeholder: "Attraction type",
    label: "Attraction type",
    required: true,
    selectedValue: values.type,
    onOptionSelect: (
      _event: React.FormEvent<HTMLElement>,
      choice?: SelectChoice
    ) => {
      setTouched({ ...touched, type: true });
      setValues({
        ...values,
        type: choice?.value
          ? AttractionType[AttractionType[choice.value]]
          : undefined
      });
    },
    value: values.type
  };

  return {
    formFields: {
      type: typeDropdown
    },
    isFormValid: isValid
  };
};
