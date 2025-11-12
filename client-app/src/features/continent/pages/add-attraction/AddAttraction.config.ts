import {
  addMonths,
  addYears,
  defaultDatePickerStrings,
  IComboBox,
  IComboBoxOption,
  IComboBoxProps,
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
    address: "",
    geoLocation: undefined,
    category: undefined,
    type: undefined,
    tip: "",
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
    required: true,
    onSelectItem: (id: number | undefined) => {
      setTouched({ ...touched, regionId: true });
      setValues({ ...values, regionId: id });
    },
    onGetErrorMessage: (_value: string) =>
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
    onGetErrorMessage: (_value: string) =>
      touched.cityId ? errorMessage?.cityIdError : undefined,
    getSuggestions: (query: string) => searchCity(query, values.countryId),
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
    placeholder: "Attraction address",
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

  const categoryDropdown: Omit<IComboBoxProps, "options"> & {
    value: CategoryType;
  } = {
    placeholder: "Attraction category",
    label: "Attraction category",
    required: true,
    value: values.category,
    autoComplete: "on",
    onChange: (
      _event: React.FormEvent<IComboBox>,
      option?: IComboBoxOption,
      _index?: number,
      value?: string
    ) => {
      setTouched({ ...touched, category: true });
      setValues({
        ...values,
        category: value ? CategoryType[value] : undefined
      });
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
      setValues({
        ...values,
        type: option?.key ? AttractionType[option.key] : undefined
      });
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

  const sourceFromDataPicker: IDatePickerStrings = {
    ...defaultDatePickerStrings,
    // eslint-disable-next-line @fluentui/max-len
    isOutOfBoundsErrorMessage: "Date must be today or earlier"
  };
  const sourceFromField: IDatePickerProps = {
    placeholder: "Select recorded date...",
    ariaLabel: "Select recorded date...",
    label: "Date of information recording",
    onSelectDate: (date: Date | null | undefined): void => {
      setTouched({ ...touched, sourceFrom: true });
      setValues({ ...values, sourceFrom: date });
    },
    value: values.sourceFrom,
    isRequired: true,
    strings: sourceFromDataPicker,
    maxDate: new Date(Date.now()),
    allowTextInput: true
  };

  const today = new Date(Date.now());
  const minDate = addMonths(today, -1);
  const maxDate = addYears(today, 1);
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
      type: "",
      tip: "",
      optimalVisitPeriod: undefined
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
    prepareForNextSubimssion: prepareForNextSubimssion
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
      onGetErrorMessage: (_value: string) =>
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
      onGetErrorMessage: (_value: string) =>
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
      onGetErrorMessage: (_value: string) =>
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
  const { isValid, errorMessage } = validator.validate(values);

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

  const sourceFromDataPicker: IDatePickerStrings = {
    ...defaultDatePickerStrings,
    // eslint-disable-next-line @fluentui/max-len
    isOutOfBoundsErrorMessage: "Date must be today or earlier"
  };
  const sourceFromField: IDatePickerProps = {
    placeholder: "Select recorded date...",
    ariaLabel: "Select recorded date...",
    label: "Date of information recording",
    onSelectDate: (date: Date | null | undefined): void => {
      setTouched({ ...touched, sourceFrom: true });
      setValues({ ...values, sourceFrom: date });
    },
    value: values.sourceFrom,
    isRequired: true,
    strings: sourceFromDataPicker,
    maxDate: new Date(Date.now()),
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
    const { isValid, errorMessage } = validator.validate(values);

    const today = new Date(Date.now());
    const minDate = addMonths(today, -1);
    const maxDate = addYears(today, 1);
    const optimalVisitPeriodField: DateRangePickerProps = {
      placeholder: "Select a date...",
      ariaLabel: "Select a visit period date",
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
      setValues({
        ...values,
        category: option?.key
          ? CategoryType[CategoryType[option.key]]
          : undefined
      });
    }
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
      setValues({
        ...values,
        type: option?.key
          ? AttractionType[AttractionType[option.key]]
          : undefined
      });
    }
  };

  return {
    formFields: {
      type: typeDropdown
    },
    isFormValid: isValid
  };
};
