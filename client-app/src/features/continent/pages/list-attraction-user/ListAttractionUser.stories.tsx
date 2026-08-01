import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { MemoryRouter, Route, Routes } from "react-router";
import makeServer from "../../../../ServerSetup";
import AttractionListUser from "./ListAttractionUser";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

let server: ReturnType<typeof makeServer>;

const meta: Meta<typeof AttractionListUser> = {
  component: AttractionListUser,
  decorators: [
    (Story, context) => {
      const closedAttractionId = context.parameters
        .permanentlyClosedAttractionId as number | undefined;
      server?.shutdown();
      server = makeServer({
        permanentlyClosedAttractionId: closedAttractionId
      });
      return (
        <>
          <MemoryRouter
            initialEntries={["/search/continent/Europe/attractions"]}
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
type User = ReturnType<typeof userEvent.setup>;

// Fluent modals/callouts animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Clicking instantly (delay: null)
// avoids racing the debounced reload effect that fires on every filter change.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// The Fluent filter modal portals into a layer appended to <body>, outside the
// story canvas, so its contents are queried through the document, not the canvas.
const overlay = (canvasElement: HTMLElement): ReturnType<typeof within> =>
  within(canvasElement.ownerDocument.body);

const waitForAttractionsToLoad = (
  canvasElement: HTMLElement
): Promise<HTMLElement> =>
  within(canvasElement).findByRole(
    "gridcell",
    { name: /Casino of Monte-Carlo \(part of Casino Square\)/ },
    { timeout: 5000 }
  );

const openFilters = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  const canvas = within(canvasElement);
  await user.click(canvas.getByRole("button", { name: "Filters" }));
  await overlay(canvasElement).findByRole("heading", {
    name: "Search filters"
  });
};

const applyFilter = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await openFilters(canvasElement, user);
  await user.click(overlay(canvasElement).getByRole("button", { name }));
  await waitFor(() =>
    expect(
      overlay(canvasElement).queryByRole("heading", { name: "Search filters" })
    ).not.toBeInTheDocument()
  );
  await waitForAttractionsToLoad(canvasElement);
};

const expectSelectedOption = (
  canvasElement: HTMLElement,
  name: string
): void => {
  const option = overlay(canvasElement).getByRole("button", { name });
  expect(option.querySelector('[data-icon-name="Clear"]')).toBeInTheDocument();
};

const expectNotSelected = (canvasElement: HTMLElement, name: string): void => {
  const option = overlay(canvasElement).getByRole("button", { name });
  expect(
    option.querySelector('[data-icon-name="Clear"]')
  ).not.toBeInTheDocument();
};

const attractionCell = (
  canvasElement: HTMLElement,
  name: string
): HTMLElement => {
  const cell = within(canvasElement)
    .getByText(name)
    .closest('[role="gridcell"]');
  if (!cell) {
    throw new Error(`Missing grid cell for attraction "${name}"`);
  }
  return cell as HTMLElement;
};

export const Primary: Story = {};

export const ShowsPermanentlyClosedStatusInSearch: Story = {
  tags: ["closure-status", "closure-user-readonly"],
  parameters: { permanentlyClosedAttractionId: 0 },
  play: async ({ canvasElement }) => {
    await waitForAttractionsToLoad(canvasElement);
    const cell = attractionCell(canvasElement, "Casino of Monte-Carlo");

    expect(
      within(cell).getByRole("img", {
        name: /Casino of Monte-Carlo is permanently closed/
      })
    ).toHaveClass("permanently-closed-status", "is-closed");
    expect(
      within(cell).queryByRole("button", {
        name: /Casino of Monte-Carlo is permanently closed/
      })
    ).not.toBeInTheDocument();
    expect(
      within(cell).getByText("Casino of Monte-Carlo", { selector: "div" })
    ).toHaveClass("permanently-closed-list-name");
    expect(within(cell).getByText(/^Permanently closed since .+/)).toHaveClass(
      "permanently-closed-since"
    );
    expect(
      cell.querySelector('[data-icon-name="Pinned"]')
    ).not.toBeInTheDocument();

    const attractionLinks = within(
      within(canvasElement).getByRole("grid", { name: "Item details" })
    ).getAllByRole("link");
    expect(attractionLinks[attractionLinks.length - 1]).toHaveTextContent(
      "Casino of Monte-Carlo"
    );
  }
};

export const ShowsUserAttractions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForAttractionsToLoad(canvasElement);

    expect(
      canvas.getByRole("heading", { name: "Attractions" })
    ).toBeInTheDocument();
    expect(canvas.getByRole("button", { name: "Filters" })).toBeInTheDocument();

    const names = [
      "Casino of Monte-Carlo",
      "Casino Square",
      "Larvotto Beach",
      "Vilnius Old Town"
    ];
    names.forEach((name) => expect(canvas.getByText(name)).toBeInTheDocument());

    const pin = (name: string): Element | null =>
      attractionCell(canvasElement, name).querySelector(
        '[data-icon-name="Pinned"]'
      );
    const cotton = (name: string): Element | null =>
      attractionCell(canvasElement, name).querySelector(
        '[data-icon-name="Cotton"]'
      );

    expect(pin("Casino Square")).toBeInTheDocument();
    expect(pin("Vilnius Old Town")).toBeInTheDocument();
    expect(pin("Casino of Monte-Carlo")).not.toBeInTheDocument();
    expect(pin("Larvotto Beach")).not.toBeInTheDocument();

    expect(cotton("Vilnius Old Town")).toBeInTheDocument();
    expect(cotton("Casino of Monte-Carlo")).not.toBeInTheDocument();
    expect(cotton("Casino Square")).not.toBeInTheDocument();
    expect(cotton("Larvotto Beach")).not.toBeInTheDocument();
  }
};

export const OpensFilterPanelWithNothingSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAttractionsToLoad(canvasElement);
    await openFilters(canvasElement, user);

    // Every option starts unselected the first time the panel is opened.
    [
      "Countrywide",
      "Local",
      "Skip-Worthy Spots",
      "Traditional",
      "Modern",
      "SPECIALITY_MUSEUM",
      "POINT_OF_INTEREST_AND_LANDMARK",
      "HISTORIC_SITE",
      "RELIGIOUS_SITE",
      "ARENA_AND_STADIUM",
      "OTHER_LANDMARK",
      "SPECIALITY_MUSEUM",
      "ART_MUSEUM",
      "HISTORY_MUSEUM",
      "SCIENCE_MUSEUM",
      "OTHER_MUSEUM",
      "PARK",
      "NATURE_AND_WILDLIFE_AREA",
      "OTHER_NATURE_AND_PARK",
      "LAND_BASED_ACTIVITY",
      "AIR_BASED_ACTIVITY",
      "WATER_BASED_ACTIVITY",
      "OTHER_OUTDOOR_ACTIVITY",
      "SPORTING_EVENT",
      "CULTURAL_EVENT",
      "THEATRE_EVENT",
      "OTHER_EVENT",
      "SHOPPING",
      "ZOO_AND_AQUARIUM",
      "NIGHTLIFE",
      "FOOD",
      "DRINK",
      "WILDLIFE_TOUR",
      "EXTREME_SPORT_TOUR",
      "OTHER_TOUR",
      "WATER_AND_AMUSEMENT_PARK",
      "FILM_AND_TV_TOUR",
      "CLASS_AND_WORKSHOP",
      "OTHER_FUN_AND_GAME",
      "SPA_AND_WELLNESS",
      "EATERY",
      "BEVERAGE_SPOT",
      "IMMINENT_CHANGE",
      "POTENTIAL_CHANGE",
      "STABLE"
    ].forEach((name) => expectNotSelected(canvasElement, name));
  }
};

export const KeepsSelectedFilterAfterReopening: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAttractionsToLoad(canvasElement);

    await applyFilter(canvasElement, user, "Countrywide");
    await openFilters(canvasElement, user);

    expectSelectedOption(canvasElement, "Countrywide");
  }
};

export const ChangesSelectionWithinTheSameGroup: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAttractionsToLoad(canvasElement);

    await applyFilter(canvasElement, user, "Countrywide");
    await applyFilter(canvasElement, user, "Local");
    await openFilters(canvasElement, user);

    expectNotSelected(canvasElement, "Countrywide");
    expectSelectedOption(canvasElement, "Local");
  }
};

export const DeselectsFilterWhenPickedAgain: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAttractionsToLoad(canvasElement);

    await applyFilter(canvasElement, user, "Countrywide");
    await applyFilter(canvasElement, user, "Countrywide");
    await openFilters(canvasElement, user);

    expectNotSelected(canvasElement, "Countrywide");
  }
};

export const SelectsMultipleFiltersAcrossGroups: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAttractionsToLoad(canvasElement);

    const selected = [
      "Countrywide",
      "Skip-Worthy Spots",
      "Traditional",
      "SPECIALITY_MUSEUM",
      "STABLE"
    ];
    for (const name of selected) {
      await applyFilter(canvasElement, user, name);
    }
    await openFilters(canvasElement, user);

    selected.forEach((name) => expectSelectedOption(canvasElement, name));
  }
};

export const ReplacingCategoryKeepsOtherFiltersSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAttractionsToLoad(canvasElement);

    const selected = [
      "Countrywide",
      "Skip-Worthy Spots",
      "Traditional",
      "SPECIALITY_MUSEUM",
      "STABLE",
      "AIR_BASED_ACTIVITY"
    ];
    for (const name of selected) {
      await applyFilter(canvasElement, user, name);
    }
    await openFilters(canvasElement, user);

    expectSelectedOption(canvasElement, "AIR_BASED_ACTIVITY");
    expectNotSelected(canvasElement, "SPECIALITY_MUSEUM");
    ["Countrywide", "Skip-Worthy Spots", "Traditional", "STABLE"].forEach(
      (name) => expectSelectedOption(canvasElement, name)
    );
  }
};

export const DeselectingFilterKeepsOtherFiltersSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAttractionsToLoad(canvasElement);

    const selected = [
      "Countrywide",
      "Skip-Worthy Spots",
      "Traditional",
      "SPECIALITY_MUSEUM",
      "STABLE",
      "STABLE"
    ];
    for (const name of selected) {
      await applyFilter(canvasElement, user, name);
    }
    await openFilters(canvasElement, user);

    expectNotSelected(canvasElement, "STABLE");
    [
      "Countrywide",
      "Skip-Worthy Spots",
      "Traditional",
      "SPECIALITY_MUSEUM"
    ].forEach((name) => expectSelectedOption(canvasElement, name));
  }
};
