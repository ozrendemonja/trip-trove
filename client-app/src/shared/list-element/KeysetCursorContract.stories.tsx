import type { Meta, StoryObj } from "@storybook/react";
import type { ResponseData, ResponseHandler } from "pretender";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, userEvent, waitFor, within } from "storybook/test";
import makeServer from "../../ServerSetup";
import BucketList from "../../features/bucket-list/BucketList";
import ListAttraction from "../../features/continent/pages/list-attraction/ListAttraction";
import ListAttractionUser from "../../features/continent/pages/list-attraction-user/ListAttractionUser";
import ListCity from "../../features/continent/pages/list-city/ListCity";
import ListCountry from "../../features/continent/pages/list-country/ListCountry";
import ListRegion from "../../features/continent/pages/list-region/ListRegion";
import MyTripList from "../../features/my-trip/MyTripList";
import { SOLID_STORY_BACKGROUND_STYLES } from "../storybook/StoryStyles";

const meta = {
  title: "Shared/ListElement/KeysetCursorContract",
  tags: ["keyset-contract"],
  parameters: { layout: "fullscreen" }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
type Request = Parameters<ResponseHandler>[0];
type CursorItem = Record<string, unknown> & { changedOn: string };
type ItemFactory = (id: number, name: string, changedOn: string) => CursorItem;

const timestamps = [
  "2026-09-28T12:00:03.123456",
  "2026-09-28T12:00:02.123456",
  "2026-09-28T12:00:01.123456"
];
let server: ReturnType<typeof makeServer> | undefined;

const json = (body: unknown, status = 200): ResponseData => [
  status,
  { "Content-Type": "application/json" },
  JSON.stringify(body)
];

const identifier = (item: CursorItem, field: string): number => {
  const value = item[field];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid controlled fixture identifier: ${field}`);
  }
  return value;
};

const compareKeys = (
  leftId: number,
  leftTime: string,
  rightId: number,
  rightTime: string
): number => {
  if (leftTime < rightTime) return -1;
  if (leftTime > rightTime) return 1;
  return leftId - rightId;
};

const country: ItemFactory = (id, name, changedOn) => ({
  countryId: id,
  countryName: name,
  continentName: "Europe",
  isoCode: "mc",
  changedOn
});
const region: ItemFactory = (id, name, changedOn) => ({
  regionId: id,
  regionName: name,
  countryName: "Monaco",
  changedOn
});
const city: ItemFactory = (id, name, changedOn) => ({
  cityId: id,
  cityName: name,
  regionName: "Fixture region",
  countryName: "Monaco",
  changedOn
});
const attraction: ItemFactory = (id, name, changedOn) => ({
  attractionId: id,
  attractionName: name,
  regionName: "Fixture region",
  countryName: "Monaco",
  isCountrywide: false,
  attractionCategory: "HISTORIC_SITE",
  attractionType: "STABLE",
  mustVisit: true,
  isTraditional: true,
  infoFrom: "Fixture source",
  infoRecorded: "2026-09-28",
  visitStatus: id === 2147483648 ? "VISITED_WANT_RETURN" : "NOT_VISITED",
  changedOn
});
const trip: ItemFactory = (id, name, changedOn) => ({
  tripId: id,
  tripName: name,
  fromDate: "2099-09-01",
  toDate: "2099-09-30",
  archived: false,
  changedOn
});
const bucketItem: ItemFactory = (id, name, changedOn) => ({
  id,
  name,
  completedOn: null,
  changedOn
});

type Contract = {
  element: ReactElement;
  path: string;
  cursorField: string;
  responseField: string;
  item: ItemFactory;
  firstIdentifier: number;
  route?: string;
  bucket?: boolean;
};

const contractStory = (contract: Contract): Story => {
  const names = ["Zulu raw first", "Alpha raw boundary", "Middle raw last"];
  const items = names.map((name, index) =>
    contract.item(contract.firstIdentifier - index, name, timestamps[index])
  );
  let requests: Request[] = [];

  return {
    render: () => contract.element,
    decorators: [
      (Story) => {
        server?.shutdown();
        server = makeServer();
        requests = [];
        const headers = [
          ["/countries/1", country(1, "Monaco", timestamps[0])],
          ["/regions/1", region(1, "Fixture region", timestamps[0])],
          ["/cities/1", city(1, "Fixture city", timestamps[0])],
          [
            "/attractions/1000000",
            attraction(1000000, "Parent attraction", timestamps[0])
          ]
        ] as const;
        for (const [path, body] of headers) {
          server.pretender.get(
            `http://localhost:8080${path}`,
            () => json(body),
            0
          );
        }
        server.pretender.get(
          "http://localhost:8080/bucket-list/items/counts",
          () => json({ all: 3, todo: 3, completed: 0 }),
          0
        );
        server.pretender.get(
          `http://localhost:8080${contract.path}`,
          (request) => {
            requests.push(request);
            const id = request.queryParams[contract.cursorField];
            const time = request.queryParams.updatedOn;
            const direction = request.queryParams.sd ?? "DESC";
            if (direction !== "ASC" && direction !== "DESC") {
              return json(
                {
                  errorCode: "BAD_REQUEST",
                  errorMessage: "Parameter 'sd' must be one of [ASC, DESC]."
                },
                400
              );
            }
            const sign = direction === "ASC" ? 1 : -1;
            const ordered = items.toSorted(
              (left, right) =>
                sign *
                compareKeys(
                  identifier(left, contract.responseField),
                  left.changedOn,
                  identifier(right, contract.responseField),
                  right.changedOn
                )
            );
            const remaining =
              id === undefined
                ? ordered
                : ordered.filter(
                    (item) =>
                      sign *
                        compareKeys(
                          identifier(item, contract.responseField),
                          item.changedOn,
                          Number(id),
                          time
                        ) >
                      0
                  );
            return json(remaining.slice(0, 2));
          },
          0
        );

        return (
          <MemoryRouter initialEntries={[contract.route ?? "/"]}>
            <Routes>
              <Route
                path="/search/:whereToSearch/:id/attractions"
                element={<Story />}
              />
              <Route path="*" element={<Story />} />
            </Routes>
            <style>{SOLID_STORY_BACKGROUND_STYLES}</style>
          </MemoryRouter>
        );
      }
    ],
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await canvas.findByText(names[0], {}, { timeout: 10000 });
      await canvas.findByText(names[1], {}, { timeout: 10000 });
      if (contract.bucket) {
        const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
        const nameHeader = canvas.getByRole("columnheader", { name: "Name" });
        await user.click(canvas.getByRole("button", { name: "Name" }));
        expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
        expect(canvas.getAllByRole("row")[1]).toHaveTextContent(names[1]);
        await user.click(canvas.getByRole("button", { name: "Load more" }));
        await canvas.findByText(names[2]);
        await user.click(canvas.getByRole("button", { name: "Load more" }));
        await waitFor(() =>
          expect(
            canvas.queryByRole("button", { name: /Load more|Loading\.\.\./ })
          ).not.toBeInTheDocument()
        );
      } else {
        await canvas.findByText(names[2], {}, { timeout: 10000 });
      }

      await waitFor(() => expect(requests).toHaveLength(3));
      expect(requests[0].queryParams[contract.cursorField]).toBeUndefined();
      expect(requests[0].queryParams.updatedOn).toBeUndefined();
      expect(requests[1].queryParams[contract.cursorField]).toBe(
        String(contract.firstIdentifier - 1)
      );
      expect(requests[1].queryParams.updatedOn).toBe(timestamps[1]);
      expect(requests[2].queryParams[contract.cursorField]).toBe(
        String(contract.firstIdentifier - 2)
      );
      expect(requests[2].queryParams.updatedOn).toBe(timestamps[2]);
      for (const name of names) {
        expect(canvas.getAllByText(name)).toHaveLength(1);
      }
      for (const request of requests) {
        expect(request.requestHeaders["x-api-version"]).toBe("1");
        expect(request.queryParams).not.toHaveProperty("after");
        expect(request.queryParams).not.toHaveProperty("pageSize");
      }
    }
  };
};

