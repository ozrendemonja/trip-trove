import * as yup from "yup";

export const createPlaceValidation = () => {
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
