/**
 * Best-effort parser for Google Maps URLs.
 *
 * Goal: extract `name`, `latitude`, `longitude` from the URL the user
 * copies from the address bar after clicking a place on Google Maps.
 *
 * Supported patterns (examples):
 *   /maps/place/<Name>/@<lat>,<lng>,<zoom>z/data=...!3d<lat>!4d<lng>!...
 *   /maps/place/<Name>/@<lat>,<lng>,<zoom>z
 *   /maps/@<lat>,<lng>,<zoom>z
 *   /maps?q=<lat>,<lng>
 *   /maps?q=<Name>&ll=<lat>,<lng>
 *   /maps/search/<lat>,+<lng>
 *
 * Short share URLs (https://maps.app.goo.gl/..., https://goo.gl/maps/...)
 * cannot be resolved from the browser because of CORS — the caller should
 * detect those via `isShortGoogleMapsUrl` and prompt the user to paste the
 * expanded URL from the address bar instead.
 */

export interface ParsedGoogleMapsPlace {
  name?: string;
  latitude: number;
  longitude: number;
}

const SHORT_URL_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "g.co"]);

export const isShortGoogleMapsUrl = (raw: string): boolean => {
  try {
    const url = new URL(raw.trim());
    return SHORT_URL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

const isFiniteNumber = (n: number): boolean =>
  typeof n === "number" && Number.isFinite(n);

const isValidLat = (n: number): boolean =>
  isFiniteNumber(n) && n >= -90 && n <= 90;
const isValidLng = (n: number): boolean =>
  isFiniteNumber(n) && n >= -180 && n <= 180;

const decodeName = (raw: string): string | undefined => {
  try {
    // Google encodes spaces as `+` in /place/ segment
    const withSpaces = raw.replace(/\+/g, " ");
    const decoded = decodeURIComponent(withSpaces).trim();
    if (decoded.length === 0) {
      return undefined;
    }
    // Skip if the "name" is actually a coordinate pair
    if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(decoded)) {
      return undefined;
    }
    return decoded;
  } catch {
    return undefined;
  }
};

const extractNameFromPath = (pathname: string): string | undefined => {
  // /maps/place/<Name>/...   or   /maps/place/<Name>
  const match = pathname.match(/\/maps\/place\/([^/]+)/i);
  if (!match) {
    return undefined;
  }
  return decodeName(match[1]);
};

// `@lat,lng` reflects the location currently shown in the address bar
// (the user's chosen view / click position) and is what the user expects
// when they copy the URL. The `!3d!4d` pair inside the data= segment is
// Google's canonical pin for the place, which can differ from what the
// user sees. Prefer @lat,lng and fall back to !3d!4d.
const extractDataCoords = (
  url: string
): { latitude: number; longitude: number } | undefined => {
  const match = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return undefined;
  }
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!isValidLat(latitude) || !isValidLng(longitude)) {
    return undefined;
  }
  return { latitude, longitude };
};

const extractAtCoords = (
  pathname: string
): { latitude: number; longitude: number } | undefined => {
  const match = pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return undefined;
  }
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!isValidLat(latitude) || !isValidLng(longitude)) {
    return undefined;
  }
  return { latitude, longitude };
};

const extractQueryCoords = (
  url: URL
): { latitude: number; longitude: number } | undefined => {
  const candidates = [url.searchParams.get("ll"), url.searchParams.get("q")];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const match = candidate.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
    );
    if (!match) {
      continue;
    }
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (isValidLat(latitude) && isValidLng(longitude)) {
      return { latitude, longitude };
    }
  }
  return undefined;
};

const extractSearchPathCoords = (
  pathname: string
): { latitude: number; longitude: number } | undefined => {
  // /maps/search/44.81,+20.45
  const match = pathname.match(
    // eslint-disable-next-line @fluentui/max-len
    /\/maps\/search\/(-?\d+(?:\.\d+)?)[,+\s]+(-?\d+(?:\.\d+)?)/
  );
  if (!match) {
    return undefined;
  }
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!isValidLat(latitude) || !isValidLng(longitude)) {
    return undefined;
  }
  return { latitude, longitude };
};

const extractNameFromQuery = (url: URL): string | undefined => {
  const q = url.searchParams.get("q");
  if (!q) {
    return undefined;
  }
  // Skip pure coordinate `q` values
  if (/^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/.test(q)) {
    return undefined;
  }
  return decodeName(q);
};

export const parseGoogleMapsUrl = (
  raw: string
): ParsedGoogleMapsPlace | undefined => {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return undefined;
  }

  if (
    !/(^|\.)google\./i.test(url.hostname) &&
    url.hostname !== "maps.google.com"
  ) {
    return undefined;
  }

  const coords =
    extractAtCoords(url.pathname) ??
    extractDataCoords(trimmed) ??
    extractQueryCoords(url) ??
    extractSearchPathCoords(url.pathname);

  if (!coords) {
    return undefined;
  }

  const name = extractNameFromPath(url.pathname) ?? extractNameFromQuery(url);

  return {
    name,
    latitude: coords.latitude,
    longitude: coords.longitude
  };
};

export const formatCoords = (
  latitude: number,
  longitude: number,
  precision = 7
): string => `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
