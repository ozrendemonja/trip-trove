import {
  fetchAttractionsVisitHistory,
  VISIT_HISTORY_MAX_BATCH_SIZE
} from "../infra/TripApi";
import type { AttractionVisitHistory } from "../domain/VisitHistory.types";
import { client } from "../../../clients/manager";

jest.mock("../../../clients/manager", () => ({
  client: { post: jest.fn() }
}));

jest.mock("../../../config/ClientsApiConfig", () => ({
  __esModule: true,
  default: jest.fn()
}));

const mockedPost = client.post as jest.Mock;

type PostCallArg = { url: string; body: { attractionIds: number[] } };

const buildIds = (count: number): number[] =>
  Array.from({ length: count }, (_, i) => i + 1);

beforeEach(() => {
  mockedPost.mockReset();
});

test("makes no request when attractionIds is empty", async () => {
  const result = await fetchAttractionsVisitHistory(1, []);
  expect(result).toEqual([]);
  expect(mockedPost).not.toHaveBeenCalled();
});

test("sends a single request when attractionIds size <= max batch size", async () => {
  const ids = buildIds(VISIT_HISTORY_MAX_BATCH_SIZE);
  const fakeResponse: AttractionVisitHistory[] = [
    { attractionId: 1, visits: [] }
  ];
  mockedPost.mockResolvedValueOnce({ data: fakeResponse, error: undefined });

  const result = await fetchAttractionsVisitHistory(7, ids);

  expect(mockedPost).toHaveBeenCalledTimes(1);
  const call = mockedPost.mock.calls[0][0] as PostCallArg;
  expect(call.url).toBe("/trips/7/attractions/visit-history");
  expect(call.body.attractionIds).toHaveLength(VISIT_HISTORY_MAX_BATCH_SIZE);
  expect(result).toEqual(fakeResponse);
});

test("chunks attractionIds into batches of max size and merges responses", async () => {
  const ids = buildIds(250);
  mockedPost.mockImplementation(({ body }: PostCallArg) =>
    Promise.resolve({
      data: body.attractionIds.map((attractionId) => ({
        attractionId,
        visits: []
      })) as AttractionVisitHistory[],
      error: undefined
    })
  );

  const result = await fetchAttractionsVisitHistory(42, ids);

  expect(mockedPost).toHaveBeenCalledTimes(3);
  const sentSizes = mockedPost.mock.calls.map(
    ([call]: [PostCallArg]) => call.body.attractionIds.length
  );
  expect(sentSizes).toEqual([100, 100, 50]);

  const allSent = mockedPost.mock.calls.flatMap(
    ([call]: [PostCallArg]) => call.body.attractionIds
  );
  expect(allSent).toEqual(ids);

  expect(result).toHaveLength(250);
  expect(result.map((entry) => entry.attractionId)).toEqual(ids);
});

test("returns empty list for a failing batch but still includes successful batches", async () => {
  const ids = buildIds(150);
  mockedPost
    .mockResolvedValueOnce({
      data: [{ attractionId: 1, visits: [] }] as AttractionVisitHistory[],
      error: undefined
    })
    .mockResolvedValueOnce({ data: undefined, error: { message: "boom" } });

  const result = await fetchAttractionsVisitHistory(1, ids);

  expect(mockedPost).toHaveBeenCalledTimes(2);
  expect(result).toEqual([{ attractionId: 1, visits: [] }]);
});
