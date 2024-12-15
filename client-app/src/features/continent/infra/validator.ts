import * as yup from "yup";
import { ContinentFields, ValidationResponse } from "../domain/continentValidation.types";

const createContinentNameValidation = () => {
    return yup.object({
        continentName: yup
            .string()
            .trim()
            .ensure()
            .required("Continent name may not be null or empty")
            .max(64, ({ max }) => `Continent name may not be longer then ${max} characters`)
    })
};

export class Validator {
    private readonly validator = createContinentNameValidation();

    public validate(input: ContinentFields): ValidationResponse {
        try {
            this.validator.validateSync(input, { abortEarly: false });
        } catch (error: unknown) {
            const typedError = error as Error;
            if (typedError.name === "ValidationError") {
                return { isValid: false, errorMessage: (typedError as yup.ValidationError).errors[0] };
            }
            throw error;
        }
        return { isValid: true };
    }
};