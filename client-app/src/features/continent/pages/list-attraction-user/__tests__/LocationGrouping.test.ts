import {
  getCountryAttractions,
  getRegionAttractions
} from "../../../../../clients/manager";
import {
  Attraction,
  AttractionType,
  AttractionVisitStatus,
  CategoryType
} from "../../../domain/Attraction.types";
import {
  getPagedAttractionsByCountryId,
  getPagedAttractionsByRegionId
} from "../../../infra/ManagerApi";
import { AttractionRow } from "../../list-attraction/ListAttraction.types";
import { toLastReadAttraction } from "../../list-attraction/ListAttraction.util";
import { sortAttractionRows } from "../ListAttractionUser.utils";
import { ListCustomizer } from "../../../../../shared/list-element/ListCustomizer";

jest.mock("../../../../../clients/manager", () => ({
  getCountryAttractions: jest.fn(),
  getRegionAttractions: jest.fn()
}));

jest.mock("../../../../../config/ClientsApiConfig", () => ({
  __esModule: true,
  default: jest.fn()
}));

const changedOn = "2026-09-28T12:00:00.123456";

const attraction = ({
  id,
  name = `Attraction ${id}`,
  cityName,
  regionName = "Illinois",
  visitStatus = AttractionVisitStatus.NOT_VISITED,
  permanentlyClosedAt
}: {
  id: number;
  name?: string;
  cityName?: string;
  regionName?: string;
  visitStatus?: AttractionVisitStatus;
  permanentlyClosedAt?: string;
}): Attraction => ({
  id,
  name: { name },
  destination: {
    countryName: "United States",
    regionName,
    cityName,
    isCountrywide: false
  },
  address: {},
  category: CategoryType.HISTORIC_SITE,
  type: AttractionType.STABLE,
  mustVisit: true,
  isTraditional: false,
  infoFrom: { source: "Guide", recorded: "2026-09-01" },
  visitStatus,
  permanentlyClosedAt,
  updatedOn: changedOn
});

test("groups visit statuses first and preserves the server's region and city order within them", () => {
  const rawPage = [
    attraction({ id: 7, name: "Independence Day celebrations" }),
    attraction({
      id: 12,
      name: "Lincoln Home National Historic Site",
      cityName: "Springfield"
    }),
    attraction({
      id: 5,
      name: "Dana-Thomas House",
      cityName: "Springfield",
      visitStatus: AttractionVisitStatus.VISITED_WANT_RETURN
    }),
    attraction({
      id: 2,
      name: "Old State Capitol",
      cityName: "Springfield",
      visitStatus: AttractionVisitStatus.VISITED_DONE
    }),
    attraction({ id: 9, name: "Spurlock Museum", cityName: "Urbana" }),
    attraction({
      id: 4,
      name: "Meadowbrook Park",
      cityName: "Urbana",
      visitStatus: AttractionVisitStatus.VISITED_DONE
    }),
    attraction({
      id: 10,
      name: "Cape Cod National Seashore",
      regionName: "Massachusetts"
    }),
    attraction({ id: 3, name: "Mohawk Trail", regionName: "Massachusetts" }),
    attraction({
      id: 11,
      name: "Basketball Hall of Fame",
      cityName: "Springfield",
      regionName: "Massachusetts",
      visitStatus: AttractionVisitStatus.VISITED_WANT_RETURN
    }),
    attraction({
      id: 6,
      name: "Forest Park",
      cityName: "Springfield",
      regionName: "Massachusetts"
    }),
    attraction({
      id: 1,
      name: "EcoTarium",
      cityName: "Worcester",
      regionName: "Massachusetts",
      permanentlyClosedAt: changedOn
    }),
    attraction({
      id: 8,
      name: "Worcester Art Museum",
      cityName: "Worcester",
      regionName: "Massachusetts",
      visitStatus: AttractionVisitStatus.VISITED_DONE
    })
  ];
  const rows = rawPage.map(AttractionRow.from);

  const displayed = sortAttractionRows(rows);

  const notVisited = [
    "Independence Day celebrations",
    "Lincoln Home National Historic Site",
    "Spurlock Museum",
    "Cape Cod National Seashore",
    "Mohawk Trail",
    "Forest Park"
  ];
  const wantReturn = ["Dana-Thomas House", "Basketball Hall of Fame"];
  const visitedDone = [
    "Old State Capitol",
    "Meadowbrook Park",
    "Worcester Art Museum"
  ];
  const permanentlyClosed = ["EcoTarium"];
  expect(displayed.map((row) => row.name.name)).toEqual([
    ...notVisited,
    ...wantReturn,
    ...visitedDone,
    ...permanentlyClosed
  ]);
  expect(rows.map((row) => row.id)).toEqual(rawPage.map((item) => item.id));
});

