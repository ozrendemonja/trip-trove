import { client } from "../../clients/manager";
import managerClient from "../../config/ClientsApiConfig";
import {
  BucketListCursor,
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

export const getBucketListItems = async (
  after?: BucketListCursor
): Promise<BucketListItem[]> => {
  const { data, error } = await client.get<BucketListItem[]>({
    url: "/bucket-list/items",
    headers,
    query: {
      itemId: after?.id,
      updatedOn: after?.changedOn
    }
  });

  if (error) {
    throwApiError("Error while loading bucket list items", error);
  }
  return data ?? [];
};

export const getBucketListItem = async (
  id: number
): Promise<BucketListItem> => {
  const { data, error } = await client.get<BucketListItem>({
    url: "/bucket-list/items/{id}",
    path: { id },
    headers
  });

  if (error || !data) {
    throwApiError("Error while loading bucket list item", error);
  }
  return data;
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

export const updateBucketListItem = async (
  id: number,
  request: SaveBucketListItem
): Promise<BucketListItem> => {
  await updateBucketListItemName(id, { name: request.name });
  await updateBucketListItemLocation(id, {
    cityId: request.cityId,
    regionId: request.regionId
  });
  await updateBucketListItemDescription(id, {
    description: request.description
  });
  await updateBucketListItemCompletion(id, {
    completedOn: request.completedOn,
    tripId: request.tripId
  });

  return getBucketListItem(id);
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
