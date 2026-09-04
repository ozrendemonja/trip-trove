import { client } from "../../../clients/manager";
import {
  getBucketListItems,
  updateBucketListItem,
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

test("sends the last item as the cursor for the next page", async () => {
  mockedGet.mockResolvedValueOnce({ data: [], error: undefined });

  await getBucketListItems({
    id: 42,
    changedOn: "2026-08-30T18:00:00"
  });

  expect(mockedGet).toHaveBeenCalledWith({
    url: "/bucket-list/items",
    headers: { "x-api-version": "1" },
    query: {
      itemId: 42,
      updatedOn: "2026-08-30T18:00:00"
    }
  });
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

test("updates and reloads a whole bucket list item", async () => {
  const updatedItem = {
    id: 7,
    name: "Hang gliding",
    completedOn: "2026-09-03",
    cityId: 2,
    cityName: "Interlaken",
    regionId: null,
    regionName: "Bern",
    description: "Best at sunrise.",
    tripId: 3,
    tripName: "Switzerland",
    changedOn: "2026-09-03T12:00:00Z"
  };
  mockedPut.mockResolvedValue({ error: undefined });
  mockedGet.mockResolvedValueOnce({ data: updatedItem, error: undefined });

  const result = await updateBucketListItem(7, {
    name: "Hang gliding",
    completedOn: "2026-09-03",
    cityId: 2,
    description: "Best at sunrise.",
    tripId: 3
  });

  expect(mockedPut).toHaveBeenNthCalledWith(1, {
    url: "/bucket-list/items/{id}/name",
    path: { id: 7 },
    headers: { "x-api-version": "1" },
    body: { name: "Hang gliding" }
  });
  expect(mockedPut).toHaveBeenNthCalledWith(2, {
    url: "/bucket-list/items/{id}/location",
    path: { id: 7 },
    headers: { "x-api-version": "1" },
    body: { cityId: 2, regionId: undefined }
  });
  expect(mockedPut).toHaveBeenNthCalledWith(3, {
    url: "/bucket-list/items/{id}/description",
    path: { id: 7 },
    headers: { "x-api-version": "1" },
    body: { description: "Best at sunrise." }
  });
  expect(mockedPut).toHaveBeenNthCalledWith(4, {
    url: "/bucket-list/items/{id}/completion",
    path: { id: 7 },
    headers: { "x-api-version": "1" },
    body: { completedOn: "2026-09-03", tripId: 3 }
  });
  expect(mockedGet).toHaveBeenCalledWith({
    url: "/bucket-list/items/{id}",
    path: { id: 7 },
    headers: { "x-api-version": "1" }
  });
  expect(result).toEqual(updatedItem);
});
