import { Field, Input, Textarea } from "@fluentui/react-components";
import React, { useImperativeHandle, useRef, useState } from "react";

export interface InputFieldHandle {
  focus(): void;
}

type InputNativeProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
>;
type TextareaNativeProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange"
>;

export type InputFieldProps = InputNativeProps &
  TextareaNativeProps & {
    label?: string;
    errorMessage?: string;
    validate?: (value: string) => string | undefined;
    validateOnBlur?: boolean;
    showRequiredIndicator?: boolean;
    multiline?: boolean;
    rows?: number;
    onChange?: (
      event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
      value?: string
    ) => void;
    icon?: React.ReactNode;
    prefix?: string;
  };

export type MaskedInputFieldProps = InputFieldProps;

export const InputField = React.forwardRef<InputFieldHandle, InputFieldProps>(
  (
    {
      label,
      required,
      showRequiredIndicator,
      value,
      defaultValue,
      multiline,
      rows,
      errorMessage,
      validate,
      validateOnBlur,
      onChange,
      onBlur,
      icon,
      prefix,
      id,
      className,
      style,
      ...restProps
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const generatedId = React.useId();
    const controlId = id ?? generatedId;
    const [hasBlurred, setHasBlurred] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus()
    }));

    const currentValue = value ?? defaultValue ?? "";
    const usesDefaultValue = value === undefined && defaultValue !== undefined;
    const validationMessage =
      errorMessage ??
      (!validateOnBlur || hasBlurred
        ? validate?.(String(currentValue))
        : undefined);

    const handleBlur: React.FocusEventHandler<
      HTMLInputElement | HTMLTextAreaElement
    > = (event) => {
      setHasBlurred(true);
      onBlur?.(event);
    };

    const commonProps = {
      ...restProps,
      id: controlId,
      required,
      value: usesDefaultValue ? undefined : (value ?? ""),
      defaultValue: usesDefaultValue ? defaultValue : undefined,
      onBlur: handleBlur,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => onChange?.(event, event.currentTarget.value),
      className,
      style,
      "aria-invalid": !!validationMessage
    };

    return (
      <Field
        label={label ? { children: label, htmlFor: controlId } : undefined}
        required={required && showRequiredIndicator}
        validationState={validationMessage ? "error" : "none"}
        validationMessage={validationMessage}
      >
        {multiline ? (
          <Textarea
            {...(commonProps as React.ComponentProps<typeof Textarea>)}
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            resize="vertical"
          />
        ) : (
          <Input
            {...(commonProps as React.ComponentProps<typeof Input>)}
            ref={inputRef as React.Ref<HTMLInputElement>}
            type={
              (restProps.type as React.ComponentProps<typeof Input>["type"]) ??
              "text"
            }
            contentBefore={prefix ?? icon}
          />
        )}
      </Field>
    );
  }
);

InputField.displayName = "InputField";
