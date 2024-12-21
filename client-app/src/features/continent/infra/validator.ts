import * as yup from "yup";
import {
  ErrorMessagesFormFields,
  FormFields,
  ValidationResponse
} from "../domain/Validation.types";

const createContinentNameValidation = () => {
  return yup.object({
    continentName: yup
      .string()
      .trim()
      .ensure()
      .required("Continent name may not be null or empty")
      .max(
        64,
        ({ max }) => `Continent name may not be longer then ${max} characters`
      ),
    countryName: yup
      .string()
      .trim()
      .ensure()
      .required("Country name may not be null or empty")
      .max(
        256,
        ({ max }) => `Country name may not be longer then ${max} characters`
      )
  });
};

export class Validator {
  private readonly validator = createContinentNameValidation();

  public validate(input: FormFields): ValidationResponse {
    try {
      this.validator.validateSync(input, { abortEarly: false });
    } catch (error: unknown) {
      const typedError = error as yup.ValidationError;
      if (typedError.name === "ValidationError") {
        const fieldNames = Object.getOwnPropertyNames(input);
        let validationErrors: ErrorMessagesFormFields = {};
        typedError.inner.forEach((error: any) => {
          if (error.path !== undefined) {
            if (fieldNames.includes(error.path)) {
              validationErrors = {
                ...validationErrors,
                [`${error.path}Error`]: error.errors[0]
              };
            }
          }
        });

        return {
          isValid: Object.keys(validationErrors).length === 0,
          errorMessage: validationErrors
        };
      }
      throw error;
    }
    return { isValid: true, errorMessage: {} };
  }
}