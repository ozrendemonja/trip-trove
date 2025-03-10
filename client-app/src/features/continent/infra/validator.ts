import * as yup from "yup";
import {
  ErrorMessagesFormFields,
  FormFields,
  ValidationResponse
} from "../domain/Validation.types";

export class Validator {
  private readonly validator: yup.AnyObject;

  constructor(validator: yup.AnyObject) {
    this.validator = validator;
  }

  public validate(input: FormFields): ValidationResponse {
    try {
      this.validator.validateSync(input, { abortEarly: false });
    } catch (error: unknown) {
      const typedError = error as yup.ValidationError;
      if (typedError.name === "ValidationError") {
        const fieldNames = Object.getOwnPropertyNames(input);
        return {
          isValid: this.hasUserError(fieldNames, typedError),
          errorMessage: this.toErrorMessage(fieldNames, typedError)
        };
      }
      throw error;
    }
    return { isValid: true };
  }

  private hasUserError(
    fieldNames: string[],
    typedError: yup.ValidationError
  ): boolean {
    return (
      Object.keys(this.toErrorMessage(fieldNames, typedError)).length === 0
    );
  }

  private toErrorMessage(
    fieldNames: string[],
    typedError: yup.ValidationError
  ): ErrorMessagesFormFields {
    const isErrorInUsedFields = (error: any) =>
      error.path && fieldNames.includes(error.path);

    return typedError.inner
      .filter(isErrorInUsedFields)
      .map((error: any) => ({ [`${error.path}Error`]: error.errors[0] }))
      .reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }
}
