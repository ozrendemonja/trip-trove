import type { Attraction } from "../../components/AttractionList.types";
import type { TouristDestination } from "../../components/Board.types";
import {
  applyPrepareChanges,
  buildPrepareChanges,
  indexBoard
} from "../PrepareDraft";

const attraction = (id: number): Attraction => ({
  id,
  name: `Attraction ${id}`,
  mustVisit: true,
  stable: true,
  isTraditional: false,
  isCountrywide: false,
  address: "",
  category: "HISTORIC_SITE",
  infoFrom: "Guide",
  note: `Trip note ${id}`,
  VisitTime: ""
});

const board = (
  primary: number[],
  secondary: number[] = []
): TouristDestination[] => [
  {
    name: "Monaco",
    columns: [
      {
        id: "top",
        title: "Top Attractions",
        tasks: primary.map(attraction)
      },
      {
        id: "secondary",
        title: "Secondary Spots",
        tasks: secondary.map(attraction)
      }
    ]
  }
];

test("separate removals, additions and moves preserve untouched attractions", () => {
  const saved = board([1, 2, 3]);
  const draft = board([3, 4, 1]);
  const savedIds = new Set([1, 2, 3]);

  const changes = buildPrepareChanges(saved, draft, savedIds, [3]);

  expect(changes).toEqual([
    { type: "remove", attractionId: 2 },
    {
      type: "move",
      attractionId: 3,
      targetGroup: "PRIMARY",
      previousAttractionId: null,
      nextAttractionId: 1
    },
    {
      type: "attach",
      attractionId: 4,
      attractionGroup: "PRIMARY"
    },
    {
      type: "move",
      attractionId: 4,
      targetGroup: "PRIMARY",
      previousAttractionId: 3,
      nextAttractionId: 1
    }
  ]);
  expect(applyPrepareChanges(saved, draft, savedIds, changes)).toEqual(draft);
  expect(saved).toEqual(board([1, 2, 3]));
});

test("cross-column moves use neighbors saved by earlier requests", () => {
  const saved = board([1, 2], [3, 4]);
  const draft = board([3, 1], [4, 5, 2]);
  const savedIds = new Set([1, 2, 3, 4]);

  const changes = buildPrepareChanges(saved, draft, savedIds, [2, 3]);

  expect(changes).toEqual([
    {
      type: "move",
      attractionId: 3,
      targetGroup: "PRIMARY",
      previousAttractionId: null,
      nextAttractionId: 1
    },
    {
      type: "attach",
      attractionId: 5,
      attractionGroup: "SECONDARY"
    },
    {
      type: "move",
      attractionId: 2,
      targetGroup: "SECONDARY",
      previousAttractionId: 5,
      nextAttractionId: null
    }
  ]);
  expect(applyPrepareChanges(saved, draft, savedIds, changes)).toEqual(draft);
});

test("after 200 confirmed additions, retrying saves only the remaining 250", () => {
  const ids = Array.from({ length: 450 }, (_, index) => index + 1);
  const draft = board(ids);
  const changes = buildPrepareChanges([], draft, new Set(), []);
  expect(changes).toHaveLength(450);

  const confirmed = applyPrepareChanges(
    [],
    draft,
    new Set(),
    changes.slice(0, 200)
  );
  const savedIds = new Set(indexBoard(confirmed).keys());
  const remaining = buildPrepareChanges(confirmed, draft, savedIds, []);

  expect(remaining).toEqual(changes.slice(200));
  expect(Array.from(indexBoard(confirmed).keys())).toEqual(ids.slice(0, 200));
  expect(applyPrepareChanges(confirmed, draft, savedIds, remaining)).toEqual(
    draft
  );
});

test("confirmed removals stay removed when retrying or discarding the remaining draft", () => {
  const ids = Array.from({ length: 450 }, (_, index) => index + 1);
  const saved = board(ids);
  const draft: TouristDestination[] = [];
  const changes = buildPrepareChanges(saved, draft, new Set(ids), []);
  const confirmed = applyPrepareChanges(
    saved,
    draft,
    new Set(ids),
    changes.slice(0, 200)
  );
  const savedIds = new Set(indexBoard(confirmed).keys());

  const remaining = buildPrepareChanges(confirmed, draft, savedIds, []);

  expect(Array.from(savedIds)).toEqual(ids.slice(200));
  expect(remaining).toEqual(changes.slice(200));
  expect(applyPrepareChanges(confirmed, draft, savedIds, remaining)).toEqual(
    []
  );
});

test("a confirmed move is not repeated just because an unsaved move still shifts its index", () => {
  const saved = board([1, 2, 3, 4, 5]);
  const draft = board([3, 2, 4, 5, 1]);
  const savedIds = new Set([1, 2, 3, 4, 5]);
  const movedIds = [1, 2];
  const changes = buildPrepareChanges(saved, draft, savedIds, movedIds);
  expect(changes).toEqual([
    {
      type: "move",
      attractionId: 2,
      targetGroup: "PRIMARY",
      previousAttractionId: 3,
      nextAttractionId: 4
    },
    {
      type: "move",
      attractionId: 1,
      targetGroup: "PRIMARY",
      previousAttractionId: 5,
      nextAttractionId: null
    }
  ]);
  const confirmed = applyPrepareChanges(
    saved,
    draft,
    savedIds,
    changes.slice(0, 1)
  );

  const remaining = buildPrepareChanges(confirmed, draft, savedIds, movedIds);

  expect(remaining).toEqual(changes.slice(1));
  expect(applyPrepareChanges(confirmed, draft, savedIds, remaining)).toEqual(
    draft
  );
});

test("a confirmed addition is not repeated when its placement still needs saving", () => {
  const saved = board([1, 2]);
  const draft = board([1, 3, 2]);
  const savedIds = new Set([1, 2]);
  const changes = buildPrepareChanges(saved, draft, savedIds, []);
  expect(changes).toEqual([
    { type: "attach", attractionId: 3, attractionGroup: "PRIMARY" },
    {
      type: "move",
      attractionId: 3,
      targetGroup: "PRIMARY",
      previousAttractionId: 1,
      nextAttractionId: 2
    }
  ]);
  const confirmed = applyPrepareChanges(
    saved,
    draft,
    savedIds,
    changes.slice(0, 1)
  );
  expect(confirmed).toEqual(board([1, 2, 3]));
  const confirmedIds = new Set(indexBoard(confirmed).keys());

  const remaining = buildPrepareChanges(confirmed, draft, confirmedIds, [3]);

  expect(remaining).toEqual(changes.slice(1));
  expect(
    applyPrepareChanges(confirmed, draft, confirmedIds, remaining)
  ).toEqual(draft);
});
