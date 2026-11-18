import { Meta, StoryObj } from "@storybook/react";
import { Response as MirageResponse } from "miragejs";
import { MemoryRouter, Route, Routes } from "react-router";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within
} from "storybook/test";
import makeServer from "../../ServerSetup";
import type { GetSearchAttractionResponse } from "../../clients/manager";
import { MyTrip } from "./MyTrip";

import { SOLID_STORY_BACKGROUND_STYLES as styleOverrides } from "../../shared/storybook/StoryStyles";

const TRIP_ID = "1";

// A saved-attractions payload (shape of GET /trips/:id/attractions) used to put a
// trip into the "already has attractions" state so the Board lands in edit mode.
const SAVED_ATTRACTIONS = [
  {
    attractionId: 0,
    attractionName: "Casino of Monte-Carlo",
    cityName: "Monaco",
    regionName: "Monaco",
    countryName: "Monaco",
    isCountrywide: false,
    attractionCategory: "POINT_OF_INTEREST_AND_LANDMARK",
    attractionType: "STABLE",
    mustVisit: true,
    isTraditional: false,
    infoFrom: "Lonely Planet",
    attractionGroup: "PRIMARY",
    status: "PLANNED"
  }
];

// Kept across renders so a previous story's Mirage instance is torn down before
// the next one starts; stacked Pretender instances corrupt subsequent requests.
let server: ReturnType<typeof makeServer>;
const boardMoves = fn();