export const Countries: Story = contractStory({
  element: <ListCountry />,
  path: "/countries",
  cursorField: "countryId",
  responseField: "countryId",
  item: country,
  firstIdentifier: 2147483647
});
export const Regions: Story = contractStory({
  element: <ListRegion />,
  path: "/regions",
  cursorField: "regionId",
  responseField: "regionId",
  item: region,
  firstIdentifier: 2147483647
});
export const Cities: Story = contractStory({
  element: <ListCity />,
  path: "/cities",
  cursorField: "cityId",
  responseField: "cityId",
  item: city,
  firstIdentifier: 2147483647
});
export const AdministrativeAttractions: Story = contractStory({
  element: <ListAttraction />,
  path: "/attractions",
  cursorField: "attractionId",
  responseField: "attractionId",
  item: attraction,
  firstIdentifier: 2147483649
});
export const Trips: Story = contractStory({
  element: <MyTripList />,
  path: "/trips",
  cursorField: "tripId",
  responseField: "tripId",
  item: trip,
  firstIdentifier: 2147483649
});
export const BucketItems: Story = contractStory({
  element: <BucketList />,
  path: "/bucket-list/items",
  cursorField: "itemId",
  responseField: "id",
  item: bucketItem,
  firstIdentifier: 2147483649,
  bucket: true
});

const scopedSearch = (scope: string, id: string): Story =>
  contractStory({
    element: <ListAttractionUser />,
    route: `/search/${scope}/${id}/attractions`,
    path: `/search/${scope}/${id}/attractions`,
    cursorField: "attractionId",
    responseField: "attractionId",
    item: attraction,
    firstIdentifier: 2147483649
  });

export const ContinentSearch: Story = scopedSearch("continent", "Europe");
export const CountrySearch: Story = scopedSearch("country", "1");
export const RegionSearch: Story = scopedSearch("region", "1");
export const CitySearch: Story = scopedSearch("city", "1");
export const MainAttractionSearch: Story = scopedSearch(
  "attraction",
  "1000000"
);
