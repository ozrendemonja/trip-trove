import { client } from "../../clients/manager";
import managerClient from "../../config/ClientsApiConfig";
import {
  BucketListCounts,
  BucketListCursor,
  BucketListFilter,
  BucketListItem,
  SaveBucketListItem,
  UpdateBucketListItemCompletion,
  UpdateBucketListItemDescription,
  UpdateBucketListItemLocation,
  UpdateBucketListItemName
} from "./BucketList.types";

managerClient();

const headers = { "x-api-version": "1" };

const throwApiError = (message: string, error: unknown): never => {
  throw new Error(message, { cause: error });
};

const isBucketListItem = (value: unknown): value is BucketListItem => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "number" &&
    Number.isSafeInteger(item.id) &&
    item.id > 0 &&
    typeof item.name === "string" &&
    typeof item.changedOn === "string" &&
    item.changedOn.length > 0
  );
};

const isBucketListCounts = (value: unknown): value is BucketListCounts => {
  if (typeof value !== "object" || value === null) return false;
  const counts = value as Record<string, unknown>;
  const values = [counts.all, counts.todo, counts.completed];
  return (
    values.every(
      (count) =>
        typeof count === "number" && Number.isSafeInteger(count) && count >= 0
    ) && counts.all === Number(counts.todo) + Number(counts.completed)
  );
};

export const getBucketListItems = async (
  filter: BucketListFilter = "all",
  after?: BucketListCursor
): Promise<BucketListItem[]> => {
  const { data, error } = await client.get<BucketListItem[]>({
    url: "/bucket-list/items",
    headers,
    query: {
      status: filter.toUpperCase(),
      itemId: after?.id,
      updatedOn: after?.changedOn
    }
  });

  if (error) {
    throwApiError("Error while loading bucket list items", error);
  }
  if (!Array.isArray(data) || !data.every(isBucketListItem)) {
    throwApiError("Bucket list response was empty or malformed", data);
  }
  return data;
};

export const getBucketListCounts = async (): Promise<BucketListCounts> => {
  const { data, error } = await client.get<BucketListCounts>({
    url: "/bucket-list/items/counts",
    headers
  });

  if (error) {
    throwApiError("Error while loading bucket list counts", error);
  }
  if (!isBucketListCounts(data)) {
    throwApiError("Bucket list count response was empty or malformed", data);
  }
  return data;
};

export const getBucketListItem = async (
  id: number
): Promise<BucketListItem> => {
  const { data, error } = await client.get<BucketListItem>({
    url: "/bucket-list/items/{id}",
    path: { id },
    headers
  });

  if (error) {
    throwApiError("Error while loading bucket list item", error);
  }
  return data ?? throwApiError("Bucket list item response was empty", data);
};

export const createBucketListItem = async (
  item: SaveBucketListItem
): Promise<void> => {
  const { error } = await client.post({
    url: "/bucket-list/items",
    headers,
    body: item
  });

  if (error) {
    throwApiError("Error while creating bucket list item", error);
  }
};

export const updateBucketListItemName = async (
  id: number,
  request: UpdateBucketListItemName
): Promise<void> => {
  const { error } = await client.put({
    url: "/bucket-list/items/{id}/name",
    path: { id },
    headers,
    body: request
  });

  if (error) {
    throwApiError("Error while updating bucket list item name", error);
  }
};

export const updateBucketListItemLocation = async (
  id: number,
  request: UpdateBucketListItemLocation
): Promise<void> => {
  const { error } = await client.put({
    url: "/bucket-list/items/{id}/location",
    path: { id },
    headers,
    body: request
  });

  if (error) {
    throwApiError("Error while updating bucket list item location", error);
  }
};

export const updateBucketListItemDescription = async (
  id: number,
  request: UpdateBucketListItemDescription
): Promise<void> => {
  const { error } = await client.put({
    url: "/bucket-list/items/{id}/description",
    path: { id },
    headers,
    body: request
  });

  if (error) {
    throwApiError("Error while updating bucket list item description", error);
  }
};

export const updateBucketListItemCompletion = async (
  id: number,
  request: UpdateBucketListItemCompletion
): Promise<void> => {
  const { error } = await client.put({
    url: "/bucket-list/items/{id}/completion",
    path: { id },
    headers,
    body: request
  });

  if (error) {
    throwApiError("Error while updating bucket list item completion", error);
  }
};

export const deleteBucketListItem = async (id: number): Promise<void> => {
  const { error } = await client.delete({
    url: "/bucket-list/items/{id}",
    path: { id },
    headers
  });

  if (error) {
    throwApiError("Error while deleting bucket list item", error);
  }
};