const meta: Meta<typeof MyTrip> = {
  component: MyTrip,
  decorators: [
    (Story, context) => {
      server?.shutdown();
      server = makeServer({
        tripDateOverrides: [
          {
            tripId: 1,
            fromDate: "2099-06-10",
            toDate: "2099-06-24"
          }
        ]
      });
      if (context.parameters.trip) {
        server.get(
          "http://localhost:8080/trips/1",
          () => context.parameters.trip,
          { timing: 0 }
        );
      }
      boardMoves.mockClear();
      server.put(
        "http://localhost:8080/trips/:id/board/attractions/:attractionId",
        (_schema, request) => {
          boardMoves(
            request.params.id,
            request.params.attractionId,
            JSON.parse(request.requestBody)
          );
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
      // A story can pre-seed the trip's saved attractions; MyTrip fetches these
      // on mount and lands the Board in "edit" mode when any exist.
      const saved = context.parameters.savedAttractions;
      if (saved) {
        server.get(
          "http://localhost:8080/trips/:id/attractions",
          () =>
            new MirageResponse(
              200,
              {
                "Content-Type": "application/json"
              },
              saved
            )
        );
      }
      const initialTripId = context.parameters.initialTripId ?? TRIP_ID;
      return (
        <>
          <MemoryRouter initialEntries={[`/my-trips/${initialTripId}`]}>
            <Routes>
              <Route path="/" element={<div>Home page</div>} />
              <Route path="/my-trips" element={<div>My Trips list page</div>} />
              <Route path="/my-trips/:tripId" element={<Story />} />
            </Routes>
          </MemoryRouter>
          <style>{styleOverrides}</style>
        </>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof MyTrip>;

type User = ReturnType<typeof userEvent.setup>;

// Fluent modals/callouts briefly set pointer-events: none while animating, so
// disable user-event's interactability guard and click instantly.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// Fluent dialogs portal into document.body, outside the story canvas, so
// dialog content is queried through the document.
const overlay = (canvasElement: HTMLElement): ReturnType<typeof within> =>
  within(canvasElement.ownerDocument.body);

const openSearchForAttraction = async (
  canvasElement: HTMLElement,
  user: User
): Promise<HTMLElement> => {
  await user.click(
    await within(canvasElement).findByRole("button", { name: "Search" })
  );
  const heading = await overlay(canvasElement).findByRole("heading", {
    name: "Modifying Trip Planner"
  });
  return heading.closest('[role="dialog"]') as HTMLElement;
};

const waitForPrepareMode = (canvasElement: HTMLElement): Promise<void> =>
  waitFor(
    () => {
      expect(
        within(canvasElement).getByRole("button", { name: /Prepare/ })
      ).toHaveAttribute("aria-current", "step");
    },
    { timeout: 3000 }
  );

// The board column (its .attraction-board-column wrapper) whose <h2> title
// matches, so a test can assert which column an attraction card lives in.
const columnFor = (canvasElement: HTMLElement, title: string): HTMLElement =>
  within(canvasElement)
    .getByRole("heading", { name: title })
    .closest(".attraction-board-column") as HTMLElement;

export const Primary: Story = {};

export const HeaderCardOwnsTripSteps: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    trip: {
      tripId: 1,
      tripName: "Italy",
      fromDate: "2025-06-10",
      toDate: "2025-06-24",
      archived: false
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = within(
      await canvas.findByRole("region", { name: "Trip overview" })
    );

    await expect(
      header.getByRole("button", { name: "My Trips" })
    ).toBeVisible();
    await expect(header.getByRole("heading", { name: "Italy" })).toBeVisible();
    await expect(header.getByText(/Jun 10, 2025.*Jun 24, 2025/)).toBeVisible();
    await expect(header.getByText("15 days")).toBeVisible();
    await expect(header.getByRole("button", { name: "Search" })).toBeVisible();

    const steps = within(
      header.getByRole("navigation", { name: "Trip steps" })
    );
    await expect(
      steps.getAllByRole("button").map((button) => button.ariaLabel)
    ).toEqual(["Prepare", "Edit", "Plan", "Review"]);
    await expect(steps.getByText("Choose attractions")).toBeVisible();
    await expect(steps.getByText("Add hours, lengths, notes")).toBeVisible();
    await expect(steps.getByText("See what's scheduled")).toBeVisible();
    await expect(steps.getByText("Rate visited attractions")).toBeVisible();
    await expect(
      canvasElement.querySelector(".attraction-board-wrapper .mode-selector")
    ).not.toBeInTheDocument();
  }
};

export const LongTripName: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    trip: {
      tripId: 1,
      tripName: "An Italian journey from the coast to the mountains",
      fromDate: "2025-06-10",
      toDate: "2025-06-24",
      archived: false
    }
  }
};

export const LandsInPrepareModeForEmptyTrip: Story = {
  play: async ({ canvasElement }) => {
    await waitForPrepareMode(canvasElement);
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("button", { name: /Edit/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /Plan/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /Review/ })
    ).toBeInTheDocument();
  }
};

export const PrepareOnlyContinuesToEdit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await waitForPrepareMode(canvasElement);

    const prepare = canvas.getByRole("button", { name: "Prepare" });
    const edit = canvas.getByRole("button", { name: "Edit" });
    const plan = canvas.getByRole("button", { name: "Plan" });
    const review = canvas.getByRole("button", { name: "Review" });

    await expect(plan).toBeDisabled();
    await expect(plan).toHaveAccessibleDescription("After Edit");
    await expect(review).toBeDisabled();
    await expect(review).toHaveAccessibleDescription("After Edit");
    await user.click(plan);
    await user.click(review);
    await user.keyboard("{Alt>}3{/Alt}{Alt>}4{/Alt}");
    await expect(prepare).toHaveAttribute("aria-current", "step");

    await user.keyboard("{Control>}v{/Control}");
    await expect(edit).toHaveAttribute("aria-current", "step");
    await expect(plan).toBeEnabled();
    await expect(plan).toHaveAccessibleDescription("See what's scheduled");
    await expect(review).toBeDisabled();
    await expect(review).toHaveAccessibleDescription("After the trip");
    await user.keyboard("{Alt>}4{/Alt}");
    await expect(edit).toHaveAttribute("aria-current", "step");

    await user.click(plan);
    await expect(plan).toHaveAttribute("aria-current", "step");
    await user.keyboard("{Control>}v{/Control}");
    await expect(prepare).toHaveAttribute("aria-current", "step");
    await expect(plan).toHaveAccessibleDescription("After Edit");
    await expect(review).toHaveAccessibleDescription("After Edit");

    await user.click(edit);
    await expect(edit).toHaveAttribute("aria-current", "step");
    await expect(plan).toBeEnabled();
  }
};

export const LandsInEditModeWhenTripHasSavedAttractions: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole(
      "button",
      { name: "Remove Casino of Monte-Carlo from trip" },
      { timeout: 5000 }
    );

    await expect(canvas.getByRole("button", { name: /Edit/ })).toHaveAttribute(
      "aria-current",
      "step"
    );
    await expect(
      canvas.getByRole("button", { name: /Prepare/ })
    ).not.toHaveAttribute("aria-current");
  }
};

