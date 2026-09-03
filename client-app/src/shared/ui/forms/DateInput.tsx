import { Field } from "@fluentui/react-components";
import {
  DatePicker,
  defaultDatePickerStrings
} from "@fluentui/react-datepicker-compat";
import React from "react";

type FluentDatePickerProps = React.ComponentProps<typeof DatePicker>;

export type DateInputProps = Omit<
  FluentDatePickerProps,
  "onChange" | "onSelectDate" | "value" | "required"
> & {
  label?: string;
  "aria-label"?: string;
  required?: boolean;
  errorMessage?: string;
  className?: string;
  value?: Date;
  onChange?: (date: Date | null | undefined) => void;
};

export type DateInputStrings = NonNullable<FluentDatePickerProps["strings"]>;

export const DateInput: React.FC<DateInputProps> = ({
  label,
  "aria-label": ariaLabel,
  required,
  errorMessage,
  className,
  value,
  onChange,
  ...restProps
}) => (
  <Field
    label={label}
    required={required}
    validationState={errorMessage ? "error" : "none"}
    validationMessage={errorMessage}
  >
    <DatePicker
      {...restProps}
      aria-label={ariaLabel ?? label}
      required={required}
      className={className}
      value={value ?? null}
      onSelectDate={onChange}
    />
  </Field>
);

export { defaultDatePickerStrings };

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};
