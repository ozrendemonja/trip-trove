import { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "storybook/test";
import { MemoryRouter, Route, Routes } from "react-router";
import { GetAttractionResponse } from "../../../../clients/manager";
import makeServer from "../../../../ServerSetup";
import { RADIAL_STORY_BACKGROUND_STYLES as styleOverrides } from "../../../../shared/storybook/StoryStyles";
import AttractionListUser from "./ListAttractionUser";

let server: ReturnType<typeof makeServer>;

const attraction = (
  attractionId: number,
  attractionName: string,
  regionName: string,
  cityName?: string
): GetAttractionResponse => ({
  attractionId,
  attractionName,
  countryName: "Lithuania",
  regionName,
  cityName,
  isCountrywide: false,
  attractionCategory: "HISTORIC_SITE",
  attractionType: "STABLE",
  mustVisit: true,
  isTraditional: false,
  infoFrom: "Guide",
  infoRecorded: "2026-09-01",
  changedOn: "2026-09-28T12:00:00.123456"
});

const meta: Meta<typeof AttractionListUser> = {
  component: AttractionListUser,
  tags: ["location-grouping"],
  parameters: { searchPath: "/search/country/3/attractions" },
  decorators: [
    (Story, context) => {
      server?.shutdown();
      server = makeServer();
      server.db.regions.update({ regionId: 1 }, { regionName: "Central" });
      server.db.regions.update({ regionId: 2 }, { regionName: "South" });
      server.db.attractions.remove();
      server.db.attractions.insert([
        attraction(0, "Alpha revisit", "Central", "Alpha"),
        {
          ...attraction(1, "Beta closed", "Central", "Beta"),
          permanentlyClosedAt: "2026-09-01T12:00:00"
        },
        attraction(2, "Alpha visited", "Central", "Alpha"),
        attraction(3, "Beta unvisited", "Central", "Beta"),
        attraction(4, "Alpha unvisited", "Central", "Alpha"),
        attraction(5, "South Alpha", "South", "Alpha"),
        attraction(6, "Region-wide attraction", "Central")
      ]);
      return (
        <>
          <MemoryRouter
            initialEntries={[String(context.parameters.searchPath)]}
          >
            <Routes>
              <Route
                path="/search/:whereToSearch/:id/attractions"
                element={<Story />}
              />
            </Routes>
          </MemoryRouter>
          <style>{styleOverrides}</style>
        </>
      );
    }
  ]
};

export default meta;
type Story = StoryObj<typeof AttractionListUser>;

export const CountryGroupsLocationsWithinVisitStatuses: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Beta closed");
    const grid = canvas.getByRole("grid", { name: "Item details" });

    await waitFor(() =>
      expect(
        within(grid)
          .getAllByRole("link")
          .map((link) => link.textContent)
      ).toEqual([
        "Region-wide attraction",
        "Alpha unvisited",
        "Beta unvisited",
        "South Alpha",
        "Alpha revisit",
        "Alpha visited",
        "Beta closed"
      ])
    );
  }
};

export const RegionGroupsCitiesWithinVisitStatuses: Story = {
  parameters: { searchPath: "/search/region/1/attractions" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Beta closed");
    const grid = canvas.getByRole("grid", { name: "Item details" });

    await waitFor(() =>
      expect(
        within(grid)
          .getAllByRole("link")
          .map((link) => link.textContent)
      ).toEqual([
        "Region-wide attraction",
        "Alpha unvisited",
        "Beta unvisited",
        "Alpha revisit",
        "Alpha visited",
        "Beta closed"
      ])
    );
    expect(canvas.queryByText("South Alpha")).not.toBeInTheDocument();
  }
};