export const PastTripLandsInReview: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    trip: {
      tripId: 1,
      tripName: "Italy",
      fromDate: "2025-06-10",
      toDate: "2025-06-24",
      archived: false
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const review = await canvas.findByRole("button", { name: "Review" });

    await expect(review).toHaveAttribute("aria-current", "step");
    await expect(
      canvas.getByRole("button", { name: "Excellent" })
    ).toBeVisible();
    await user.click(canvas.getByRole("button", { name: "Prepare" }));
    await expect(review).toBeDisabled();
    await expect(review).toHaveAccessibleDescription("After Edit");
    await user.keyboard("{Alt>}4{/Alt}");
    await expect(
      canvas.getByRole("button", { name: "Prepare" })
    ).toHaveAttribute("aria-current", "step");
    await user.click(canvas.getByRole("button", { name: "Edit" }));
    await expect(review).toBeEnabled();
    await user.keyboard("{Alt>}4{/Alt}");
    await expect(review).toHaveAttribute("aria-current", "step");
  }
};

export const EmptyPastTripLandsInReview: Story = {
  parameters: {
    trip: {
      tripId: 1,
      tripName: "Italy",
      fromDate: "2025-06-10",
      toDate: "2025-06-24",
      archived: false
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("button", { name: "Review" })
    ).toHaveAttribute("aria-current", "step");
    await expect(canvas.getByRole("button", { name: "Plan" })).toBeEnabled();
  }
};

export const ArchivedTripRemainsReviewable: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    trip: {
      tripId: 1,
      tripName: "Italy",
      fromDate: "2099-06-10",
      toDate: "2099-06-24",
      archived: true
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const review = await canvas.findByRole("button", { name: "Review" });

    await expect(review).toHaveAttribute("aria-current", "step");
    await user.click(canvas.getByRole("button", { name: "Plan" }));
    await expect(review).toBeEnabled();
    await expect(review).toHaveAccessibleDescription(
      "Rate visited attractions"
    );
    await user.click(review);
    await expect(review).toHaveAttribute("aria-current", "step");
    await expect(
      canvas.getByRole("button", { name: "Excellent" })
    ).toBeVisible();
  }
};

export const SaveToTripButtonIsAbsentInEditMode: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole(
      "button",
      { name: "Remove Casino of Monte-Carlo from trip" },
      { timeout: 5000 }
    );

    await expect(canvas.getByRole("button", { name: /Edit/ })).toHaveAttribute(
      "aria-current",
      "step"
    );
    await expect(
      canvas.queryByRole("button", { name: /Save to trip/ })
    ).not.toBeInTheDocument();
  }
};

export const PlanModePersistsMovesBetweenColumns: Story = {
  parameters: {
    savedAttractions: [
      ...SAVED_ATTRACTIONS,
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 1,
        attractionName: "Oceanographic Museum",
        attractionGroup: "SECONDARY"
      }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await canvas.findByLabelText(
      /Visited in "Riviera 2025"/,
      {},
      { timeout: 5000 }
    );
    await user.click(canvas.getByRole("button", { name: /Plan/ }));

    const sourceColumn = columnFor(canvasElement, "Top Attractions");
    const targetColumn = columnFor(canvasElement, "Secondary Spots");
    const sourceCard = within(sourceColumn)
      .getByRole("link", { name: "Casino of Monte-Carlo" })
      .closest("li.attraction") as HTMLElement;
    const dataTransfer = new DataTransfer();
    fireEvent.dragStart(sourceCard, { dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.drop(targetColumn, { dataTransfer });

    await within(targetColumn).findByRole("link", {
      name: "Casino of Monte-Carlo"
    });
    await expect(
      within(sourceColumn).queryByRole("link", {
        name: "Casino of Monte-Carlo"
      })
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(boardMoves).toHaveBeenCalledTimes(1);
      expect(boardMoves).toHaveBeenCalledWith("1", "0", {
        targetGroup: "SECONDARY",
        previousAttractionId: 1,
        nextAttractionId: null
      });
    });
  }
};

export const PlanModePersistsOrderWithinColumn: Story = {
  parameters: {
    savedAttractions: [
      ...SAVED_ATTRACTIONS,
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 1,
        attractionName: "Oceanographic Museum"
      }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await canvas.findByLabelText(
      /Visited in "Riviera 2025"/,
      {},
      { timeout: 5000 }
    );
    await user.click(canvas.getByRole("button", { name: /Plan/ }));

    const topColumn = columnFor(canvasElement, "Top Attractions");
    await expect(
      Array.from(topColumn.querySelectorAll("li.attraction")).map((card) =>
        card.getAttribute("data-id")
      )
    ).toEqual(["0", "1"]);

    const sourceCard = within(topColumn)
      .getByRole("link", { name: "Oceanographic Museum" })
      .closest("li.attraction") as HTMLElement;
    const dataTransfer = new DataTransfer();
    fireEvent.dragStart(sourceCard, { dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.dragOver(topColumn, { clientY: -1, dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.drop(topColumn, { dataTransfer });

    await waitFor(() => {
      expect(
        Array.from(topColumn.querySelectorAll("li.attraction")).map((card) =>
          card.getAttribute("data-id")
        )
      ).toEqual(["1", "0"]);
      expect(boardMoves).toHaveBeenCalledTimes(1);
      expect(boardMoves).toHaveBeenCalledWith("1", "1", {
        targetGroup: "PRIMARY",
        previousAttractionId: null,
        nextAttractionId: 0
      });
    });
  }
};

export const BackButtonReturnsToTripsList: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);

    await user.click(await canvas.findByRole("button", { name: "My Trips" }));

    await expect(await canvas.findByText("My Trips list page")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "My Trips" })
    ).not.toBeInTheDocument();
  }
};

