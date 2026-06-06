/**
 * Best-effort reverse geocoding via the public OpenStreetMap Nominatim API.
 *
 * Nominatim usage policy:
 *   - Max ~1 request per second.
 *   - Browser fetches are allowed; CORS is enabled on
 *     nominatim.openstreetmap.org.
 *   - Cache results when possible.
 *
 * Returns:
 *   - { ok: true, address }         on success with a result
 *   - { ok: true, address: null }   success but no result for those coords
 *   - { ok: false, reason }         on transport / HTTP failure
 */

interface NominatimResponse {
  display_name?: string;
  error?: string;
}

export type ReverseGeocodeResult =
  | { ok: true; address: string | null }
  | { ok: false; reason: string };

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const REQUEST_TIMEOUT_MS = 8000;

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> => {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude.toString(),
    lon: longitude.toString(),
    zoom: "18",
    addressdetails: "0",
    "accept-language": "en"
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${NOMINATIM_ENDPOINT}?${params.toString()}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal
      }
    );
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `[reverseGeocode] Nominatim returned HTTP ${response.status}`
      );
      return { ok: false, reason: `HTTP ${response.status}` };
    }
    const data: NominatimResponse = await response.json();
    if (data.error) {
      // eslint-disable-next-line no-console
      console.warn("[reverseGeocode] Nominatim error:", data.error);
      return { ok: true, address: null };
    }
    const displayName = data.display_name?.trim();
    return {
      ok: true,
      address: displayName && displayName.length > 0 ? displayName : null
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[reverseGeocode] request failed:", error);
    const reason =
      error instanceof DOMException && error.name === "AbortError"
        ? "timeout"
        : "network error";
    return { ok: false, reason };
  } finally {
    clearTimeout(timeoutId);
  }
};
