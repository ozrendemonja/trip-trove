import { client } from "../../../clients/manager";
import {
  getBucketListCounts,
  getBucketListItems,
  updateBucketListItemCompletion,
  updateBucketListItemDescription,
  updateBucketListItemLocation,
  updateBucketListItemName
} from "../BucketListApi";

jest.mock("../../../clients/manager", () => ({
  client: { get: jest.fn(), put: jest.fn() }
}));

jest.mock("../../../config/ClientsApiConfig", () => ({
  __esModule: true,
  default: jest.fn()
}));

const mockedGet = client.get as jest.Mock;
const mockedPut = client.put as jest.Mock;

beforeEach(() => {
  mockedGet.mockReset();
  mockedPut.mockReset();
});

test("sends the active status and last item with every page request", async () => {
  mockedGet.mockResolvedValueOnce({ data: [], error: undefined });

  await getBucketListItems("completed", {
    id: 42,
    changedOn: "2026-08-30T18:00:00"
  });

  expect(mockedGet).toHaveBeenCalledWith({
    url: "/bucket-list/items",
    headers: { "x-api-version": "1" },
    query: {
      status: "COMPLETED",
      itemId: 42,
      updatedOn: "2026-08-30T18:00:00"
    }
  });
});

test("loads all global bucket list counters together", async () => {
  mockedGet.mockResolvedValueOnce({
    data: { all: 7, todo: 5, completed: 2 },
    error: undefined
  });

  await expect(getBucketListCounts()).resolves.toEqual({
    all: 7,
    todo: 5,
    completed: 2
  });
  expect(mockedGet).toHaveBeenCalledWith({
    url: "/bucket-list/items/counts",
    headers: { "x-api-version": "1" }
  });
});

test("rejects inconsistent bucket list counters", async () => {
  mockedGet.mockResolvedValueOnce({
    data: { all: 8, todo: 5, completed: 2 },
    error: undefined
  });

  await expect(getBucketListCounts()).rejects.toThrow(
    "Bucket list count response was empty or malformed"
  );
});

test("rejects a missing bucket list page instead of treating it as the end", async () => {
  mockedGet.mockResolvedValueOnce({ data: undefined, error: undefined });

  await expect(getBucketListItems("all")).rejects.toThrow(
    "Bucket list response was empty or malformed"
  );
});

test("rejects a bucket list page without a usable cursor", async () => {
  mockedGet.mockResolvedValueOnce({
    data: [{ id: 1, name: "Incomplete response" }],
    error: undefined
  });

  await expect(getBucketListItems("all")).rejects.toThrow(
    "Bucket list response was empty or malformed"
  );
});

test("updates only the bucket list item name", async () => {
  mockedPut.mockResolvedValueOnce({ error: undefined });

  await updateBucketListItemName(7, { name: "Hang gliding" });

  expect(mockedPut).toHaveBeenCalledWith({
    url: "/bucket-list/items/{id}/name",
    path: { id: 7 },
    headers: { "x-api-version": "1" },
    body: { name: "Hang gliding" }
  });
});

test("updates only the bucket list item location", async () => {
  mockedPut.mockResolvedValueOnce({ error: undefined });

  await updateBucketListItemLocation(7, { cityId: 2 });

  expect(mockedPut).toHaveBeenCalledWith({
    url: "/bucket-list/items/{id}/location",
    path: { id: 7 },
    headers: { "x-api-version": "1" },
    body: { cityId: 2 }
  });
});

test("updates only the bucket list item description", async () => {
  mockedPut.mockResolvedValueOnce({ error: undefined });

  await updateBucketListItemDescription(7, {
    description: "Best at sunrise."
  });

  expect(mockedPut).toHaveBeenCalledWith({
    url: "/bucket-list/items/{id}/description",
    path: { id: 7 },
    headers: { "x-api-version": "1" },
    body: { description: "Best at sunrise." }
  });
});

test("updates only the bucket list item completion", async () => {
  mockedPut.mockResolvedValueOnce({ error: undefined });

  await updateBucketListItemCompletion(7, {
    completedOn: "2026-09-03",
    tripId: 3
  });

  expect(mockedPut).toHaveBeenCalledWith({
    url: "/bucket-list/items/{id}/completion",
    path: { id: 7 },
    headers: { "x-api-version": "1" },
    body: { completedOn: "2026-09-03", tripId: 3 }
  });
});