export const TripTroveButtonReturnsHome: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);

    await user.click(await canvas.findByRole("button", { name: "Trip Trove" }));

    await expect(await canvas.findByText("Home page")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Trip Trove" })
    ).not.toBeInTheDocument();
  }
};

export const SearchModalShowsAllSearchOptionsWithConfirmDisabled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modalElement = await openSearchForAttraction(canvasElement, user);
    const modal = within(modalElement);

    await expect(
      modal.getByRole("button", { name: "Country" })
    ).toBeInTheDocument();
    await expect(
      modal.getByRole("button", { name: "Region" })
    ).toBeInTheDocument();
    await expect(
      modal.getByRole("button", { name: "City" })
    ).toBeInTheDocument();
    await expect(
      modal.getByRole("button", { name: "Main attraction" })
    ).toBeInTheDocument();
    await expect(
      modal.getByRole("button", { name: "Attraction" })
    ).toBeInTheDocument();
    await expect(modal.getByRole("button", { name: "Update" })).toBeDisabled();
  }
};

export const SearchSuggestionsOverlayDialogContent: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modalElement = await openSearchForAttraction(canvasElement, user);
    const modal = within(modalElement);
    const input = modal.getByRole("textbox");

    await user.type(input, "Mon");
    const suggestion = await modal.findByRole(
      "menuitem",
      { name: "Monaco" },
      { timeout: 5000 }
    );
    const dialogContent = input.closest(".fui-DialogContent") as HTMLElement;

    expect(dialogContent).not.toBeNull();
    expect(
      dialogContent.ownerDocument.defaultView?.getComputedStyle(dialogContent)
        .overflowY
    ).toBe("visible");
    expect(suggestion.getBoundingClientRect().bottom).toBeGreaterThan(
      dialogContent.getBoundingClientRect().bottom
    );
  }
};

export const ShowsLoadFailureWhenTripNotFound: Story = {
  parameters: { initialTripId: "999" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        "The trip couldn't be loaded.",
        {},
        { timeout: 3000 }
      )
    ).toBeVisible();
    await expect(
      canvas.queryByRole("navigation", { name: "Trip steps" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: /Prepare/ })
    ).not.toBeInTheDocument();
  }
};

export const SwitchingSearchOptionMovesSelectedHighlight: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modalElement = await openSearchForAttraction(canvasElement, user);
    const modal = within(modalElement);

    // Country is selected by default.
    await expect(
      modal.getByRole("button", { name: "Country" })
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(modal.getByRole("button", { name: "Region" }));
    await waitFor(() =>
      expect(modal.getByRole("button", { name: "Region" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    );
    await expect(
      modal.getByRole("button", { name: "Country" })
    ).toHaveAttribute("aria-pressed", "false");
  }
};

export const CancelDismissesSearchModal: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modalElement = await openSearchForAttraction(canvasElement, user);
    await user.click(
      within(modalElement).getByRole("button", { name: "Cancel" })
    );
    await waitFor(
      () => {
        expect(
          overlay(canvasElement).queryByRole("heading", {
            name: "Modifying Trip Planner"
          })
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  }
};

const searchAndAddCountry = async (
  canvasElement: HTMLElement,
  user: User,
  query: string,
  suggestion: string
): Promise<void> => {
  const modalElement = await openSearchForAttraction(canvasElement, user);
  const modal = within(modalElement);
  // Country is the default search option.
  await user.type(modal.getByRole("textbox"), query);
  await user.click(
    await modal.findByRole("menuitem", { name: suggestion }, { timeout: 5000 })
  );
  const update = modal.getByRole("button", { name: "Update" });
  await waitFor(() => expect(update).toBeEnabled());
  await user.click(update);
};

export const AddsAttractionsWhenSearchSubmitted: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");

    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Trip Planner"
        })
      ).not.toBeInTheDocument()
    );
    await canvas.findByRole("heading", { name: "Monaco" }, { timeout: 8000 });
    await expect(
      canvas.getByRole("button", { name: "Remove Casino Square from trip" })
    ).toBeInTheDocument();
  }
};

