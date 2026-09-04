export interface BucketListItem {
  id: number;
  name: string;
  completedOn?: string | null;
  cityId?: number | null;
  cityName?: string | null;
  regionId?: number | null;
  regionName?: string | null;
  description?: string | null;
  tripId?: number | null;
  tripName?: string | null;
  changedOn: string;
}

export type BucketListCursor = Pick<BucketListItem, "id" | "changedOn">;

export interface SaveBucketListItem {
  name: string;
  completedOn?: string;
  cityId?: number;
  regionId?: number;
  description?: string;
  tripId?: number;
}

export interface UpdateBucketListItemName {
  name: string;
}

export interface UpdateBucketListItemLocation {
  cityId?: number;
  regionId?: number;
}

export interface UpdateBucketListItemDescription {
  description?: string;
}

export interface UpdateBucketListItemCompletion {
  completedOn?: string;
  tripId?: number;
}

export type BucketListFilter = "all" | "todo" | "completed";
export type BucketListLocationType = "none" | "city" | "region";

export interface BucketListDraft {
  name: string;
  completedOn: string;
  locationType: BucketListLocationType;
  locationLabel: string;
  cityId?: number;
  regionId?: number;
  description: string;
  tripId?: number;
}
