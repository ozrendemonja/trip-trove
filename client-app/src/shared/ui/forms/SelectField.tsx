import { Combobox, Dropdown, Field, Option } from "@fluentui/react-components";
import React, { useState } from "react";

export interface SelectChoice {
  value: string | number;
  label: string;
  disabled?: boolean;
  data?: unknown;
}

type SharedSelectProps = {
  choices?: SelectChoice[];
  label?: string;
  placeholder?: string;
  "aria-label"?: string;
  required?: boolean;
  disabled?: boolean;
  selectedValue?: string | number | null;
  selectedValuePrefix?: string;
  defaultValue?: string | number;
  className?: string;
  style?: React.CSSProperties;
  errorMessage?: string;
  allowFreeform?: boolean;
  onOptionSelect?: (
    event: React.FormEvent<HTMLElement>,
    choice?: SelectChoice,
    inputValue?: string
  ) => void;
};

export type SelectFieldProps = SharedSelectProps;
export type ComboBoxFieldProps = SharedSelectProps;

const getSelectedChoice = (
  choices: SelectChoice[],
  selectedValue?: string | number | null
): SelectChoice | undefined =>
  choices.find((choice) => String(choice.value) === String(selectedValue));

const SelectFieldControl: React.FC<
  SharedSelectProps & { editable?: boolean }
> = ({
  choices = [],
  label,
  placeholder,
  "aria-label": ariaLabel,
  required,
  disabled,
  selectedValue,
  selectedValuePrefix,
  defaultValue,
  className,
  style,
  errorMessage,
  allowFreeform,
  onOptionSelect,
  editable
}) => {
  const selectedChoice = getSelectedChoice(choices, selectedValue);
  const [comboboxValue, setComboboxValue] = useState<string>(
    selectedChoice?.label ?? ""
  );

  if (editable) {
    return (
      <Field
        label={label}
        required={required}
        validationState={errorMessage ? "error" : "none"}
        validationMessage={errorMessage}
        className={className}
        style={style}
      >
        <Combobox
          aria-label={label ?? ariaLabel}
          placeholder={placeholder}
          disabled={disabled}
          freeform={allowFreeform}
          selectedOptions={
            selectedValue === undefined || selectedValue === null
              ? []
              : [String(selectedValue)]
          }
          defaultSelectedOptions={
            defaultValue === undefined ? undefined : [String(defaultValue)]
          }
          value={selectedChoice?.label ?? comboboxValue}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            setComboboxValue(nextValue);
            if (allowFreeform) {
              onOptionSelect?.(
                event as React.FormEvent<HTMLElement>,
                undefined,
                nextValue
              );
            }
          }}
          onOptionSelect={(event, data) => {
            const choice = choices.find(
              (candidate) =>
                String(candidate.value) === String(data.optionValue)
            );
            const inputValue =
              choice?.label ?? data.optionText ?? comboboxValue;
            setComboboxValue(inputValue);
            onOptionSelect?.(
              event as React.FormEvent<HTMLElement>,
              choice,
              inputValue
            );
          }}
        >
          {choices.map((choice) => (
            <Option
              key={String(choice.value)}
              value={String(choice.value)}
              disabled={choice.disabled}
            >
              {choice.label}
            </Option>
          ))}
        </Combobox>
      </Field>
    );
  }

  return (
    <Field
      label={label}
      required={required}
      validationState={errorMessage ? "error" : "none"}
      validationMessage={errorMessage}
      className={className}
      style={style}
    >
      <Dropdown
        aria-label={label ?? ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        selectedOptions={
          selectedValue === undefined || selectedValue === null
            ? []
            : [String(selectedValue)]
        }
        defaultSelectedOptions={
          defaultValue === undefined ? undefined : [String(defaultValue)]
        }
        value={
          selectedChoice
            ? `${selectedValuePrefix ?? ""}${selectedChoice.label}`
            : ""
        }
        onOptionSelect={(event, data) => {
          const choice = choices.find(
            (candidate) => String(candidate.value) === String(data.optionValue)
          );
          onOptionSelect?.(
            event as React.FormEvent<HTMLElement>,
            choice,
            choice?.label ?? data.optionText
          );
        }}
      >
        {choices.map((choice) => (
          <Option
            key={String(choice.value)}
            value={String(choice.value)}
            disabled={choice.disabled}
          >
            {choice.label}
          </Option>
        ))}
      </Dropdown>
    </Field>
  );
};

export const SelectField: React.FC<SelectFieldProps> = (props) => (
  <SelectFieldControl {...props} />
);

export const ComboBoxField: React.FC<ComboBoxFieldProps> = (props) => (
  <SelectFieldControl {...props} editable />
);
