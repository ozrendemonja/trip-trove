import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export interface IsoCountryOption {
  code: string; // ISO 3166-1 alpha-2 in lowercase
  name: string;
}

let cachedOptions: IsoCountryOption[] | undefined;

/**
 * Returns the list of ISO 3166-1 alpha-2 country codes (lowercase) paired with
 * their English display names. Lowercase to match the casing used elsewhere
 * (e.g. when looking up countries on the world map by alpha-2).
 */
export const getIsoCountryOptions = (): IsoCountryOption[] => {
  if (cachedOptions) return cachedOptions;
  const names = countries.getNames("en", { select: "alias" });
  cachedOptions = Object.entries(names)
    .map(([alpha2, name]) => ({ code: alpha2.toLowerCase(), name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cachedOptions;
};

export const isValidIsoCode = (code: string | undefined | null): boolean => {
  if (!code) return false;
  const normalized = code.trim().toLowerCase();
  return (
    /^[a-z]{2}$/.test(normalized) && countries.isValid(normalized.toUpperCase())
  );
};
