import {
  formatCoords,
  isShortGoogleMapsUrl,
  parseGoogleMapsUrl
} from "../parseGoogleMapsUrl";

describe("parseGoogleMapsUrl", () => {
  test("returns undefined for empty input", () => {
    expect(parseGoogleMapsUrl("")).toBeUndefined();
  });

  test("returns undefined for non-URL strings", () => {
    expect(parseGoogleMapsUrl("not a url")).toBeUndefined();
  });

  test("returns undefined for non-Google hosts", () => {
    expect(
      parseGoogleMapsUrl("https://example.com/maps/place/Foo/@1,2,10z")
    ).toBeUndefined();
  });

  test("prefers @lat,lng (URL bar viewport) over !3d!4d data pin", () => {
    const url =
      // eslint-disable-next-line @fluentui/max-len
      "https://www.google.com/maps/place/This+is+Holland/@52.3841897,4.899621,17z/data=!4m6!3m5!1s0x47c609b4697a032d:0xac3f00acb40cd7c5!8m2!3d52.3841865!4d4.9021959!16s%2Fg%2F11fxwqjfjz";
    const parsed = parseGoogleMapsUrl(url);
    expect(parsed).toEqual({
      name: "This is Holland",
      latitude: 52.3841897,
      longitude: 4.899621
    });
  });

  test("falls back to !3d!4d when no @lat,lng present", () => {
    const url =
      // eslint-disable-next-line @fluentui/max-len
      "https://www.google.com/maps/place/Eiffel+Tower/data=!3m1!4b1!4m6!3m5!1s0x47e66e2964e34e2d:0x8ddca9ee380ef7e0!8m2!3d48.8583701!4d2.2922926!16zL20vMDJqODE";
    const parsed = parseGoogleMapsUrl(url);
    expect(parsed).toEqual({
      name: "Eiffel Tower",
      latitude: 48.8583701,
      longitude: 2.2922926
    });
  });

  test("falls back to @lat,lng when no data segment", () => {
    const url =
      "https://www.google.com/maps/place/Kalemegdan/@44.8225,20.4509,17z";
    const parsed = parseGoogleMapsUrl(url);
    expect(parsed).toEqual({
      name: "Kalemegdan",
      latitude: 44.8225,
      longitude: 20.4509
    });
  });

  test("decodes percent-encoded names", () => {
    const url =
      "https://www.google.com/maps/place/Caf%C3%A9%20Z/@10,20,15z/data=!3m1!4b1!4m2!3d11!4d22";
    const parsed = parseGoogleMapsUrl(url);
    expect(parsed?.name).toBe("Café Z");
  });

  test("supports /maps/@lat,lng with no place name", () => {
    const parsed = parseGoogleMapsUrl(
      "https://www.google.com/maps/@40.7128,-74.0060,12z"
    );
    expect(parsed).toEqual({
      name: undefined,
      latitude: 40.7128,
      longitude: -74.006
    });
  });

  test("supports ?q=<lat>,<lng> query format", () => {
    const parsed = parseGoogleMapsUrl("https://maps.google.com/?q=44.81,20.45");
    expect(parsed).toEqual({
      name: undefined,
      latitude: 44.81,
      longitude: 20.45
    });
  });

  test("supports ?ll=<lat>,<lng>&q=<name>", () => {
    const parsed = parseGoogleMapsUrl(
      "https://www.google.com/maps?q=Belgrade&ll=44.81,20.45"
    );
    expect(parsed).toEqual({
      name: "Belgrade",
      latitude: 44.81,
      longitude: 20.45
    });
  });

  test("supports /maps/search/<lat>,+<lng>", () => {
    const parsed = parseGoogleMapsUrl(
      "https://www.google.com/maps/search/44.81,+20.45"
    );
    expect(parsed).toEqual({
      name: undefined,
      latitude: 44.81,
      longitude: 20.45
    });
  });

  test("rejects out-of-range latitude", () => {
    expect(
      parseGoogleMapsUrl("https://www.google.com/maps/@95,20,12z")
    ).toBeUndefined();
  });

  test("rejects out-of-range longitude", () => {
    expect(
      parseGoogleMapsUrl("https://www.google.com/maps/@40,200,12z")
    ).toBeUndefined();
  });

  test("trims surrounding whitespace", () => {
    const parsed = parseGoogleMapsUrl(
      "   https://www.google.com/maps/@1,2,12z   "
    );
    expect(parsed).toEqual({ name: undefined, latitude: 1, longitude: 2 });
  });

  test("read correctly values from the URL", () => {
    const url =
      // eslint-disable-next-line @fluentui/max-len
      "https://www.google.com/maps/place/This+is+Holland/@52.3841897,4.899621,17z/data=!4m6!3m5!1s0x47c609b4697a032d:0xac3f00acb40cd7c5!8m2!3d52.3841865!4d4.9021959!16s%2Fg%2F11fxwqjfjz?hl=en&entry=ttu&g_ep=EgoyMDI2MDUzMS4wIKXMDSoASAFQAw%3D%3D";
    const parsed = parseGoogleMapsUrl(url);
    expect(parsed).toEqual({
      name: "This is Holland",
      latitude: 52.3841897,
      longitude: 4.899621
    });
  });
});

describe("isShortGoogleMapsUrl", () => {
  test("detects maps.app.goo.gl short URLs", () => {
    expect(isShortGoogleMapsUrl("https://maps.app.goo.gl/abc123")).toBe(true);
  });

  test("detects goo.gl short URLs", () => {
    expect(isShortGoogleMapsUrl("https://goo.gl/maps/abc")).toBe(true);
  });

  test("returns false for full Google Maps URLs", () => {
    expect(
      isShortGoogleMapsUrl("https://www.google.com/maps/place/X/@1,2,12z")
    ).toBe(false);
  });

  test("returns false for invalid URLs", () => {
    expect(isShortGoogleMapsUrl("not a url")).toBe(false);
  });
});

describe("formatCoords", () => {
  test("formats with default precision", () => {
    expect(formatCoords(44.8125, 20.4567)).toBe("44.8125000, 20.4567000");
  });

  test("respects custom precision", () => {
    expect(formatCoords(1.123456789, 2.987654321, 4)).toBe("1.1235, 2.9877");
  });
});
