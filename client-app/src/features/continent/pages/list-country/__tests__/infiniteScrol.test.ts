import { Country, LastReadCountry } from "../../../domain/Country.types.";
import { CountryListCustomizer } from "../../../domain/CountryListCustomizer";
import { CountryRow } from "../ListCountry.types";
import { toLastReadCountry } from "../ListCountry.utils";

test("Last read country should be undefined when there are no countries in the list", () => {
  const countries: Country[] = [];

  const actual = toLastReadCountry(countries);

  expect(actual).toBeUndefined();
});

test("Last read country should be the only country in the list when there is only one country", () => {
  const expected = {
    id: 0,
    updatedOn: "2024-12-23T08:01:02.0000000"
  } as LastReadCountry;
  const countries = [
    {
      id: expected.id,
      inContinent: "Europe",
      name: "Monaco",
      updatedOn: expected.updatedOn
    }
  ] as Country[];

  const actual = toLastReadCountry(countries);

  expect(actual).toEqual(expected);
});

test("Last read country should be the last country in the list when the list contains multiple countries", () => {
  const expected = {
    id: 2,
    updatedOn: "2024-12-23T08:01:02.0000000"
  } as LastReadCountry;
  const countries = [
    {
      id: 0,
      inContinent: "Invalid continent 0",
      name: "Invalid country 0",
      updatedOn: "Invalid element 0"
    },
    {
      id: 1,
      inContinent: "Invalid continent 1",
      name: "Invalid country 1",
      updatedOn: "Invalid element 1"
    },
    {
      id: expected.id,
      inContinent: "Europe",
      name: "Monaco",
      updatedOn: expected.updatedOn
    }
  ] as Country[];

  const actual = toLastReadCountry(countries);

  expect(actual).toEqual(expected);
});

test("Country row list should include a flag that triggers infinite scroll when more pages exist", () => {
  const expected = [
    { continent: "Europe", name: "Monaco" },
    null
  ] as CountryRow[];
  const listColumnChanged = jest.fn((items: CountryRow[]) => {});
  const countryRows = [expected[0]];

  const customizer = new CountryListCustomizer(listColumnChanged, () => {});
  customizer.withRows(countryRows);

  expect(listColumnChanged).toHaveBeenCalledWith(expected);
});

test("Country row list should not include a flag that triggers infinite scroll when more no more pages exist", () => {
  const input0 = [{ continent: "Europe", name: "Monaco" }] as CountryRow[];
  const input1 = [{ continent: "Europe", name: "San Marino" }] as CountryRow[];
  const listColumnChanged = jest.fn((items: CountryRow[]) => {});
  const expected = [...input0, ...input1];

  let customizer = new CountryListCustomizer(listColumnChanged, () => {});
  customizer = customizer.withRows(input0);
  customizer = customizer.withRows(input1);
  listColumnChanged.mockClear();
  customizer.withRows([]);

  expect(listColumnChanged).toHaveBeenCalledWith(expected);
});

test("Country row list should include newly added countries when it previously had none", () => {
  const input = [
    { continent: "Europe", name: "Monaco" },
    { continent: "Europe", name: "San Marino" }
  ] as CountryRow[];
  const expected = [...input, null];
  const listColumnChanged = jest.fn((items: CountryRow[]) => {});

  new CountryListCustomizer(listColumnChanged, () => {}).withRows(input);

  expect(listColumnChanged).toHaveBeenCalledWith(expected);
});

test("Country row list should preserve previous data and include newly added countries when it already had some countries", () => {
  const input0 = [
    { continent: "Europe", name: "Monaco" },
    { continent: "Europe", name: "San Marino" }
  ] as CountryRow[];
  const input1 = [
    { continent: "Europe", name: "Liechtenstein" },
    { continent: "Oceania", name: "Palau" }
  ] as CountryRow[];
  const expected = [...input0, ...input1, null];
  const listColumnChanged = jest.fn((items: CountryRow[]) => {});

  const customizer = new CountryListCustomizer(
    listColumnChanged,
    () => {}
  ).withRows(input0);
  customizer.withRows(input1);

  expect(listColumnChanged).toHaveBeenCalledWith(expected);
});

test("Country row list should preserve previous data when the newly added country list is empty", () => {
  const input = [
    { continent: "Europe", name: "Monaco" },
    { continent: "Europe", name: "San Marino" }
  ] as CountryRow[];
  const expected = [...input];
  const listColumnChanged = jest.fn((items: CountryRow[]) => {});

  const customizer = new CountryListCustomizer(
    listColumnChanged,
    () => {}
  ).withRows(input);
  customizer.withRows([]);

  expect(listColumnChanged).toHaveBeenCalledWith(expected);
});

test("Country row list should be empty when the newly added country list is empty", () => {
  const expected: CountryRow[] = [];
  const listColumnChanged = jest.fn((items: CountryRow[]) => {});

  const customizer = new CountryListCustomizer(
    listColumnChanged,
    () => {}
  ).withRows([]);
  customizer.withRows([]);

  expect(listColumnChanged).toHaveBeenCalledWith(expected);
});