test("keeps the infinite-scroll sentinel after every visit-status group", () => {
  const rows = [
    attraction({
      id: 1,
      cityName: "Springfield",
      visitStatus: AttractionVisitStatus.VISITED_DONE
    }),
    attraction({ id: 2, cityName: "Springfield" }),
    attraction({ id: 3, cityName: "Urbana" })
  ].map(AttractionRow.from);
  const customizer = new ListCustomizer<AttractionRow>(
    () => {},
    () => {},
    {
      useInfiniteScroll: true,
      createColumns: () => []
    }
  ).withPagedRows(rows);

  const displayed = sortAttractionRows(customizer.items);

  expect(displayed.map((row) => row?.id)).toEqual([2, 3, 1, undefined]);
  expect(displayed.at(-1)).toBeNull();
});

test("captures the last raw item before display sorting", () => {
  const rawPage = [
    attraction({
      id: 1,
      cityName: "Springfield",
      visitStatus: AttractionVisitStatus.VISITED_DONE
    }),
    attraction({ id: 2, cityName: "Springfield" })
  ];
  const displayed = sortAttractionRows(rawPage.map(AttractionRow.from));

  expect(displayed.at(-1)?.id).toBe(1);
  expect(toLastReadAttraction(rawPage)).toEqual({
    id: 2,
    updatedOn: changedOn,
    regionName: "Illinois",
    cityName: "Springfield"
  });
});

test.each([
  {
    name: "country",
    load: getPagedAttractionsByCountryId,
    endpoint: getCountryAttractions,
    path: { countryId: 1 },
    regionCursor: { regionName: "Illinois" }
  },
  {
    name: "region",
    load: getPagedAttractionsByRegionId,
    endpoint: getRegionAttractions,
    path: { regionId: 1 },
    regionCursor: {}
  }
])(
  "requests location-grouped $name pages with filters and the full cursor",
  async ({ load, endpoint, path, regionCursor }) => {
    jest.mocked(endpoint).mockResolvedValue({ data: [], error: undefined });
    const last = toLastReadAttraction([
      attraction({ id: 5, cityName: "Springfield" })
    ]);

    await load(1, last, { mustVisit: true, q: "temple" });

    expect(endpoint).toHaveBeenCalledWith({
      headers: { "x-api-version": "1" },
      path,
      query: {
        attractionId: 5,
        updatedOn: changedOn,
        ...regionCursor,
        cityName: "Springfield",
        category: undefined,
        isCountrywide: undefined,
        isTraditional: undefined,
        mustVisit: true,
        q: "temple",
        type: undefined
      }
    });
  }
);

test.each([
  {
    name: "country",
    load: getPagedAttractionsByCountryId,
    endpoint: getCountryAttractions,
    regionCursor: { regionName: undefined }
  },
  {
    name: "region",
    load: getPagedAttractionsByRegionId,
    endpoint: getRegionAttractions,
    regionCursor: {}
  }
])(
  "starts grouped $name traversal without cursor fields",
  async ({ load, endpoint, regionCursor }) => {
    jest.mocked(endpoint).mockResolvedValue({ data: [], error: undefined });

    await load(1);

    expect(endpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        query: {
          attractionId: undefined,
          updatedOn: undefined,
          ...regionCursor,
          cityName: undefined,
          category: undefined,
          isCountrywide: undefined,
          isTraditional: undefined,
          mustVisit: undefined,
          q: undefined,
          type: undefined
        }
      })
    );
  }
);

test("continues a regional search using only the city, timestamp and attraction ID", async () => {
  jest.mocked(getRegionAttractions).mockResolvedValue({
    data: [],
    error: undefined
  });

  await getPagedAttractionsByRegionId(1, {
    id: 5,
    updatedOn: changedOn,
    cityName: "Springfield"
  });

  expect(getRegionAttractions).toHaveBeenCalledWith(
    expect.objectContaining({
      query: {
        attractionId: 5,
        updatedOn: changedOn,
        cityName: "Springfield",
        category: undefined,
        isCountrywide: undefined,
        isTraditional: undefined,
        mustVisit: undefined,
        q: undefined,
        type: undefined
      }
    })
  );
});
