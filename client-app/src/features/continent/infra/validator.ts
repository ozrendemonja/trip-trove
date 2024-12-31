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
      ),
    regionName: yup
      .string()
      .trim()
      .ensure()
      .required("Region name may not be null or empty")
      .max(
        256,
        ({ max }) => `Region name may not be longer then ${max} characters`
      ),
    cityName: yup
      .string()
      .trim()
      .ensure()
      .required("City name may not be null or empty")
      .max(
        256,
        ({ max }) => `City name may not be longer then ${max} characters`
      ),
    countryId: yup.string().required("Country must be selected"),
    regionId: yup.string().required("Country must be selected")
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