const LOCATION_ATTRACTION = {
  countryName: "Monaco",
  regionName: "Monaco",
  isCountrywide: false,
  attractionCategory: "HISTORIC_SITE",
  attractionType: "STABLE",
  mustVisit: true,
  isTraditional: false,
  infoFrom: "Guide",
  infoRecorded: "2026-09-01",
  changedOn: "2026-09-28T12:00:00.123456",
  visitStatus: "NOT_VISITED"
} satisfies GetSearchAttractionResponse;

const LOCATION_SEARCH_RESULTS: GetSearchAttractionResponse[] = [
  {
    ...LOCATION_ATTRACTION,
    attractionId: 101,
    attractionName: "Regional landmark"
  },
  {
    ...LOCATION_ATTRACTION,
    attractionId: 102,
    attractionName: "Alpha landmark",
    cityName: "Alpha"
  },
  {
    ...LOCATION_ATTRACTION,
    attractionId: 103,
    attractionName: "Beta landmark",
    cityName: "Beta"
  }
];

const expectAllLocationPagesAdded = async (
  canvasElement: HTMLElement,
  scope: "Country" | "Region",
  regionCursor: Readonly<{ regionName?: string }>
): Promise<void> => {
  const pageRequests = fn();
  server.get(
    `http://localhost:8080/search/${scope.toLowerCase()}/:id/attractions`,
    (_schema, request) => {
      pageRequests(request.queryParams);
      const anchorIndex = LOCATION_SEARCH_RESULTS.findIndex(
        (attraction) =>
          String(attraction.attractionId) === request.queryParams.attractionId
      );
      return LOCATION_SEARCH_RESULTS.slice(anchorIndex + 1, anchorIndex + 2);
    },
    { timing: 0 }
  );
  const user = setupUser();
  const modal = within(await openSearchForAttraction(canvasElement, user));
  await user.click(modal.getByRole("button", { name: scope }));
  await user.type(modal.getByRole("textbox"), "Mon");
  await user.click(
    await modal.findByRole("menuitem", { name: "Monaco" }, { timeout: 5000 })
  );
  await user.click(modal.getByRole("button", { name: "Update" }));

  const canvas = within(canvasElement);
  await canvas.findByRole(
    "button",
    { name: "Remove Beta landmark from trip" },
    { timeout: 8000 }
  );
  expect(
    canvas.getByRole("button", { name: "Remove Regional landmark from trip" })
  ).toBeInTheDocument();
  expect(
    canvas.getByRole("button", { name: "Remove Alpha landmark from trip" })
  ).toBeInTheDocument();
  expect(pageRequests).toHaveBeenCalledTimes(4);
  expect(pageRequests).toHaveBeenNthCalledWith(1, {});
  expect(pageRequests).toHaveBeenNthCalledWith(2, {
    attractionId: "101",
    updatedOn: LOCATION_ATTRACTION.changedOn,
    ...regionCursor
  });
  expect(pageRequests).toHaveBeenNthCalledWith(3, {
    attractionId: "102",
    updatedOn: LOCATION_ATTRACTION.changedOn,
    ...regionCursor,
    cityName: "Alpha"
  });
  expect(pageRequests).toHaveBeenNthCalledWith(4, {
    attractionId: "103",
    updatedOn: LOCATION_ATTRACTION.changedOn,
    ...regionCursor,
    cityName: "Beta"
  });
};

export const AddsAllCountryPagesWithLocationCursors: Story = {
  tags: ["location-grouping"],
  play: async ({ canvasElement }) => {
    await expectAllLocationPagesAdded(canvasElement, "Country", {
      regionName: "Monaco"
    });
  }
};

