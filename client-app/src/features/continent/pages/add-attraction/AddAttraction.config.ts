import {
  addMonths,
  addYears,
  defaultDatePickerStrings,
  IDatePickerProps,
  IDatePickerStrings,
  IDropdownOption,
  IDropdownProps,
  ITextFieldProps
} from "@fluentui/react";
import { useState } from "react";
import { DateRangePickerProps } from "../../../../shared/list-element/ui/date-picker/DateRangePicker.types";
import { AttractionType, CategoryType } from "../../domain/Attraction.types";
import { createAttractionValidation } from "../../infra/AttractionValidationRules";
import {
  searchAttraction,
  searchCity,
  searchCountry,
  searchRegion
} from "../../infra/ManagerApi";
import { Validator } from "../../infra/Validator";
import {
  AddAttractionFormElements,
  AttractionFormFieldProps,
  ExtendedSearchTextProps
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
    address: undefined,
    geoLocation: undefined,
    category: undefined,
    type: undefined,
    tip: undefined,
    source: undefined,
    sourceFrom: undefined,
    optimalVisitPeriod: undefined
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
    onGetErrorMessage: (_value: string) =>
      touched.countryId ? errorMessage?.countryIdError : undefined,
    getSuggestions: searchCountry,
    value: values.countryId
  };

  const regionIdSearchText: ExtendedSearchTextProps = {
    label: "Select a region",
    placeholder: "Search",
    required: false,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, regionId: true });
      setValues({ ...values, regionId: id });
    },
    onGetErrorMessage: (_value: string) =>
      touched.regionId ? errorMessage?.regionIdError : undefined,
    getSuggestions: searchRegion,
    value: values.regionId
  };

  const cityIdSearchText: ExtendedSearchTextProps = {
    label: "Select a city",
    placeholder: "Search",
    required: false,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, cityId: true });
      setValues({ ...values, cityId: id });
    },
    onGetErrorMessage: (_value: string) =>
      touched.cityId ? errorMessage?.cityIdError : undefined,
    getSuggestions: searchCity,
    value: values.cityId
  };

  const attractionNameField: ITextFieldProps = {
    name: "name",
    label: "Attraction name",
    value: values.name,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, name: true });
      setValues({ ...values, name: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.name ? errorMessage?.nameError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
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
    onGetErrorMessage: (_value: string) =>
      touched.mainAttractionId
        ? errorMessage?.mainAttractionIdError
        : undefined,
    getSuggestions: searchAttraction,
    value: values.mainAttractionId
  };

  const attractionAddressField: ITextFieldProps = {
    name: "name",
    label: "Attraction address",
    value: values.address,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, address: true });
      setValues({ ...values, address: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.address ? errorMessage?.addressError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: false
  };

  const geoLocationField: ITextFieldProps = {
    label: "Geo location",
    iconProps: {
      iconName: "POISolid"
    },
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
    onGetErrorMessage: (_value: string) =>
      touched.geoLocation ? errorMessage?.geoLocationError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    required: false
  };

  const categoryDropdown: Omit<IDropdownProps, "options"> & {
    value: CategoryType;
  } = {
    placeholder: "Attraction category",
    label: "Attraction category",
    required: true,
    value: values.category,
    onChange: (
      _event: React.FormEvent<HTMLDivElement>,
      option?: IDropdownOption,
      _index?: number
    ) => {
      setTouched({ ...touched, category: true });
      setValues({ ...values, category: option?.key as CategoryType });
    }
  };

  const typeDropdown: Omit<IDropdownProps, "options"> & {
    value: AttractionType;
  } = {
    placeholder: "Attraction type",
    label: "Attraction type",
    required: true,
    value: values.type,
    onChange: (
      _event: React.FormEvent<HTMLDivElement>,
      option?: IDropdownOption,
      _index?: number
    ) => {
      setTouched({ ...touched, type: true });
      setValues({ ...values, type: option?.key as AttractionType });
    }
  };

  const tipField: ITextFieldProps = {
    name: "name",
    label: "Tip",
    value: values.tip,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, tip: true });
      setValues({ ...values, tip: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.tip ? errorMessage?.tipError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    multiline: true
  };

  const sourceField: ITextFieldProps = {
    name: "source",
    label: "Where information comes from",
    value: values.source,
    required: true,
    onChange: (_event, value: string | undefined): void => {
      setTouched({ ...touched, source: true });
      setValues({ ...values, source: value ?? "" });
    },
    onGetErrorMessage: (_value: string) =>
      touched.source ? errorMessage?.sourceError : undefined,
    validateOnLoad: false,
    validateOnFocusOut: true,
    multiline: true
  };

  const minDate = addYears(new Date(Date.now()), -50);
  const maxDate = new Date(Date.now());
  const dataPickerStrings: IDatePickerStrings = {
    ...defaultDatePickerStrings,
    // eslint-disable-next-line @fluentui/max-len
    isOutOfBoundsErrorMessage: `Date must be between ${minDate.toLocaleDateString()} and ${maxDate.toLocaleDateString()}`
  };
  const sourceFromField: IDatePickerProps = {
    placeholder: "Select recorded date...",
    ariaLabel: "Select recorded date...",
    onSelectDate: (date: Date | null | undefined): void => {
      setTouched({ ...touched, sourceFrom: true });
      setValues({ ...values, sourceFrom: date });
    },
    value: values.sourceFrom,
    isRequired: true,
    strings: dataPickerStrings,
    minDate: minDate,
    maxDate: maxDate,
    allowTextInput: true
  };

  const today = new Date(Date.now());
  const minOptimalDate = addMonths(today, -1);
  const maxOptimalDate = addYears(today, 1);
  const optimalVisitPeriodField: DateRangePickerProps = {
    placeholder: "Select a date...",
    ariaLabel: "Select a date",
    onSelectStartDate: (date: Date | null | undefined): void => {
      setTouched({ ...touched, optimalVisitPeriod: true });
      setValues({
        ...values,
        optimalVisitPeriod: {
          from: date?.toISOString() ?? "",
          to: values.optimalVisitPeriod?.to!
        }
      });
    },
    onSelectEndDate: (date: Date | null | undefined): void => {
      setTouched({ ...touched, optimalVisitPeriod: true });
      setValues({
        ...values,
        optimalVisitPeriod: {
          from: values.optimalVisitPeriod?.from!,
          to: date?.toISOString() ?? ""
        }
      });
    },
    // onGetErrorMessage: (_value: string) =>
    // touched.name ? errorMessage?.sourceFromError : undefined,
    value: values.optimalVisitPeriod,
    // strings: dataPickerStrings,
    minDate: minOptimalDate,
    maxDate: maxOptimalDate,
    allowTextInput: false
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
    isFormValid: isValid
  };
};
