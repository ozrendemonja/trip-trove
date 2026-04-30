import { chunk } from "../chunk";

test("returns empty array for empty input", () => {
  expect(chunk([], 5)).toEqual([]);
});

test("returns a single batch when items fit in one chunk", () => {
  expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
});

test("returns batches sized exactly to the limit when items split evenly", () => {
  expect(chunk([1, 2, 3, 4], 2)).toEqual([
    [1, 2],
    [3, 4]
  ]);
});

test("places remainder items in the last (smaller) batch", () => {
  expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
});

test("preserves order of items across batches", () => {
  const items = Array.from({ length: 250 }, (_, i) => i + 1);
  const batches = chunk(items, 100);
  expect(batches.map((b) => b.length)).toEqual([100, 100, 50]);
  expect(batches.flat()).toEqual(items);
});

test("throws when chunk size is not positive", () => {
  expect(() => chunk([1, 2, 3], 0)).toThrow();
  expect(() => chunk([1, 2, 3], -1)).toThrow();
});