export const AddsAllRegionPagesWithLocationCursors: Story = {
  tags: ["location-grouping"],
  play: async ({ canvasElement }) => {
    await expectAllLocationPagesAdded(canvasElement, "Region", {});
  }
};

export const AddsOnlySelectedAttractionWhenAttractionSearchSubmitted: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modalElement = await openSearchForAttraction(canvasElement, user);
    const modal = within(modalElement);

    await user.click(modal.getByRole("button", { name: "Attraction" }));
    await user.type(modal.getByRole("textbox"), "Casino of Monte");
    await user.click(
      await modal.findByRole(
        "menuitem",
        { name: "Casino of Monte-Carlo" },
        { timeout: 5000 }
      )
    );
    await user.click(modal.getByRole("button", { name: "Update" }));

    const canvas = within(canvasElement);
    await canvas.findByRole(
      "link",
      { name: "Casino of Monte-Carlo" },
      { timeout: 8000 }
    );
    await expect(
      canvas.queryByRole("link", { name: "Casino Square" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: "Larvotto Beach" })
    ).not.toBeInTheDocument();
  }
};

export const MarkedWouldVisitAgainAttractionsAreSuggestedInSecondaryColumn: Story =
  {
    play: async ({ canvasElement }) => {
      const user = setupUser();
      await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");

      const canvas = within(canvasElement);
      await canvas.findByRole(
        "link",
        { name: "Casino of Monte-Carlo" },
        { timeout: 8000 }
      );

      await expect(
        within(columnFor(canvasElement, "Secondary Spots")).getByRole("link", {
          name: "Casino of Monte-Carlo"
        })
      ).toBeInTheDocument();
      await expect(
        within(columnFor(canvasElement, "Excluded Attractions")).queryByRole(
          "link",
          { name: "Casino of Monte-Carlo" }
        )
      ).not.toBeInTheDocument();
      // A visited attraction that was NOT flagged still lands in Excluded, proving
      // the wouldVisitAgain flag is what decides the column.
      await expect(
        within(columnFor(canvasElement, "Excluded Attractions")).getByRole(
          "link",
          { name: "Larvotto Beach" }
        )
      ).toBeInTheDocument();
    }
  };

export const KeepsExistingAttractionsWhenAddingMore: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole(
      "button",
      { name: "Remove Casino of Monte-Carlo from trip" },
      { timeout: 5000 }
    );

    const user = setupUser();
    await searchAndAddCountry(canvasElement, user, "Lith", "Lithuania");

    await canvas.findByRole(
      "button",
      { name: "Remove Vilnius Old Town from trip" },
      { timeout: 8000 }
    );
    await expect(
      canvas.getByRole("button", {
        name: "Remove Casino of Monte-Carlo from trip"
      })
    ).toBeInTheDocument();
  }
};

// The header handles shortcuts on window, so no element needs focus first.
const switchModeWithShortcut = async (
  canvasElement: HTMLElement,
  user: User,
  digit: string,
  activeButton: RegExp
): Promise<void> => {
  await user.keyboard(`{Alt>}${digit}{/Alt}`);
  await waitFor(() =>
    expect(
      within(canvasElement).getByRole("button", { name: activeButton })
    ).toHaveAttribute("aria-current", "step")
  );
};

export const SwitchesBoardModesWithAltNumberShortcuts: Story = {
  parameters: {
    trip: {
      tripId: 1,
      tripName: "Italy",
      fromDate: "2025-06-10",
      toDate: "2025-06-24",
      archived: false
    }
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await within(canvasElement).findByRole("region", {
      name: "Trip overview"
    });

    await user.click(
      within(canvasElement).getByRole("button", { name: "Prepare" })
    );
    await waitForPrepareMode(canvasElement);
    await switchModeWithShortcut(canvasElement, user, "2", /Edit/);
    await switchModeWithShortcut(canvasElement, user, "3", /Plan/);
    await switchModeWithShortcut(canvasElement, user, "4", /Review/);
    await switchModeWithShortcut(canvasElement, user, "1", /Prepare/);

    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: /Edit/ })
    ).not.toHaveAttribute("aria-current");
    await expect(
      canvas.getByRole("button", { name: /Plan/ })
    ).not.toHaveAttribute("aria-current");
    await expect(
      canvas.getByRole("button", { name: /Review/ })
    ).not.toHaveAttribute("aria-current");
  }
};
