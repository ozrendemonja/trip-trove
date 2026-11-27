import type {
  AttractionEntry,
  GetItineraryResponse
} from "../../clients/manager";

export type ItineraryEntry =
  GetItineraryResponse["days"][number]["entries"][number];

export const isAttractionEntry = (
  entry: ItineraryEntry
): entry is AttractionEntry => "attractionId" in entry;
