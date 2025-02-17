import * as yup from "yup";

export const createAttractionValidation: yup.AnyObject = () => {
  const decimalNumberReg = /(-)?\d+\.?\d*/;

  return yup.object().shape(
    {
      countryId: yup.string().required("Country must be selected"),
      regionId: yup.string().when(["cityId"], {
        is: (cityIdPresented) => !cityIdPresented,
        then: () => yup.string().required("Region must be selected")
      }),
      cityId: yup.string().when(["regionId"], {
        is: (regionIdPresented) => !regionIdPresented,
        then: () => yup.string().required("City must be selected")
      }),
      name: yup
        .string()
        .trim()
        .ensure()
        .required("Attraction name may not be null or empty")
        .max(
          2048,
          ({ max }) =>
            `Attraction name may not be longer then ${max} characters`
        ),
      address: yup
        .string()
        .trim()
        .ensure()
        .max(
          512,
          ({ max }) =>
            `Attraction address may not be longer then ${max} characters`
        ),
      geoLocation: yup
        .string()
        .trim()
        .ensure()
        .matches(
          new RegExp(
            /^\s*/.source +
              decimalNumberReg.source +
              /\s*,\s*/.source +
              decimalNumberReg.source +
              /\s*$/.source
            // "gi"
          ),
          { excludeEmptyString: true }
        )
        .test("latitude", "Invalid latitude", (value) => ValidLatitude(value))
        .test("longitude", "Invalid longitude", (value) =>
          ValidLongitude(value)
        ),
      category: yup
        .string()
        .trim()
        .ensure()
        .required("Category may not be null or empty"),
      type: yup
        .string()
        .trim()
        .ensure()
        .required("Type may not be null or empty"),
      tip: yup
        .string()
        .trim()
        .ensure()
        .max(2048, ({ max }) => `Tip may not be longer then ${max} characters`),
      source: yup
        .string()
        .trim()
        .ensure()
        .required("Info from may not be null or empty")
        .max(
          512,
          ({ max }) => `Info from may not be longer then ${max} characters`
        ),
      sourceFrom: yup
        .string()
        .trim()
        .ensure()
        .required("Info from may not be null or empty")
    },
    [["cityId", "regionId"]]
  );
};

function ValidLatitude(value: string): boolean {
  const latitude = Number(value.split(",")[0].trim());
  return Math.abs(latitude) <= 90.0;
}

function ValidLongitude(value: string): boolean {
  if (value.split(",").length < 2) {
    return true;
  }
  const latitude = Number(value.split(",")[1].trim());
  return Math.abs(latitude) <= 180.0;
}
