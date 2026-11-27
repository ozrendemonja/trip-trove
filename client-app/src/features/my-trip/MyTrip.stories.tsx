import { Meta, StoryObj } from "@storybook/react";
import { Response as MirageResponse } from "miragejs";
import { createMemoryRouter, RouterProvider } from "react-router";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within
} from "storybook/test";
import makeServer from "../../ServerSetup";
import type {
  AddAttractionUnderTripRequest,
  GetAttractionResponse,
  GetItineraryResponse,
  GetSearchAttractionResponse,
  ItineraryTransferDto,
  UpdateItineraryDayNoteRequest,
  UpdateItineraryTransferRequest,
  UpdateTripAttractionNoteRequest,
  UpdateTripAttractionVisitTimeRequest
} from "../../clients/manager";
import { MyTrip } from "./MyTrip";
import type { TripAttractionFromServer } from "./infra/TripApi";

import { SOLID_STORY_BACKGROUND_STYLES as styleOverrides } from "../../shared/storybook/StoryStyles";

const TRIP_ID = "1";
const ITINERARY_TRIP = {
  tripId: 1,
  tripName: "Italy",
  fromDate: "2025-06-10",
  toDate: "2025-06-24",
  archived: false
};

const itineraryFixture = (
  fromDate: string,
  toDate: string,
  unscheduledAttractions: GetItineraryResponse["unscheduledAttractions"] = []
): GetItineraryResponse => {
  const lastDay = new Date(toDate);
  const days: GetItineraryResponse["days"] = [];
  for (
    const date = new Date(fromDate);
    date <= lastDay;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    days.push({
      id: days.length + 1,
      date: date.toISOString().slice(0, 10),
      entries: []
    });
  }
  return {
    tripId: 1,
    days,
    unscheduledAttractions,
    checkState: "NOT_YET_CHECKED",
    changeNotices: [],
    checkContext: "displayed-itinerary"
  };
};

// A saved-attractions payload (shape of GET /trips/:id/attractions) used to put a
// trip into the "already has attractions" state so the Board lands in edit mode.
const SAVED_ATTRACTIONS: TripAttractionFromServer[] = [
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
type Server = ReturnType<typeof makeServer>;
let server: Server;
const boardMoves = fn();
const boardNotes = fn();
const schedulingPosts = fn();
const checkPosts = fn();
const itineraryNoteWrites = fn();
const timingPuts = fn();
const compositionWrites = fn();
const itineraryUrl = "http://localhost:8080/trips/1/itinerary";
const schedulingUrl = "http://localhost:8080/trips/1/itinerary/attractions";
const entryUrl = `${itineraryUrl}/entries/:entryId`;

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
      const { fromDate, toDate } = context.parameters.trip ?? {
        fromDate: "2099-06-10",
        toDate: "2099-06-24"
      };
      server.get(
        "http://localhost:8080/trips/1/itinerary",
        () => itineraryFixture(fromDate, toDate),
        { timing: 0 }
      );
      const configureTripServer: ((server: Server) => void) | undefined =
        context.parameters.configureTripServer;
      configureTripServer?.(server);
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
          <RouterProvider
            router={createMemoryRouter(
              [
                { path: "/", element: <div>Home page</div> },
                { path: "/my-trips", element: <div>My Trips list page</div> },
                { path: "/my-trips/:tripId", element: <Story /> }
              ],
              { initialEntries: [`/my-trips/${initialTripId}`] }
            )}
          />
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
    await within(canvasElement).findByRole("button", {
      name: "Add attractions"
    })
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
    await expect(
      header.queryByRole("button", { name: "Add attractions" })
    ).not.toBeInTheDocument();

    const steps = within(
      header.getByRole("navigation", { name: "Trip steps" })
    );
    await expect(
      steps.getAllByRole("button").map((button) => button.ariaLabel)
    ).toEqual(["Prepare", "Edit", "Itinerary", "Plan", "Review"]);
    await expect(steps.getByText("Choose attractions")).toBeVisible();
    await expect(steps.getByText("Add hours, lengths, notes")).toBeVisible();
    await expect(steps.getByText("Arrange the days")).toBeVisible();
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
    const itinerary = canvas.getByRole("button", { name: "Itinerary" });
    const plan = canvas.getByRole("button", { name: "Plan" });
    const review = canvas.getByRole("button", { name: "Review" });

    await expect(itinerary).toBeDisabled();
    await expect(itinerary).toHaveAccessibleDescription("After Edit");
    await expect(plan).toBeDisabled();
    await expect(plan).toHaveAccessibleDescription("After Edit");
    await expect(review).toBeDisabled();
    await expect(review).toHaveAccessibleDescription("After Edit");
    await user.click(itinerary);
    await user.click(plan);
    await user.click(review);
    await user.keyboard("{Alt>}3{/Alt}{Alt>}4{/Alt}{Alt>}5{/Alt}");
    await expect(prepare).toHaveAttribute("aria-current", "step");

    await user.keyboard("{Control>}v{/Control}");
    await expect(edit).toHaveAttribute("aria-current", "step");
    await expect(itinerary).toBeEnabled();
    await expect(plan).toBeEnabled();
    await expect(plan).toHaveAccessibleDescription("See what's scheduled");
    await expect(review).toBeDisabled();
    await expect(review).toHaveAccessibleDescription("After the trip");
    await user.keyboard("{Alt>}5{/Alt}");
    await expect(edit).toHaveAttribute("aria-current", "step");

    await user.keyboard("{Control>}v{/Control}");
    await expect(itinerary).toHaveAttribute("aria-current", "step");
    await user.keyboard("{Control>}v{/Control}");
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
    await user.keyboard("{Alt>}5{/Alt}");
    await expect(
      canvas.getByRole("button", { name: "Prepare" })
    ).toHaveAttribute("aria-current", "step");
    await user.click(canvas.getByRole("button", { name: "Edit" }));
    await expect(review).toBeEnabled();
    await user.keyboard("{Alt>}5{/Alt}");
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

export const CancelsAnInlineAttractionDraft: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      schedulingPosts.mockClear();
      server.get("http://localhost:8080/trips/1/itinerary", () =>
        itineraryFixture("2099-06-10", "2099-06-11", [
          {
            attractionId: 42,
            name: "Art museum",
            place: "Florence",
            attractionGroup: "PRIMARY",
            mustVisit: true,
            category: "ART_MUSEUM",
            visitDuration: "Ask at the desk"
          }
        ])
      );
      server.post(schedulingUrl, (_schema, request) => {
        schedulingPosts(JSON.parse(request.requestBody));
        return new MirageResponse(500);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await user.click(
      await canvas.findByRole("button", { name: "Add Art museum" })
    );
    await user.click(
      await within(canvasElement.ownerDocument.body).findByRole("menuitem", {
        name: /June? 11, 2099/
      })
    );
    const days = within(
      await canvas.findByRole("region", { name: "Itinerary days" })
    );
    const draft = within(
      await days.findByRole("form", { name: "Add Art museum" })
    );
    await user.type(await draft.findByLabelText("Visit duration"), "1h");
    await expect(draft.getByLabelText("Start clock")).toBeVisible();
    await expect(draft.getByLabelText("Itinerary time zone")).toHaveValue("");
    await expect(
      canvas.getByRole("button", { name: "Check itinerary" })
    ).toHaveAccessibleDescription(
      "Finish or cancel adding the attraction first."
    );
    await user.click(canvas.getByRole("button", { name: "Check details" }));
    const details = within(
      await overlay(canvasElement).findByRole("group", {
        name: "Check details"
      })
    );
    await waitFor(() =>
      expect(
        details.getByText("Finish or cancel adding the attraction first.")
      ).toBeVisible()
    );
    await user.keyboard("{Escape}");
    await user.click(draft.getByRole("button", { name: "Cancel" }));
    await expect(days.queryByRole("form")).not.toBeInTheDocument();
    await expect(
      canvas.getByText("Visit duration: Ask at the desk")
    ).toBeVisible();
    await expect(schedulingPosts).not.toHaveBeenCalled();
    await expect(
      canvas.getByRole("button", { name: "Check itinerary" })
    ).not.toHaveAttribute("aria-disabled", "true");
  }
};

function savedTimeline(start: string, end: string): GetItineraryResponse {
  const saved = itineraryFixture("2099-06-10", "2099-06-24");
  saved.timeZone = "Europe/Rome";
  saved.lastCheckedAt = "2099-06-01T10:00:00Z";
  saved.checkState = "MANUALLY_CHECKED";
  saved.days[0].entries.push({
    entryId: 42,
    attractionId: 5,
    name: "Museum",
    attractionGroup: "PRIMARY",
    category: "ART_MUSEUM",
    fixedStart: false,
    mustVisit: true,
    warnings: [],
    timing: { start, end, zone: "Europe/Rome" }
  });
  return saved;
}

function compositionTimeline(): GetItineraryResponse {
  const saved = savedTimeline(
    "2099-06-10T09:00+02:00",
    "2099-06-10T09:30+02:00"
  );
  saved.days[0].entries.push({
    entryId: 43,
    attractionId: 6,
    name: "Garden",
    attractionGroup: "SECONDARY",
    category: "PARK",
    fixedStart: true,
    mustVisit: false,
    warnings: [],
    timing: {
      start: "2099-06-10T11:00+02:00",
      end: "2099-06-10T11:30+02:00",
      zone: "Europe/Rome"
    }
  });
  saved.unscheduledAttractions.push({
    attractionId: 8,
    name: "Luna Cafe",
    place: "Rome",
    attractionGroup: "SECONDARY",
    category: "EATERY",
    mustVisit: false,
    visitDuration: "30m"
  });
  return saved;
}

const museumCatalogue: GetAttractionResponse = {
  attractionId: 5,
  attractionName: "Museum",
  cityName: "Rome",
  regionName: "Lazio",
  countryName: "Italy",
  attractionAddress: "1 Museum Street",
  attractionLocation: { latitude: 41.9028, longitude: 12.4964 },
  attractionCategory: "ART_MUSEUM",
  attractionType: "STABLE",
  mainAttractionName: "National Gallery",
  isTraditional: true,
  tip: "Try the side entrance",
  infoFrom: "City guide",
  infoRecorded: "2099-06-01",
  optimalVisitPeriod: { fromDate: "2099-04-01", toDate: "2099-10-31" },
  permanentlyClosedAt: "2099-06-09T14:00:00",
  changedOn: "2099-06-09T14:00:00"
};

export const ShowsEditedVisitDurationInTheItinerary: Story = {
  parameters: {
    configureTripServer: (server: Server) => {
      const saved = savedTimeline(
        "2099-06-10T09:00+02:00",
        "2099-06-10T09:30+02:00"
      );
      const [entry] = saved.days[0].entries;
      entry.visitDuration = "30m";
      server.get(
        "http://localhost:8080/trips/1/attractions",
        () => [
          {
            ...SAVED_ATTRACTIONS[0],
            attractionId: 5,
            attractionName: "Museum",
            attractionCategory: "ART_MUSEUM",
            visitTime: entry.visitDuration
          }
        ],
        { timing: 0 }
      );
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.put(
        "http://localhost:8080/trips/1/attractions/5/visit-time",
        (_schema, request) => {
          const { visitTime }: UpdateTripAttractionVisitTimeRequest =
            JSON.parse(request.requestBody);
          entry.visitDuration = visitTime ?? undefined;
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const museum = () =>
      within(canvas.getByRole("listitem", { name: "Museum" }));

    const itinerary = await canvas.findByRole("button", { name: "Itinerary" });
    await waitFor(() => expect(itinerary).toBeEnabled());
    await user.click(itinerary);
    await waitFor(() =>
      expect(museum().getByText("Visit duration: 30m")).toBeVisible()
    );

    await user.click(canvas.getByRole("button", { name: "Edit" }));
    await user.click(await canvas.findByTitle("Edit visit time"));
    const duration = canvas.getByPlaceholderText("Visit time");
    await user.clear(duration);
    await user.type(duration, "2h");
    await user.click(canvas.getByRole("button", { name: "Save" }));
    const feedback = within(
      await canvas.findByRole("status", { name: "Marked change for Museum" })
    );
    await feedback.findByText("Saved");

    await user.click(canvas.getByRole("button", { name: "Itinerary" }));
    await waitFor(() =>
      expect(museum().getByText("Visit duration: 2h")).toBeVisible()
    );
  }
};

export const AttractionFactsOpenFromTheCardBodyAndKeyboard: Story = {
  parameters: {
    savedAttractions: [
      ...SAVED_ATTRACTIONS,
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 8,
        attractionName: "Luna Cafe",
        attractionCategory: "EATERY"
      }
    ],
    configureTripServer: (server: Server) => {
      const saved = compositionTimeline();
      Object.assign(saved.days[0].entries[0], {
        workingHours: "09:00-17:00",
        visitDuration: "45-60m",
        tripNote: "Try the side entrance"
      });
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.get("http://localhost:8080/attractions/5", () => museumCatalogue);
      server.get("http://localhost:8080/attractions/8", () => ({
        ...museumCatalogue,
        attractionId: 8,
        attractionName: "Luna Cafe",
        attractionCategory: "EATERY"
      }));
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialogs = overlay(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));

    const cafe = within(
      await canvas.findByRole("article", { name: "Luna Cafe" })
    );
    const cafeName = cafe.getByRole("button", { name: "Luna Cafe" });
    await user.click(cafe.getByRole("button", { name: "Add Luna Cafe" }));
    await dialogs.findByRole("menu");
    await expect(dialogs.queryByRole("dialog")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(cafe.getByText("Visit duration: 30m"));
    const poolFacts = within(
      await dialogs.findByRole("dialog", { name: "Luna Cafe" })
    );
    await waitFor(() => expect(poolFacts.getByText("Eatery")).toBeVisible());
    await expect(
      poolFacts.queryByText("Planned length")
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(cafeName).toHaveFocus());

    await user.tab();
    await expect(
      cafe.getByRole("button", { name: "Add Luna Cafe" })
    ).toHaveFocus();
    await user.tab({ shift: true });
    await expect(cafeName).toHaveFocus();
    await user.keyboard("{Enter}");
    const cafeFacts = within(
      await dialogs.findByRole("dialog", { name: "Luna Cafe" })
    );
    await user.click(
      cafeFacts.getByRole("button", { name: "Edit trip data on board" })
    );
    await canvas.findByRole("link", { name: "Luna Cafe" });
    await user.click(
      canvas.getByRole("button", { name: "Return to itinerary" })
    );
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Luna Cafe" })).toHaveFocus()
    );

    const clock = canvas.getByRole("textbox", {
      name: "Start clock for Museum"
    });
    await user.click(clock);
    await expect(clock).toHaveFocus();
    await expect(dialogs.queryByRole("dialog")).not.toBeInTheDocument();

    await user.tab();
    await expect(
      canvas.getByRole("textbox", { name: "End clock for Museum" })
    ).toHaveFocus();
    const museum = canvas.getByRole("button", { name: /^Museum$/ });
    await user.tab();
    await expect(museum).toHaveFocus();
    await user.keyboard("{Enter}");
    const entryFacts = within(
      await dialogs.findByRole("dialog", { name: "Museum" })
    );
    const catalogue = within(
      await entryFacts.findByRole("region", { name: "Catalogue facts" })
    );
    const trip = within(entryFacts.getByRole("region", { name: "Trip data" }));
    await waitFor(() =>
      expect(catalogue.getByText("1 Museum Street")).toBeVisible()
    );
    await expect(catalogue.getByText("41.9028, 12.4964")).toBeVisible();
    await expect(catalogue.getByText("Rome, Lazio, Italy")).toBeVisible();
    await expect(catalogue.getByText("National Gallery")).toBeVisible();
    await expect(catalogue.getByText("City guide")).toBeVisible();
    await expect(catalogue.getByText(/Permanently closed since/)).toBeVisible();
    await expect(catalogue.getByText("Catalogue tip")).toBeVisible();
    await expect(catalogue.getByText("Try the side entrance")).toBeVisible();
    await expect(trip.getByText("Trip note")).toBeVisible();
    await expect(trip.getByText("Try the side entrance")).toBeVisible();
    await expect(trip.getByText("09:00-17:00")).toBeVisible();
    await expect(trip.getByText("45-60m")).toBeVisible();
    await expect(trip.getByText("Must see")).toBeVisible();
    await expect(entryFacts.getByText("30 min")).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(museum).toHaveFocus());

    server.get("http://localhost:8080/attractions/5", () => ({
      ...museumCatalogue,
      tip: "Use the courtyard"
    }));
    await user.keyboard(" ");
    const reopened = within(
      await dialogs.findByRole("dialog", { name: "Museum" })
    );
    await waitFor(() =>
      expect(reopened.getByText("Use the courtyard")).toBeVisible()
    );
    await expect(reopened.getByText("Try the side entrance")).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(museum).toHaveFocus());
  }
};

function timelineWithScheduledLunaCafe(
  timeline: GetItineraryResponse,
  { start, end, index }: { start: string; end: string; index: number }
): GetItineraryResponse {
  const saved = structuredClone(timeline);
  const [day] = saved.days;
  const [cafe] = saved.unscheduledAttractions;
  const entry = {
    entryId: 44,
    attractionId: cafe.attractionId,
    name: cafe.name,
    category: cafe.category,
    attractionGroup: cafe.attractionGroup,
    mustVisit: cafe.mustVisit,
    fixedStart: false,
    warnings: [],
    timing: {
      start: `${day.date}T${start}+02:00`,
      end: `${day.date}T${end}+02:00`,
      zone: "Europe/Rome"
    }
  };
  day.entries.splice(index, 0, entry);
  saved.unscheduledAttractions = [];
  saved.checkState = "CHANGED_SINCE_LAST_CHECK";
  saved.changeNotices = [
    {
      entryId: entry.entryId,
      subject: entry.name,
      date: day.date,
      reasons: ["ATTRACTION_ADDED"]
    }
  ];
  return saved;
}

function dropItineraryItem(
  source: HTMLElement,
  destination: HTMLElement
): void {
  const dataTransfer = new DataTransfer();
  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.dragOver(destination, { dataTransfer });
  fireEvent.drop(destination, { dataTransfer });
  fireEvent.dragEnd(source, { dataTransfer });
}

async function dropItineraryItemOnNextDay(
  source: HTMLElement,
  pager: HTMLElement,
  target: () => Promise<HTMLElement>
): Promise<void> {
  const dataTransfer = new DataTransfer();
  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.dragOver(pager, { dataTransfer });
  const destination = await target();
  fireEvent.dragOver(destination, { dataTransfer });
  fireEvent.drop(destination, { dataTransfer });
  fireEvent.dragEnd(source, { dataTransfer });
}

async function expectLunaCafeScheduled(
  canvas: ReturnType<typeof within>,
  startTime: string
): Promise<void> {
  const day = within(canvas.getByRole("article", { name: /Jun 10, 2099/ }));
  const cafe = await day.findByRole("listitem", { name: "Luna Cafe" });
  await expect(cafe).toBeVisible();
  await expect(
    within(cafe).getByRole("textbox", { name: "Start clock for Luna Cafe" })
  ).toHaveValue(startTime);
  const unscheduled = within(
    canvas.getByRole("region", { name: "Unscheduled attractions" })
  );
  await expect(
    unscheduled.queryByRole("article", { name: "Luna Cafe" })
  ).not.toBeInTheDocument();
}

export const PoolDropOpensTheGapClockAndOnlySavesOnBlur: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      let saved = compositionTimeline();
      const scheduled = timelineWithScheduledLunaCafe(saved, {
        start: "09:30",
        end: "10:00",
        index: 1
      });
      server.get(itineraryUrl, () => saved);
      server.post(schedulingUrl, (_schema, request) => {
        compositionWrites(JSON.parse(request.requestBody));
        saved = scheduled;
        return new MirageResponse(204);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const drag = await canvas.findByTitle("Drag Luna Cafe");

    dropItineraryItem(drag, canvas.getByText("Unscheduled attractions"));
    await expect(
      canvas.queryByRole("form", { name: "Add Luna Cafe" })
    ).not.toBeInTheDocument();
    await expect(compositionWrites).not.toHaveBeenCalled();

    const body = within(
      canvas.getByRole("article", { name: "Luna Cafe" })
    ).getByText("Visit duration: 30m");
    dropItineraryItem(body, canvas.getByText("1h 30m free"));
    fireEvent.click(body, { detail: 1 });
    await expect(
      overlay(canvasElement).queryByRole("dialog")
    ).not.toBeInTheDocument();
    const draft = within(
      await canvas.findByRole("form", { name: "Add Luna Cafe" })
    );
    const clock = draft.getByLabelText("Start clock");
    await expect(clock).toHaveFocus();
    await expect(clock).toHaveValue("09:30");
    await expect(compositionWrites).not.toHaveBeenCalled();

    await user.tab();
    await waitFor(() =>
      expect(compositionWrites).toHaveBeenNthCalledWith(1, {
        attractionId: 8,
        date: "2099-06-10",
        startTime: "09:30"
      })
    );

    await expectLunaCafeScheduled(canvas, "09:30");
    await expect(compositionWrites).toHaveBeenCalledTimes(1);
  }
};

export const SavesAndRemovesATransferWithoutDistance: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      const saved = compositionTimeline();
      const [museum, garden] = saved.days[0].entries;
      museum.timing.end = "2099-06-10T09:45+02:00";
      garden.timing.start = "2099-06-10T10:00+02:00";
      garden.timing.end = "2099-06-10T10:30+02:00";
      museum.warnings = ["MISSING_TRANSFER"];
      const url = `${itineraryUrl}/transfers/42/43`;
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.put(url, (_schema, request) => {
        const transfer: UpdateItineraryTransferRequest = JSON.parse(
          request.requestBody
        );
        compositionWrites(transfer);
        museum.outgoingTransfer = {
          fromEntryId: 42,
          toEntryId: 43,
          ...transfer
        };
        museum.warnings = [];
        return new MirageResponse(204);
      });
      server.delete(url, () => {
        museum.outgoingTransfer = undefined;
        museum.warnings = ["MISSING_TRANSFER"];
        return new MirageResponse(204);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await user.click(
      await canvas.findByRole("button", { name: "1 warning remains" })
    );
    const warnings = within(
      await body.findByRole("tabpanel", { name: "Warnings (1)" })
    );
    await waitFor(() =>
      expect(warnings.getByText("Museum to Garden")).toBeVisible()
    );
    await expect(warnings.getByText("Missing transfer")).toBeVisible();
    await user.keyboard("{Escape}");

    await user.click(
      await canvas.findByRole("button", {
        name: "Add transfer from Museum to Garden"
      })
    );
    const dialog = within(
      await body.findByRole("dialog", {
        name: "Transfer from Museum to Garden"
      })
    );
    await expect(
      dialog.queryByLabelText("Distance (km)")
    ).not.toBeInTheDocument();
    await user.selectOptions(
      dialog.getByRole("combobox", { name: "Mode" }),
      "WALKING"
    );
    await user.type(dialog.getByRole("textbox", { name: "Minutes" }), "10");
    await user.type(
      dialog.getByLabelText("Transfer note"),
      "Use the side gate"
    );
    await user.click(dialog.getByRole("button", { name: "Save transfer" }));
    const edit = await canvas.findByRole("button", {
      name: "Edit transfer from Museum to Garden"
    });
    await expect(compositionWrites).toHaveBeenCalledWith({
      mode: "WALKING",
      minutes: 10,
      note: "Use the side gate"
    });
    await expect(edit).toHaveTextContent(/^Walking · 10m$/);
    await expect(canvas.getByText("5m free")).toBeVisible();
    await user.click(edit);
    const reopened = within(
      await body.findByRole("dialog", {
        name: "Transfer from Museum to Garden"
      })
    );
    await expect(
      reopened.getByRole("textbox", { name: "Minutes" })
    ).toHaveValue("10");
    await expect(reopened.getByLabelText("Transfer note")).toHaveValue(
      "Use the side gate"
    );
    await user.click(reopened.getByRole("button", { name: "Remove transfer" }));
    await expect(
      await canvas.findByRole("button", {
        name: "Add transfer from Museum to Garden"
      })
    ).toHaveTextContent("Missing transfer");
    await expect(canvas.getByText("15m free")).toBeVisible();
  }
};

const museumToGarden: ItineraryTransferDto = {
  fromEntryId: 42,
  toEntryId: 43,
  mode: "WALKING",
  minutes: 20
};

export const ListsOnlyTheTransferToRemoveWhenAddingFromThePool: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      const saved = compositionTimeline();
      saved.days[0].entries[0].outgoingTransfer = museumToGarden;
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.post(schedulingUrl, (_schema, request) => {
        compositionWrites(JSON.parse(request.requestBody));
        return new MirageResponse(
          409,
          {},
          {
            errorCode: "RESOURCE_HAS_DEPENDENCIES",
            errorMessage:
              "Review and confirm the transfers this change would remove.",
            transfersToRemove: [
              { transfer: museumToGarden, fromName: "Museum", toName: "Garden" }
            ]
          }
        );
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const drag = await canvas.findByTitle("Drag Luna Cafe");
    const gap = canvas.getByText("1h 10m free");
    dropItineraryItem(drag, gap);
    const first = within(
      await canvas.findByRole("form", { name: "Add Luna Cafe" })
    );
    await user.click(first.getByRole("button", { name: "Add to day" }));
    const cancelled = within(await body.findByRole("alertdialog"));
    await waitFor(() =>
      expect(cancelled.getByText("Museum to Garden")).toBeVisible()
    );
    await user.click(cancelled.getByRole("button", { name: "Cancel" }));
    await expect(compositionWrites).toHaveBeenCalledTimes(1);
    await expect(gap).toBeVisible();

    dropItineraryItem(drag, gap);
    const second = within(
      await canvas.findByRole("form", { name: "Add Luna Cafe" })
    );
    await expect(second.getByLabelText("Start clock")).toHaveValue("09:30");
    await user.click(second.getByRole("button", { name: "Add to day" }));
    const confirmation = within(await body.findByRole("alertdialog"));
    const schedule = {
      attractionId: 8,
      date: "2099-06-10",
      startTime: "09:30"
    };
    await expect(compositionWrites).toHaveBeenLastCalledWith(schedule);

    server.post(schedulingUrl, (_schema, request) => {
      compositionWrites(JSON.parse(request.requestBody));
      const scheduled = timelineWithScheduledLunaCafe(compositionTimeline(), {
        start: "09:30",
        end: "10:00",
        index: 1
      });
      server.get(itineraryUrl, () => scheduled, { timing: 0 });
      return new MirageResponse(204);
    });
    await user.click(
      confirmation.getByRole("button", { name: "Confirm and add to day" })
    );
    await expectLunaCafeScheduled(canvas, "09:30");
    await expect(compositionWrites).toHaveBeenLastCalledWith({
      ...schedule,
      transfersToRemove: [museumToGarden]
    });
  }
};

export const PoolDropCollectsMissingDurationAndKeepsTheEditedClock: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      let saved = compositionTimeline();
      saved.unscheduledAttractions[0].visitDuration = undefined;
      const scheduled = timelineWithScheduledLunaCafe(saved, {
        start: "08:00",
        end: "08:30",
        index: 0
      });
      server.get(itineraryUrl, () => saved);
      server.post(schedulingUrl, (_schema, request) => {
        compositionWrites(JSON.parse(request.requestBody));
        saved = scheduled;
        return new MirageResponse(204);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const drag = await canvas.findByTitle("Drag Luna Cafe");
    const gap = canvas.getByText("1h 30m free");
    dropItineraryItem(drag, gap);
    const firstDraft = within(
      await canvas.findByRole("form", { name: "Add Luna Cafe" })
    );
    await expect(firstDraft.getByLabelText("Start clock")).toHaveFocus();
    await expect(firstDraft.getByLabelText("Visit duration")).toHaveValue("");
    await user.click(firstDraft.getByRole("button", { name: "Cancel" }));
    await expect(
      canvas.queryByRole("form", { name: "Add Luna Cafe" })
    ).not.toBeInTheDocument();
    await expect(compositionWrites).not.toHaveBeenCalled();

    dropItineraryItem(drag, gap);
    const draft = within(
      await canvas.findByRole("form", { name: "Add Luna Cafe" })
    );
    await user.type(draft.getByLabelText("Visit duration"), "30m");
    const clock = draft.getByLabelText("Start clock");
    await user.click(clock);
    fireEvent.change(clock, { target: { value: "08:00" } });
    await user.click(draft.getByRole("button", { name: "Add to day" }));
    await waitFor(() =>
      expect(compositionWrites).toHaveBeenNthCalledWith(1, {
        attractionId: 8,
        date: "2099-06-10",
        startTime: "08:00",
        visitDuration: "30m"
      })
    );
    await expectLunaCafeScheduled(canvas, "08:00");
    await expect(compositionWrites).toHaveBeenCalledTimes(1);
  }
};

export const PoolDropKeepsAnOverlapDraftAndBlursTheCorrectedClock: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      let saved = compositionTimeline();
      const scheduled = timelineWithScheduledLunaCafe(saved, {
        start: "08:00",
        end: "08:30",
        index: 0
      });
      const rejected = new MirageResponse(
        400,
        {},
        {
          errorCode: "BAD_REQUEST",
          errorMessage: "The chosen time overlaps another itinerary entry."
        }
      );
      const responses = new Map([
        ["09:15", () => rejected],
        [
          "08:00",
          () => {
            saved = scheduled;
            return new MirageResponse(204);
          }
        ]
      ]);
      server.get(itineraryUrl, () => saved);
      server.post(schedulingUrl, (_schema, request) => {
        const body: { startTime: string } = JSON.parse(request.requestBody);
        compositionWrites(body.startTime);
        return responses.get(body.startTime)?.() ?? new MirageResponse(500);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    dropItineraryItem(
      await canvas.findByTitle("Drag Luna Cafe"),
      canvas.getByText("1h 30m free")
    );
    const draft = within(
      await canvas.findByRole("form", { name: "Add Luna Cafe" })
    );
    const clock = draft.getByLabelText("Start clock");
    await expect(clock).toHaveFocus();
    fireEvent.change(clock, { target: { value: "09:15" } });
    await user.tab();
    await expect(
      await draft.findByText(
        "The chosen time overlaps another itinerary entry."
      )
    ).toBeVisible();
    await expect(clock).toHaveValue("09:15");
    await expect(
      canvas.getByRole("textbox", { name: "Start clock for Museum" })
    ).toHaveValue("09:00");
    await user.click(clock);
    fireEvent.change(clock, { target: { value: "08:00" } });
    await user.tab();
    await waitFor(() =>
      expect(compositionWrites).toHaveBeenNthCalledWith(2, "08:00")
    );
    await expect(compositionWrites).toHaveBeenNthCalledWith(1, "09:15");
    await expectLunaCafeScheduled(canvas, "08:00");
  }
};

export const ReordersByKeyboardAndDragsToAnotherDayWithFocus: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      const saved = compositionTimeline();
      const [museum, garden] = saved.days[0].entries;
      const reordered = {
        ...museum,
        timing: {
          ...museum.timing,
          start: "2099-06-10T11:30+02:00",
          end: "2099-06-10T12:00+02:00"
        }
      };
      const updates = {
        "2099-06-10": [[garden, reordered], []],
        "2099-06-11": [
          [garden],
          [
            {
              ...museum,
              timing: {
                ...museum.timing,
                start: "2099-06-11T11:30+02:00",
                end: "2099-06-11T12:00+02:00"
              }
            }
          ]
        ]
      };
      server.get(itineraryUrl, () => saved);
      server.put(`${entryUrl}/position`, (_schema, request) => {
        const body: { date: keyof typeof updates; beforeEntryId?: number } =
          JSON.parse(request.requestBody);
        compositionWrites(request.params.entryId, body);
        [saved.days[0].entries, saved.days[1].entries] = updates[body.date];
        return new MirageResponse(204);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const menu = await canvas.findByRole("button", {
      name: "Actions for Museum"
    });
    menu.focus();
    await user.keyboard("{Enter}");
    const choices = overlay(canvasElement);
    const moveDown = await choices.findByRole("menuitem", {
      name: "Move down"
    });
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(moveDown).toHaveFocus());
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(compositionWrites).toHaveBeenNthCalledWith(1, "42", {
        date: "2099-06-10"
      })
    );
    const museum = await canvas.findByRole("listitem", { name: "Museum" });
    await waitFor(() => expect(museum).toHaveFocus());
    const day = canvas.getByRole("article", { name: /Jun 10, 2099/ });
    await expect(
      within(day).getAllByRole("listitem", { name: /Garden|Museum/ })
    ).toEqual([within(day).getByRole("listitem", { name: "Garden" }), museum]);

    await dropItineraryItemOnNextDay(
      canvas.getByTitle("Drag Museum"),
      canvas.getByRole("button", { name: "Next day" }),
      () =>
        canvas.findByRole(
          "article",
          { name: /Jun 11, 2099/ },
          { timeout: 4000 }
        )
    );
    await waitFor(() =>
      expect(compositionWrites).toHaveBeenNthCalledWith(2, "42", {
        date: "2099-06-11"
      })
    );
    const moved = await canvas.findByRole("listitem", { name: "Museum" });
    await waitFor(() => expect(moved).toHaveFocus());
    await expect(
      await canvas.findByText(/Museum moved to .*Jun 11, 2099/)
    ).toHaveAttribute("role", "status");
  }
};

export const MenuAndDragReportTheSameMoveConflict: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "470px", maxWidth: "100%" }}>
        <Story />
      </div>
    )
  ],
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      const saved = compositionTimeline();
      const [, garden] = saved.days[0].entries;
      saved.days[0].entries = saved.days[0].entries.slice(0, 1);
      saved.days[1].entries = [
        {
          ...garden,
          timing: {
            zone: "Europe/Rome",
            start: "2099-06-11T11:00+02:00",
            end: "2099-06-11T11:30+02:00"
          }
        }
      ];
      server.get(itineraryUrl, () => saved);
      server.put(`${entryUrl}/position`, (_schema, request) => {
        compositionWrites(
          request.params.entryId,
          JSON.parse(request.requestBody)
        );
        return new MirageResponse(
          400,
          {},
          {
            errorCode: "BAD_REQUEST",
            errorMessage:
              "The move conflicts with the fixed start of Garden. Choose another position or day."
          }
        );
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await user.click(
      await canvas.findByRole("button", { name: "Actions for Museum" })
    );
    const body = overlay(canvasElement);
    await user.click(
      await body.findByRole("menuitem", { name: "Move to day..." })
    );
    const dialog = within(
      await body.findByRole("dialog", { name: "Move Museum to day" })
    );
    await user.selectOptions(dialog.getByLabelText("Position"), "43");
    const unsavedMove = new Event("beforeunload", { cancelable: true });
    canvasElement.ownerDocument.defaultView?.dispatchEvent(unsavedMove);
    await expect(unsavedMove.defaultPrevented).toBe(true);
    await expect(compositionWrites).not.toHaveBeenCalled();
    await user.click(dialog.getByRole("button", { name: "Move entry" }));
    const conflict =
      "The move conflicts with the fixed start of Garden. Choose another position or day.";
    await expect(await canvas.findByText(conflict)).toBeVisible();
    const request = { date: "2099-06-11", beforeEntryId: 43 };
    await expect(compositionWrites).toHaveBeenNthCalledWith(1, "42", request);

    await user.click(canvas.getByRole("button", { name: "Dismiss" }));
    await dropItineraryItemOnNextDay(
      canvas.getByTitle("Drag Museum"),
      canvas.getByRole("button", { name: "Next day" }),
      () => canvas.findByRole("listitem", { name: "Garden" }, { timeout: 4000 })
    );
    await expect(await canvas.findByText(conflict)).toBeVisible();
    await expect(compositionWrites).toHaveBeenNthCalledWith(2, "42", request);
    const source = within(
      canvas.getByRole("article", { name: /Jun 10, 2099/ })
    );
    const museum = source.getByRole("listitem", { name: "Museum" });
    await expect(museum).toBeVisible();
    await waitFor(() => expect(museum).toHaveFocus());
  }
};

export const CancelsRemovalThenFindsTheSavedRemovalAfterALostResponse: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      const saved = savedTimeline(
        "2099-06-10T09:00+02:00",
        "2099-06-10T09:30+02:00"
      );
      server.get(itineraryUrl, () => saved);
      server.delete(entryUrl, (_schema, request) => {
        compositionWrites(request.params.entryId);
        saved.days[0].entries = [];
        saved.unscheduledAttractions = [
          {
            attractionId: 5,
            attractionGroup: "PRIMARY",
            category: "ART_MUSEUM",
            mustVisit: true,
            name: "Museum",
            place: "Rome"
          }
        ];
        saved.checkState = "CHANGED_SINCE_LAST_CHECK";
        saved.changeNotices = [
          { subject: "Museum", date: "2099-06-10", reasons: ["ENTRY_REMOVED"] }
        ];
        return new MirageResponse(500);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const parent = overlay(canvasElement);
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const menu = await canvas.findByRole("button", {
      name: "Actions for Museum"
    });
    const openRemoval = async (): Promise<HTMLElement> => {
      await user.click(menu);
      await user.click(
        await parent.findByRole("menuitem", { name: "Remove from itinerary" })
      );
      return parent.findByRole("dialog", { name: "Remove Museum?" });
    };
    const cancelled = await openRemoval();
    await user.click(within(cancelled).getByRole("button", { name: "Cancel" }));
    await expect(compositionWrites).not.toHaveBeenCalled();
    const confirmed = await openRemoval();
    await user.click(
      within(confirmed).getByRole("button", { name: "Remove entry" })
    );

    await user.click(
      await canvas.findByRole("button", { name: "Inspect saved itinerary" })
    );
    await expect(
      await canvas.findByText("Museum removed from the itinerary.")
    ).toHaveAttribute("role", "status");
    await expect(
      await canvas.findByRole("button", { name: "Add Museum" })
    ).toBeVisible();
    await expect(compositionWrites).toHaveBeenNthCalledWith(1, "42");
    await expect(compositionWrites).toHaveBeenCalledTimes(1);
    await expect(
      canvas.queryByRole("listitem", { name: "Museum" })
    ).not.toBeInTheDocument();
    await user.click(
      await canvas.findByRole("button", { name: "1 change to check" })
    );
    const changes = within(
      await parent.findByRole("dialog", { name: "Itinerary check details" })
    );
    await waitFor(() => expect(changes.getByText("Museum")).toBeVisible());
    await expect(changes.getByText("Removed from the itinerary")).toBeVisible();
    await expect(
      changes.getByRole("button", { name: "Go to day" })
    ).toBeVisible();
    await expect(
      changes.queryByRole("button", { name: "Go to entry" })
    ).not.toBeInTheDocument();
  }
};

export const ChoosesBetweenRepeatedStartsBeforeMoving: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      compositionWrites.mockClear();
      const saved = savedTimeline(
        "2099-06-10T02:00+02:00",
        "2099-06-10T02:30+02:00"
      );
      server.get(itineraryUrl, () => saved);
      const chosenOccurrences = new Map([
        [
          "+01:00",
          () => {
            const [museum] = saved.days[0].entries.splice(0);
            saved.days[1].entries = [
              {
                ...museum,
                timing: {
                  zone: "Europe/Rome",
                  start: "2099-06-11T02:00+01:00",
                  end: "2099-06-11T02:30+01:00",
                  repeatedStart: true,
                  repeatedEnd: true
                }
              }
            ];
            return new MirageResponse(204);
          }
        ]
      ]);
      const requireChoice = (): MirageResponse =>
        new MirageResponse(
          400,
          {},
          {
            errorCode: "BAD_REQUEST",
            errorMessage:
              "This start clock occurs twice. Choose which occurrence to use.",
            moveStartChoices: { offsets: ["+02:00", "+01:00"] }
          }
        );
      server.put(`${entryUrl}/position`, (_schema, request) => {
        const body: { date: string; startOffset?: string } = JSON.parse(
          request.requestBody
        );
        compositionWrites(body);
        return (
          chosenOccurrences.get(body.startOffset ?? "") ?? requireChoice
        )();
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await user.click(
      await canvas.findByRole("button", { name: "Actions for Museum" })
    );
    await user.click(
      await body.findByRole("menuitem", { name: "Move to day..." })
    );
    const move = within(
      await body.findByRole("dialog", { name: "Move Museum to day" })
    );
    await user.click(move.getByRole("button", { name: "Move entry" }));

    const choice = within(
      await body.findByRole("dialog", { name: "Choose a start for Museum" })
    );
    await expect(compositionWrites).toHaveBeenNthCalledWith(1, {
      date: "2099-06-11"
    });
    await expect(compositionWrites).toHaveBeenCalledTimes(1);
    await expect(
      choice.getByRole("button", { name: "02:00 UTC+02:00" })
    ).toBeEnabled();
    await user.click(choice.getByRole("button", { name: "02:00 UTC+01:00" }));
    const destination = within(
      await canvas.findByRole("article", { name: /Jun 11, 2099/ })
    );
    const museum = within(
      await destination.findByRole("listitem", { name: "Museum" })
    );
    await expect(museum.getAllByText("UTC+01:00")[0]).toBeVisible();
    await expect(compositionWrites).toHaveBeenNthCalledWith(2, {
      date: "2099-06-11",
      startOffset: "+01:00"
    });
  }
};

export const LocksAndUnlocksTheStartFromTheKeyboard: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      timingPuts.mockClear();
      const saved = savedTimeline(
        "2099-06-10T09:00+02:00",
        "2099-06-10T09:30+02:00"
      );
      const day = saved.days[0];
      const [museum] = day.entries;
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.put(
        `${entryUrl}/fixed-start`,
        (_schema, request) => {
          const body: { fixedStart: boolean } = JSON.parse(request.requestBody);
          timingPuts(request.params.entryId, body);
          museum.fixedStart = body.fixedStart;
          saved.checkState = "CHANGED_SINCE_LAST_CHECK";
          saved.changeNotices = [
            {
              entryId: museum.entryId,
              subject: museum.name,
              date: day.date,
              reasons: ["FIXED_START_CHANGED"]
            }
          ];
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const museum = within(
      await canvas.findByRole("listitem", { name: "Museum" })
    );
    const start = museum.getByRole("textbox", {
      name: "Start clock for Museum"
    });
    const end = museum.getByRole("textbox", { name: "End clock for Museum" });
    const lock = museum.getByRole("button", { name: "Lock start for Museum" });
    await expect(lock).toHaveAttribute("aria-pressed", "false");
    await expect(museum.queryByText("Fixed start")).not.toBeInTheDocument();

    await user.click(end);
    await user.tab();
    await expect(museum.getByRole("button", { name: "Museum" })).toHaveFocus();
    await user.tab();
    await expect(lock).toHaveFocus();
    await user.keyboard(" ");

    await expect(await museum.findByText("Fixed start")).toBeVisible();
    await expect(lock).toHaveAttribute("aria-pressed", "true");
    await expect(start).toHaveValue("09:00");
    await expect(end).toHaveValue("09:30");

    await waitFor(() =>
      expect(lock).not.toHaveAttribute("aria-disabled", "true")
    );
    await expect(lock).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(lock).toHaveAttribute("aria-pressed", "false"));
    await expect(museum.queryByText("Fixed start")).not.toBeInTheDocument();
    await expect(start).toHaveValue("09:00");
    await expect(end).toHaveValue("09:30");
    await expect(timingPuts).toHaveBeenCalledTimes(2);
    await expect(timingPuts).toHaveBeenNthCalledWith(1, "42", {
      fixedStart: true
    });
    await expect(timingPuts).toHaveBeenNthCalledWith(2, "42", {
      fixedStart: false
    });

    await user.click(canvas.getByRole("button", { name: "1 change to check" }));
    const changes = within(
      await overlay(canvasElement).findByRole("dialog", {
        name: "Itinerary check details"
      })
    );
    await waitFor(() =>
      expect(changes.getByText("Start lock changed")).toBeVisible()
    );
  }
};

export const EditsSavedTimingAndShowsUpdatedFreeTime: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      timingPuts.mockClear();
      const saved = savedTimeline(
        "2099-06-10T09:00+02:00",
        "2099-06-10T09:30+02:00"
      );
      const [museum] = saved.days[0].entries;
      const garden: typeof museum = {
        ...museum,
        entryId: 43,
        attractionId: 6,
        name: "Garden",
        category: "PARK",
        timing: {
          zone: "Europe/Rome",
          start: "2099-06-10T10:00+02:00",
          end: "2099-06-10T10:30+02:00"
        }
      };
      saved.days[0].entries.push(garden);
      const museumNotice = {
        entryId: museum.entryId,
        subject: museum.name,
        date: saved.days[0].date
      };
      const changes = {
        start: () => {
          museum.timing.start = "2099-06-10T09:10+02:00";
          museum.timing.end = "2099-06-10T09:40+02:00";
          saved.changeNotices = [
            { ...museumNotice, reasons: ["START_CHANGED"] }
          ];
        },
        end: () => {
          museum.timing.end = "2099-06-10T10:15+02:00";
          garden.timing.start = "2099-06-10T10:15+02:00";
          garden.timing.end = "2099-06-10T10:45+02:00";
          saved.changeNotices = [
            {
              ...museumNotice,
              reasons: ["START_CHANGED", "PLANNED_LENGTH_CHANGED"]
            },
            {
              entryId: garden.entryId,
              subject: garden.name,
              date: saved.days[0].date,
              reasons: ["START_CHANGED"]
            }
          ];
        },
        "planned-length": () => {
          museum.timing.end = "2099-06-10T09:40+02:00";
        }
      };
      server.get(itineraryUrl, () => saved, { timing: 0 });
      for (const [field, apply] of Object.entries(changes)) {
        server.put(
          `${entryUrl}/${field}`,
          (_schema, request) => {
            timingPuts(
              field,
              request.params.entryId,
              JSON.parse(request.requestBody)
            );
            apply();
            saved.checkState = "CHANGED_SINCE_LAST_CHECK";
            return new MirageResponse(204);
          },
          { timing: 0 }
        );
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await expect(await canvas.findByText("30m free")).toBeVisible();
    const museum = within(canvas.getByRole("listitem", { name: "Museum" }));
    const start = museum.getByRole("textbox", {
      name: "Start clock for Museum"
    });
    const end = museum.getByRole("textbox", { name: "End clock for Museum" });
    const length = museum.getByRole("textbox", {
      name: "Planned length for Museum"
    });
    await expect(museum.queryByText("10 Jun")).not.toBeInTheDocument();

    await user.clear(start);
    await user.type(start, "09:10{Enter}");
    await expect(await canvas.findByText("20m free")).toBeVisible();
    await expect(start).toHaveValue("09:10");
    await expect(length).toHaveValue("30");

    await user.clear(end);
    await user.type(end, "10:15");
    await user.tab();
    const gardenStart = canvas.getByRole("textbox", {
      name: "Start clock for Garden"
    });
    await waitFor(() => expect(gardenStart).toHaveValue("10:15"));
    await expect(length).toHaveValue("65");
    await expect(canvas.queryByText(/m free$/)).not.toBeInTheDocument();

    await user.clear(length);
    await user.type(length, "30{Enter}");
    await expect(await canvas.findByText("35m free")).toBeVisible();
    await expect(gardenStart).toHaveValue("10:15");
    await expect(timingPuts).toHaveBeenCalledTimes(3);
    await expect(timingPuts).toHaveBeenNthCalledWith(1, "start", "42", {
      startTime: "09:10"
    });
    await expect(timingPuts).toHaveBeenNthCalledWith(2, "end", "42", {
      endDate: "2099-06-10",
      endTime: "10:15"
    });
    await expect(timingPuts).toHaveBeenNthCalledWith(
      3,
      "planned-length",
      "42",
      {
        plannedMinutes: 30
      }
    );

    await expect(canvas.getByText("Changed since last check")).toBeVisible();
    await user.click(
      canvas.getByRole("button", { name: "2 changes to check" })
    );
    const notice = within(
      await overlay(canvasElement).findByRole("dialog", {
        name: "Itinerary check details"
      })
    );
    await waitFor(async () => {
      await expect(notice.getAllByText("Start clock changed")).toHaveLength(2);
      await expect(notice.getByText("Planned length changed")).toBeVisible();
    });
  }
};

export const RejectsASavedClockThenAcceptsAnExplicitOvernightEnd: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      timingPuts.mockClear();
      const saved = savedTimeline(
        "2099-06-10T23:00+02:00",
        "2099-06-10T23:30+02:00"
      );
      server.put(`${entryUrl}/fixed-start`, () => {
        saved.days[0].entries[0].fixedStart = true;
        return new MirageResponse(204);
      });
      const replies = [
        () =>
          new MirageResponse(
            400,
            { "Content-Type": "application/json" },
            {
              errorCode: "BAD_REQUEST",
              errorMessage: "Include the end date if it differs."
            }
          ),
        () => {
          saved.days[0].entries[0].timing.end = "2099-06-11T01:00+02:00";
          saved.checkState = "CHANGED_SINCE_LAST_CHECK";
          saved.changeNotices = [
            {
              entryId: 42,
              subject: "Museum",
              date: saved.days[0].date,
              reasons: ["PLANNED_LENGTH_CHANGED"]
            }
          ];
          return new MirageResponse(204);
        }
      ];
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.put(
        `${entryUrl}/end`,
        (_schema, request) => {
          timingPuts(
            "end",
            request.params.entryId,
            JSON.parse(request.requestBody)
          );
          return replies.shift()?.() ?? new MirageResponse(500);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const museum = within(
      await canvas.findByRole("listitem", { name: "Museum" })
    );
    const end = museum.getByRole("textbox", { name: "End clock for Museum" });
    await user.clear(end);
    await user.type(end, "01:00");
    await user.click(
      museum.getByRole("textbox", { name: "Start clock for Museum" })
    );
    await expect(await museum.findByRole("alert")).toHaveTextContent(
      "Include the end date if it differs."
    );
    await expect(end).toHaveValue("23:30");
    await expect(end).toHaveAccessibleDescription(
      /Include the end date if it differs/
    );

    await user.click(end);
    await expect(museum.getByRole("alert")).toBeVisible();
    await expect(end).toHaveValue("01:00");
    await user.click(canvas.getByRole("button", { name: "Check itinerary" }));
    const dialog = await overlay(canvasElement).findByRole("dialog", {
      name: "Check itinerary"
    });
    await waitFor(() => expect(dialog).toBeVisible());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(museum.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(
      museum.getByRole("button", { name: "Lock start for Museum" })
    );
    await museum.findByText("Fixed start");
    await user.click(end);
    await expect(end).toHaveValue("01:00");
    await expect(timingPuts).toHaveBeenCalledTimes(1);

    await user.clear(end);
    await user.type(end, "2099-06-11 01:00{Enter}");
    await expect(await museum.findByText("11 Jun")).toBeVisible();
    await expect(end).toHaveValue("01:00");
    await expect(
      museum.getByRole("textbox", { name: "Planned length for Museum" })
    ).toHaveValue("120");
    await expect(timingPuts).toHaveBeenNthCalledWith(1, "end", "42", {
      endDate: "2099-06-10",
      endTime: "01:00"
    });
    await expect(timingPuts).toHaveBeenNthCalledWith(2, "end", "42", {
      endDate: "2099-06-11",
      endTime: "01:00"
    });
  }
};

export const ChecksAnEmptyItineraryExplicitly: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      checkPosts.mockClear();
      const saved = itineraryFixture("2099-06-10", "2099-06-11");
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.post(
        `${itineraryUrl}/check`,
        () => {
          checkPosts();
          saved.checkState = "MANUALLY_CHECKED";
          saved.lastCheckedAt = "2026-11-23T16:00:00Z";
          return new MirageResponse(204);
        },
        { timing: 500 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const body = overlay(canvasElement);
    await canvas.findByText("Not yet checked");
    await user.click(canvas.getByRole("button", { name: "Itinerary" }));
    const trigger = canvas.getByRole("button", { name: "Check itinerary" });
    const plan = canvas.getByRole("button", { name: /^Plan$/ });
    await waitFor(() =>
      expect(trigger).not.toHaveAttribute("aria-disabled", "true")
    );
    await user.click(trigger);
    const confirmation = within(
      await body.findByRole("dialog", { name: "Check itinerary" })
    );
    await waitFor(async () => {
      await expect(
        confirmation.getByText(/No attractions or other items are scheduled/)
      ).toBeVisible();
      await expect(
        confirmation.getByText(
          /does not guarantee that the itinerary is feasible/
        )
      ).toBeVisible();
    });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(checkPosts).not.toHaveBeenCalled();

    await user.click(trigger);
    await user.click(
      await body.findByRole("button", { name: "Mark empty itinerary checked" })
    );
    await expect(await canvas.findByText("Saving check...")).toBeVisible();
    await user.click(plan);
    await expect(
      canvas.getByRole("button", { name: "Itinerary" })
    ).toHaveAttribute("aria-current", "step");
    await expect(await canvas.findByText("Manually checked")).toBeVisible();
    await expect(checkPosts).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(plan).toHaveAttribute("aria-current", "step"));
    await expect(canvas.getByText("Manually checked")).toBeVisible();
  }
};

export const ChecksANoteOnlyItineraryWithoutReviewingDayNotes: Story = {
  parameters: {
    savedAttractions: [],
    trip: {
      ...ITINERARY_TRIP,
      fromDate: "2099-06-10",
      toDate: "2099-06-11",
      hasItineraryEntries: false,
      hasItineraryDayNotes: true
    },
    configureTripServer: (server: Server) => {
      checkPosts.mockClear();
      itineraryNoteWrites.mockClear();
      const saved = itineraryFixture("2099-06-10", "2099-06-11");
      const [day] = saved.days;
      day.note = "Bring the tickets.";
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.post(
        `${itineraryUrl}/check`,
        () => {
          checkPosts();
          saved.checkState = "MANUALLY_CHECKED";
          saved.lastCheckedAt = "2099-05-31T10:00:00Z";
          saved.checkContext = "after-check";
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
      server.put(
        `${itineraryUrl}/days/2099-06-10/note`,
        (_schema, request) => {
          const body: UpdateItineraryDayNoteRequest = JSON.parse(
            request.requestBody
          );
          itineraryNoteWrites(body);
          day.note = body.note || undefined;
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    const day = within(
      await canvas.findByRole("article", { name: /Jun 10, 2099/ })
    );
    await expect(
      canvas.getByRole("button", { name: "Itinerary" })
    ).toHaveAttribute("aria-current", "step");
    await expect(day.getByRole("note", { name: "Day note" })).toHaveTextContent(
      "Bring the tickets."
    );
    await expect(
      day.queryByRole("list", { name: "Main path" })
    ).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "Check itinerary" }));
    const check = within(
      await body.findByRole("dialog", { name: "Check itinerary" })
    );
    await waitFor(() =>
      expect(
        check.getByText(/No attractions or other items are scheduled/)
      ).toBeVisible()
    );
    await expect(
      check.queryByText("Bring the tickets.")
    ).not.toBeInTheDocument();
    await user.click(
      check.getByRole("button", { name: "Mark empty itinerary checked" })
    );
    await canvas.findByText("Manually checked");
    await expect(checkPosts).toHaveBeenCalledTimes(1);

    await user.click(await day.findByRole("button", { name: "Edit day note" }));
    const editor = within(
      await body.findByRole("dialog", { name: "Edit day note" })
    );
    const field = editor.getByRole("textbox", { name: "Day note" });
    await expect(field).toHaveValue("Bring the tickets.");
    const overlong = "x".repeat(2001);
    fireEvent.change(field, { target: { value: overlong } });
    await expect(field).toHaveValue(overlong);
    await waitFor(() =>
      expect(
        editor.getByText("Day note may not be longer than 2000 characters.")
      ).toBeVisible()
    );
    await user.keyboard("{Control>}s{/Control}");
    await expect(itineraryNoteWrites).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: "Bring the tickets." } });
    await user.type(field, "{Enter}Bring an ID too.  ");
    await expect(field).toHaveValue("Bring the tickets.\nBring an ID too.  ");
    await user.keyboard("{Control>}s{/Control}");
    await expect(
      await day.findByRole("status", { name: /^Marked change for Day note/ })
    ).toHaveTextContent("Saved");
    await expect(canvas.getByText("Manually checked")).toBeVisible();

    await user.click(await day.findByRole("button", { name: "Edit day note" }));
    const reopened = within(
      await body.findByRole("dialog", { name: "Edit day note" })
    );
    const savedText = reopened.getByRole("textbox", { name: "Day note" });
    await expect(savedText).toHaveValue(
      "Bring the tickets.\nBring an ID too.  "
    );
    await user.clear(savedText);
    await user.click(reopened.getByRole("button", { name: "Save" }));
    await day.findByRole("button", { name: "Add day note" });
    await expect(
      day.queryByRole("note", { name: "Day note" })
    ).not.toBeInTheDocument();
    await expect(itineraryNoteWrites.mock.calls).toEqual([
      [{ note: "Bring the tickets.\nBring an ID too.  " }],
      [{ note: "" }]
    ]);
    await expect(canvas.getByText("Manually checked")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: /changes? to check/ })
    ).not.toBeInTheDocument();
  }
};

export const InspectsADayNoteSaveWithoutChangingTheTripNote: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      itineraryNoteWrites.mockClear();
      const saved = compositionTimeline();
      const [day] = saved.days;
      const [museum] = day.entries;
      museum.tripNote = "Use the side entrance.";
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.put(
        `${itineraryUrl}/days/${day.date}/note`,
        (_schema, request) => {
          const body: UpdateItineraryDayNoteRequest = JSON.parse(
            request.requestBody
          );
          itineraryNoteWrites(body);
          day.note = body.note;
          return new MirageResponse(503);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const day = within(
      await canvas.findByRole("article", { name: /Jun 10, 2099/ })
    );
    const museum = within(day.getByRole("listitem", { name: "Museum" }));
    await expect(
      museum.getByRole("note", { name: "Trip note" })
    ).toHaveTextContent("Use the side entrance.");
    await expect(
      museum.queryByRole("button", { name: /note/i })
    ).not.toBeInTheDocument();

    const add = day.getByRole("button", { name: "Add day note" });
    await user.click(add);
    const editor = within(
      await body.findByRole("dialog", { name: "Edit day note" })
    );
    const field = editor.getByRole("textbox", { name: "Day note" });
    await expect(field).toHaveFocus();
    await expect(field).toHaveValue("");

    const note = " Ask at the desk.\nCollect the passes. ";
    fireEvent.change(field, { target: { value: note } });
    await user.click(editor.getByRole("button", { name: "Save" }));
    await expect(
      await editor.findByText(/The save couldn't be confirmed/)
    ).toBeVisible();
    await expect(field).toHaveValue(note);
    await user.click(
      editor.getByRole("button", { name: "Inspect saved itinerary" })
    );
    await expect(
      await day.findByRole("status", {
        name: /^Marked change for Day note/
      })
    ).toHaveTextContent("Saved");
    await expect(
      museum.getByRole("note", { name: "Trip note" })
    ).toHaveTextContent("Use the side entrance.");
    const edit = day.getByRole("button", { name: "Edit day note" });
    await waitFor(() => expect(edit).toHaveFocus());
    await expect(itineraryNoteWrites.mock.calls).toEqual([[{ note }]]);

    await user.click(edit);
    const reopened = within(
      await body.findByRole("dialog", { name: "Edit day note" })
    );
    await expect(
      reopened.getByRole("textbox", { name: "Day note" })
    ).toHaveValue(note);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(edit).toHaveFocus());
  }
};

export const ATripWithOnlyDayNotesOpensInReviewAfterTheTrip: Story = {
  parameters: {
    savedAttractions: [],
    trip: {
      ...ITINERARY_TRIP,
      hasItineraryEntries: false,
      hasItineraryDayNotes: true
    },
    configureTripServer: (server: Server) => {
      const saved = itineraryFixture(
        ITINERARY_TRIP.fromDate,
        ITINERARY_TRIP.toDate
      );
      saved.days[0].note = "Return the keys.";
      server.get(itineraryUrl, () => saved, { timing: 0 });
    }
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", { name: "Review" })
    ).toHaveAttribute("aria-current", "step");
  }
};

export const ShowsGroupedChangesAndFocusesTheExistingEntry: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "390px", maxWidth: "100%" }}>
        <Story />
      </div>
    )
  ],
  parameters: {
    trip: ITINERARY_TRIP,
    configureTripServer: (server: Server) => {
      checkPosts.mockClear();
      const saved = itineraryFixture("2025-06-10", "2025-06-24");
      saved.lastCheckedAt = "2025-06-01T10:00:00Z";
      saved.checkState = "CHANGED_SINCE_LAST_CHECK";
      saved.days[10].entries.push({
        entryId: 42,
        attractionId: 5,
        name: "Garden",
        attractionGroup: "PRIMARY",
        category: "PARK",
        fixedStart: false,
        mustVisit: true,
        warnings: [],
        timing: {
          start: "2025-06-20T09:00+02:00",
          end: "2025-06-20T09:45+02:00",
          zone: "Europe/Rome"
        }
      });
      saved.changeNotices = [
        {
          entryId: 42,
          subject: "Garden",
          date: "2025-06-20",
          reasons: ["ATTRACTION_ADDED"]
        },
        {
          entryId: 24,
          subject: "Former entry",
          date: "2025-06-21",
          reasons: ["ATTRACTION_ADDED"]
        }
      ];
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.post(
        `${itineraryUrl}/check`,
        () => {
          checkPosts();
          saved.lastCheckedAt = "2025-06-22T10:00:00Z";
          saved.checkState = "MANUALLY_CHECKED";
          saved.changeNotices = [];
          return new MirageResponse(503);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const body = overlay(canvasElement);
    const header = await canvas.findByRole("region", { name: "Trip overview" });
    await expect(
      await within(header).findByText("Changed since last check")
    ).toBeVisible();
    await expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
    const changes = within(header).getByRole("button", {
      name: "2 changes to check"
    });
    changes.focus();
    await user.keyboard("{Enter}");
    const dialog = within(
      await body.findByRole("dialog", { name: "Itinerary check details" })
    );
    const tab = dialog.getByRole("tab", { name: "Changes to check (2)" });
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const panel = within(
      dialog.getByRole("tabpanel", { name: "Changes to check (2)" })
    );
    await waitFor(async () => {
      await expect(panel.getByText("Garden")).toBeVisible();
      await expect(panel.getByText("Friday, Jun 20, 2025")).toBeVisible();
      await expect(panel.getByText("Former entry")).toBeVisible();
    });
    await expect(panel.getAllByRole("button")).toHaveLength(1);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(changes).toHaveFocus());

    await user.click(changes);
    await user.click(await body.findByRole("button", { name: "Go to entry" }));
    const entry = await canvas.findByRole("listitem", { name: "Garden" });
    await waitFor(() => expect(entry).toHaveFocus());
    await expect(
      canvas.getByRole("heading", { name: "Friday, Jun 20, 2025" })
    ).toBeVisible();

    const check = canvas.getByRole("button", { name: "Check itinerary" });
    await waitFor(() =>
      expect(check).not.toHaveAttribute("aria-disabled", "true")
    );
    await user.click(check);
    await user.click(
      await body.findByRole("button", { name: "Mark as checked" })
    );
    const inspect = await canvas.findByRole("button", {
      name: "Inspect saved check state"
    });
    await expect(
      canvas.getByText("Changed since last check")
    ).toBeInTheDocument();
    await expect(canvas.getByText("2 changes to check")).toBeInTheDocument();
    await expect(
      within(entry).getByRole("button", { name: "Lock start for Garden" })
    ).toHaveAttribute("aria-disabled", "true");
    await user.click(canvas.getByRole("button", { name: "Refresh itinerary" }));
    await canvas.findByText(/Newer itinerary data is available/);
    await expect(inspect).toBeVisible();
    await expect(canvas.getByText("Changed since last check")).toBeVisible();
    await user.click(inspect);
    await expect(
      await canvas.findByText("The saved itinerary has a newer manual check.")
    ).toBeVisible();
    await expect(canvas.getByText("Manually checked")).toBeVisible();
    await expect(
      canvas.queryByText("2 changes to check")
    ).not.toBeInTheDocument();
    await expect(checkPosts).toHaveBeenCalledTimes(1);
  }
};

export const InspectsAnUnconfirmedCheckBeforeConfirmingAgain: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      checkPosts.mockClear();
      const saved = itineraryFixture("2099-06-10", "2099-06-11");
      const readFailures: MirageResponse[] = [];
      server.get(itineraryUrl, () => readFailures.shift() ?? saved, {
        timing: 0
      });
      const failedReply = (): MirageResponse => {
        readFailures.push(new MirageResponse(503));
        return new MirageResponse(503);
      };
      const successfulReply = (): MirageResponse => {
        saved.lastCheckedAt = "2026-11-23T16:00:00Z";
        saved.checkState = "MANUALLY_CHECKED";
        return new MirageResponse(204);
      };
      const replies = [failedReply, successfulReply];
      server.post(
        `${itineraryUrl}/check`,
        () => {
          checkPosts();
          return (replies.shift() ?? successfulReply)();
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const trigger = canvas.getByRole("button", { name: "Check itinerary" });
    await waitFor(() =>
      expect(trigger).not.toHaveAttribute("aria-disabled", "true")
    );
    await user.click(trigger);
    await user.click(
      await body.findByRole("button", { name: "Mark empty itinerary checked" })
    );

    const inspect = await canvas.findByRole("button", {
      name: "Inspect saved check state"
    });
    await expect(trigger).toHaveAttribute("aria-disabled", "true");
    await expect(trigger).toHaveAccessibleDescription(
      "Inspect the saved check state before confirming again."
    );
    await user.click(inspect);
    await expect(
      await canvas.findByText(/The saved check state couldn't be loaded/)
    ).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-disabled", "true");

    await user.click(inspect);
    await expect(
      await canvas.findByText(/No newer check was found/)
    ).toBeVisible();
    await expect(canvas.getByText("Not yet checked")).toBeVisible();
    await expect(checkPosts).toHaveBeenCalledTimes(1);
    await user.click(trigger);
    await user.click(
      await body.findByRole("button", { name: "Mark empty itinerary checked" })
    );
    await expect(await canvas.findByText("Manually checked")).toBeVisible();
    await expect(checkPosts).toHaveBeenCalledTimes(2);
  }
};

export const ShowsWatchedSourceValuesAndKeepsLaterNotices: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      checkPosts.mockClear();
      const saved = savedTimeline(
        "2099-06-10T09:00+02:00",
        "2099-06-10T09:30+02:00"
      );
      delete saved.lastCheckedAt;
      saved.checkState = "NOT_YET_CHECKED";
      const target = {
        entryId: 42,
        subject: "Museum",
        date: "2099-06-10",
        reasons: []
      };
      saved.changeNotices = [
        {
          ...target,
          sourceBaseline: "WHEN_SCHEDULED",
          sourceChanges: [
            {
              field: "WORKING_HOURS",
              baseline: "09:00-17:00",
              current: "09:00-17:00",
              restored: true
            },
            {
              field: "TRIP_NOTE",
              current: "Enter from the courtyard",
              restored: false
            }
          ]
        }
      ];
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.post(
        `${itineraryUrl}/check`,
        (_schema, request) => {
          checkPosts(JSON.parse(request.requestBody));
          saved.lastCheckedAt = "2026-11-26T09:00:00Z";
          saved.checkContext = "after-check-and-later-catalogue-edit";
          saved.checkState = "CHANGED_SINCE_LAST_CHECK";
          saved.changeNotices = [
            {
              ...target,
              sourceBaseline: "AT_LAST_CHECK",
              sourceChanges: [
                {
                  field: "CATALOGUE_TIP",
                  baseline: "Use the side gate",
                  current: "Use the main gate",
                  restored: false
                },
                {
                  field: "OPTIMAL_VISIT_PERIOD",
                  baseline: "2026-04-01/2026-10-01",
                  current: "2026-05-01/2026-09-01",
                  restored: false
                }
              ]
            }
          ];
          return new MirageResponse(503);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await user.click(
      await canvas.findByRole("button", { name: "1 change to check" })
    );
    const notices = within(
      await body.findByRole("dialog", { name: "Itinerary check details" })
    );
    await waitFor(() =>
      expect(notices.getByText("Working hours")).toBeVisible()
    );
    await expect(notices.getAllByText("When scheduled")).toHaveLength(2);
    await expect(notices.getAllByText("09:00-17:00")).toHaveLength(2);
    await expect(
      notices.getByText("Changed in between and restored.")
    ).toBeVisible();
    await expect(notices.getByText("Not recorded")).toBeVisible();
    await expect(notices.getByText("Enter from the courtyard")).toBeVisible();
    await user.click(notices.getByRole("button", { name: "Close" }));

    const check = await canvas.findByRole("button", {
      name: "Check itinerary"
    });
    await waitFor(() =>
      expect(check).not.toHaveAttribute("aria-disabled", "true")
    );
    await user.click(check);
    await user.click(
      await body.findByRole("button", { name: "Mark as checked" })
    );
    await user.click(
      await canvas.findByRole("button", { name: "Inspect saved check state" })
    );

    await expect(
      await canvas.findByText("The saved itinerary has a newer manual check.")
    ).toBeVisible();
    await expect(canvas.getByText("Changed since last check")).toBeVisible();
    await expect(checkPosts).toHaveBeenCalledTimes(1);
    await expect(checkPosts).toHaveBeenCalledWith({
      checkContext: "displayed-itinerary"
    });
    await user.click(canvas.getByRole("button", { name: "1 change to check" }));
    const later = within(
      await body.findByRole("dialog", { name: "Itinerary check details" })
    );
    await waitFor(() => expect(later.getByText("Catalogue tip")).toBeVisible());
    await expect(later.getAllByText("At last check")).toHaveLength(2);
    await expect(later.getByText("Use the side gate")).toBeVisible();
    await expect(later.getByText("Use the main gate")).toBeVisible();
    await expect(later.getByText("May 1, 2026 to Sep 1, 2026")).toBeVisible();
    await expect(later.queryByText("Working hours")).not.toBeInTheDocument();
  }
};

export const AcceptsTwoWarningsOnOneEntryWithoutClearingThem: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      checkPosts.mockClear();
      const saved = savedTimeline(
        "2099-06-20T09:00+02:00",
        "2099-06-20T11:30+02:00"
      );
      const [entry] = saved.days[0].entries.splice(0, 1);
      saved.days[10].entries.push({
        ...entry,
        visitDuration: "3-4h",
        warnings: ["PERMANENTLY_CLOSED", "PLANNED_LENGTH_OUTSIDE_SOURCE_RANGE"]
      });
      saved.checkState = "CHANGED_SINCE_LAST_CHECK";
      saved.changeNotices = [
        {
          entryId: entry.entryId,
          subject: entry.name,
          date: "2099-06-20",
          reasons: [],
          sourceBaseline: "AT_LAST_CHECK",
          sourceChanges: [
            {
              field: "PERMANENT_CLOSURE",
              baseline: "NOT_PERMANENTLY_CLOSED",
              current: "PERMANENTLY_CLOSED",
              restored: false
            }
          ]
        }
      ];
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.post(
        `${itineraryUrl}/check`,
        (_schema, request) => {
          checkPosts(JSON.parse(request.requestBody));
          saved.lastCheckedAt = "2099-06-20T10:00:00Z";
          saved.checkContext = "warnings-accepted";
          saved.checkState = "MANUALLY_CHECKED";
          saved.changeNotices = [];
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    const closure = "Permanently closed";
    const length =
      "Planned length is outside the current visit duration range.";
    await expect(
      await canvas.findByRole("button", { name: "1 change to check" })
    ).toBeVisible();
    const warnings = await canvas.findByRole("button", { name: "2 warnings" });
    await user.click(warnings);
    const details = within(
      await body.findByRole("dialog", { name: "Itinerary check details" })
    );
    const warningTab = details.getByRole("tab", { name: "Warnings (2)" });
    await expect(warningTab).toHaveAttribute("aria-selected", "true");
    const changesTab = details.getByRole("tab", {
      name: "Changes to check (1)"
    });
    await user.click(changesTab);
    await expect(changesTab).toHaveAttribute("aria-selected", "true");
    await user.click(warningTab);
    const warningPanel = within(
      details.getByRole("tabpanel", { name: "Warnings (2)" })
    );
    await expect(warningPanel.getAllByRole("listitem")).toHaveLength(2);
    await expect(warningPanel.getByText(closure)).toBeVisible();
    await expect(warningPanel.getByText(length)).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(warnings).toHaveFocus());
    await user.click(warnings);
    await user.click(
      (await body.findAllByRole("button", { name: "Go to entry" }))[0]
    );

    const museum = await canvas.findByRole("listitem", { name: "Museum" });
    await waitFor(() => expect(museum).toHaveFocus());
    const day = within(canvas.getByRole("article", { name: /Jun 20, 2099/ }));
    await expect(day.getByText("2 warnings")).toBeVisible();
    await expect(within(museum).getByText(closure)).toBeVisible();
    await expect(within(museum).getByText(length)).toBeVisible();

    const check = canvas.getByRole("button", { name: "Check itinerary" });
    await waitFor(() =>
      expect(check).not.toHaveAttribute("aria-disabled", "true")
    );
    await user.click(check);
    const confirmation = within(
      await body.findByRole("dialog", { name: "Check itinerary" })
    );
    await waitFor(() => expect(confirmation.getByText(closure)).toBeVisible());
    await expect(confirmation.getByText(length)).toBeVisible();
    await expect(
      confirmation.getByText(/does not repair or retime/)
    ).toBeVisible();
    await user.click(
      confirmation.getByRole("button", {
        name: "Accept warnings and mark checked"
      })
    );

    await expect(await canvas.findByText("Manually checked")).toBeVisible();
    const remaining = await canvas.findByRole("button", {
      name: "2 warnings remain"
    });
    await expect(
      canvas.queryByRole("button", { name: /changes? to check/ })
    ).not.toBeInTheDocument();
    await expect(checkPosts).toHaveBeenCalledTimes(1);
    await expect(checkPosts).toHaveBeenCalledWith({
      checkContext: "displayed-itinerary"
    });
    await expect(
      within(museum).getByRole("textbox", { name: "End clock for Museum" })
    ).toHaveValue("11:30");
    await user.click(remaining);
    await expect(
      await body.findByRole("tab", { name: "Warnings (2)" })
    ).toHaveAttribute("aria-selected", "true");
  }
};

export const RefreshesAStaleCheckBeforeAllowingFreshConfirmation: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      checkPosts.mockClear();
      const saved = savedTimeline(
        "2099-06-10T09:00+02:00",
        "2099-06-10T09:30+02:00"
      );
      delete saved.lastCheckedAt;
      saved.checkState = "NOT_YET_CHECKED";
      server.get(itineraryUrl, () => saved, { timing: 0 });
      const replies = [
        () => {
          saved.checkContext = "after-catalogue-edit";
          saved.changeNotices = [
            {
              entryId: 42,
              subject: "Museum",
              date: "2099-06-10",
              reasons: [],
              sourceBaseline: "WHEN_SCHEDULED",
              sourceChanges: [
                {
                  field: "CATALOGUE_TIP",
                  current: "Use the east gate",
                  restored: false
                }
              ]
            }
          ];
          return new MirageResponse(
            409,
            {},
            {
              errorCode: "ITINERARY_CHECK_STALE",
              errorMessage:
                "The itinerary or its attraction sources changed. Refresh and review the itinerary before checking again."
            }
          );
        },
        () => {
          saved.lastCheckedAt = "2026-11-26T09:00:00Z";
          saved.checkContext = "after-check";
          saved.changeNotices = [];
          saved.checkState = "MANUALLY_CHECKED";
          return new MirageResponse(204);
        }
      ];
      server.post(
        `${itineraryUrl}/check`,
        (_schema, request) => {
          checkPosts(JSON.parse(request.requestBody));
          return replies.shift()?.() ?? new MirageResponse(500);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = overlay(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const check = canvas.getByRole("button", { name: "Check itinerary" });
    await waitFor(() =>
      expect(check).not.toHaveAttribute("aria-disabled", "true")
    );
    await user.click(check);
    await user.click(
      await body.findByRole("button", { name: "Mark as checked" })
    );

    const refresh = await canvas.findByRole("button", {
      name: "Refresh before checking"
    });
    await expect(check).toHaveAccessibleDescription(
      "Refresh the itinerary before confirming again."
    );
    await expect(check).toHaveAttribute("aria-disabled", "true");
    await expect(
      canvas.getByText(/The itinerary or its attraction sources changed/)
    ).toBeVisible();
    await user.click(refresh);

    await expect(
      await canvas.findByRole("button", { name: "1 change to check" })
    ).toBeVisible();
    await expect(canvas.getByText("Not yet checked")).toBeVisible();
    await expect(checkPosts).toHaveBeenCalledTimes(1);
    await expect(checkPosts).toHaveBeenCalledWith({
      checkContext: "displayed-itinerary"
    });
    await user.click(check);
    await user.click(
      await body.findByRole("button", { name: "Mark as checked" })
    );
    await expect(await canvas.findByText("Manually checked")).toBeVisible();
    await expect(checkPosts).toHaveBeenNthCalledWith(2, {
      checkContext: "after-catalogue-edit"
    });
  }
};

export const NewerDataRequiresAFreshCheckConfirmation: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      checkPosts.mockClear();
      server.get(itineraryUrl, () =>
        savedTimeline("2099-06-10T09:00+02:00", "2099-06-10T09:30+02:00")
      );
      server.post(`${itineraryUrl}/check`, () => {
        checkPosts();
        return new MirageResponse(204);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await canvas.findByRole("listitem", { name: "Museum" });
    const check = canvas.getByRole("button", { name: "Check itinerary" });
    await waitFor(() =>
      expect(check).not.toHaveAttribute("aria-disabled", "true")
    );
    await user.click(check);
    const dialog = within(
      await overlay(canvasElement).findByRole("dialog", {
        name: "Check itinerary"
      })
    );
    const confirm = dialog.getByRole("button", { name: "Mark as checked" });
    const newer = savedTimeline(
      "2099-06-10T10:00+02:00",
      "2099-06-10T10:30+02:00"
    );
    newer.days[0].entries[0].name = "Renamed Museum";
    server.get(itineraryUrl, () => newer);
    const document = canvasElement.ownerDocument;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible"
    });
    try {
      fireEvent(document, new Event("visibilitychange"));
      await dialog.findByText(
        "Refresh the itinerary to review the newer data before checking it."
      );
    } finally {
      Reflect.deleteProperty(document, "visibilityState");
    }
    await expect(confirm).toHaveAttribute("aria-disabled", "true");
    await user.click(confirm);
    await expect(checkPosts).not.toHaveBeenCalled();

    await user.click(dialog.getByRole("button", { name: "Cancel" }));
    await user.click(
      await canvas.findByRole("button", { name: "Refresh itinerary" })
    );
    await expect(
      await canvas.findByRole("listitem", { name: "Renamed Museum" })
    ).toBeVisible();
    await expect(check).not.toHaveAttribute("aria-disabled", "true");
  }
};

export const OpensTheSavedItineraryAndSavesTheSuggestedClockOnBlur: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    trip: {
      ...ITINERARY_TRIP,
      fromDate: "2099-10-25",
      toDate: "2099-10-25",
      hasItineraryEntries: true
    },
    configureTripServer: (server: Server) => {
      schedulingPosts.mockClear();
      const saved = itineraryFixture("2099-10-25", "2099-10-25", [
        {
          attractionId: 42,
          name: "Market steps",
          place: "Florence",
          attractionGroup: "SECONDARY",
          mustVisit: false,
          category: "HISTORIC_SITE",
          visitDuration: "0m"
        }
      ]);
      saved.timeZone = "Europe/Belgrade";
      saved.days[0].entries = [
        {
          entryId: 21,
          attractionId: 41,
          name: "Garden",
          category: "PARK",
          attractionGroup: "PRIMARY",
          mustVisit: true,
          fixedStart: false,
          warnings: [],
          timing: {
            zone: "Europe/Belgrade",
            start: "2099-10-25T02:30+02:00",
            end: "2099-10-25T02:30+01:00"
          }
        }
      ];
      const timing = {
        zone: "Europe/Belgrade",
        start: "2099-10-25T02:30+02:00",
        end: "2099-10-25T02:30+02:00"
      };
      server.get("http://localhost:8080/trips/1/itinerary", () => saved);
      server.post(schedulingUrl, (_schema, request) => {
        schedulingPosts(JSON.parse(request.requestBody));
        saved.days[0].entries.unshift({
          entryId: 22,
          attractionId: 42,
          name: "Market steps",
          category: "HISTORIC_SITE",
          attractionGroup: "SECONDARY",
          mustVisit: false,
          fixedStart: false,
          warnings: [],
          timing
        });
        saved.unscheduledAttractions = [];
        return new MirageResponse(204);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await expect(
      await canvas.findByRole("button", { name: "Itinerary" })
    ).toHaveAttribute("aria-current", "step");
    const day = within(await canvas.findByRole("list", { name: "Main path" }));
    const garden = within(day.getByRole("listitem", { name: "Garden" }));
    const start = garden.getByRole("textbox", {
      name: "Start clock for Garden"
    });
    const end = garden.getByRole("textbox", { name: "End clock for Garden" });
    await expect(start).toBeVisible();
    await expect(start).toHaveValue("02:30");
    await expect(end).toBeVisible();
    await expect(end).toHaveValue("02:30");
    await expect(garden.getByText("UTC+02:00")).toBeVisible();
    await expect(garden.getByText("UTC+01:00")).toBeVisible();
    await expect(garden.queryByText("Brief stop")).not.toBeInTheDocument();
    await user.click(
      await canvas.findByRole("button", { name: "Add Market steps" })
    );
    await user.click(
      await within(canvasElement.ownerDocument.body).findByRole("menuitem", {
        name: /Oct 25, 2099/
      })
    );
    const draft = within(
      await canvas.findByRole("form", { name: "Add Market steps" })
    );
    const clock = draft.getByLabelText("Start clock");
    await expect(clock).toHaveValue("02:30");
    await expect(clock).toHaveFocus();
    await expect(schedulingPosts).not.toHaveBeenCalled();

    await user.tab();
    const stop = within(
      await day.findByRole("listitem", { name: "Market steps" })
    );
    await expect(stop.getByText("Brief stop")).toBeVisible();
    const stopClock = stop.getByRole("textbox", {
      name: "Start clock for Market steps"
    });
    await expect(stopClock).toBeVisible();
    await expect(stopClock).toHaveValue("02:30");
    await expect(
      stop.queryByRole("textbox", { name: "End clock for Market steps" })
    ).not.toBeInTheDocument();
    await expect(stop.getByText("If passing by")).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Add Market steps" })
    ).not.toBeInTheDocument();
    await expect(schedulingPosts).toHaveBeenCalledTimes(1);
    await expect(schedulingPosts).toHaveBeenCalledWith({
      attractionId: 42,
      date: "2099-10-25",
      startTime: "02:30"
    });
  }
};

export const EditsTheSuggestedStartBeforeSavingOnBlur: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    trip: {
      ...ITINERARY_TRIP,
      fromDate: "2099-06-10",
      toDate: "2099-06-10",
      hasItineraryEntries: true
    },
    configureTripServer: (server: Server) => {
      schedulingPosts.mockClear();
      const date = "2099-06-10";
      const zone = "Europe/Paris";
      const saved = itineraryFixture(date, date, [
        {
          attractionId: 42,
          name: "Louvre",
          place: "Paris",
          attractionGroup: "PRIMARY",
          mustVisit: true,
          category: "ART_MUSEUM",
          visitDuration: "90m"
        }
      ]);
      saved.timeZone = zone;
      saved.days[0].entries = [
        {
          entryId: 21,
          attractionId: 41,
          name: "Eiffel Tower",
          category: "HISTORIC_SITE",
          attractionGroup: "PRIMARY",
          mustVisit: true,
          fixedStart: false,
          warnings: [],
          timing: {
            zone,
            start: `${date}T09:00+02:00`,
            end: `${date}T11:00+02:00`
          }
        }
      ];
      const refreshFailures: MirageResponse[] = [];
      server.get(
        "http://localhost:8080/trips/1/itinerary",
        () => refreshFailures.shift() ?? saved
      );
      server.post(schedulingUrl, (_schema, request) => {
        schedulingPosts(JSON.parse(request.requestBody));
        saved.days[0].entries.push({
          entryId: 22,
          attractionId: 42,
          name: "Louvre",
          category: "ART_MUSEUM",
          attractionGroup: "PRIMARY",
          mustVisit: true,
          fixedStart: false,
          warnings: [],
          timing: {
            zone,
            start: `${date}T11:45+02:00`,
            end: `${date}T13:15+02:00`
          }
        });
        saved.unscheduledAttractions = [];
        refreshFailures.push(new MirageResponse(503));
        return new MirageResponse(204);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = setupUser();
    const addLouvre = async (): Promise<HTMLElement> => {
      await user.click(
        await canvas.findByRole("button", { name: "Add Louvre" })
      );
      await user.click(
        await body.findByRole("menuitem", { name: /Jun 10, 2099/ })
      );
      return canvas.findByRole("form", { name: "Add Louvre" });
    };
    const canceled = within(await addLouvre());
    await expect(canceled.getByLabelText("Start clock")).toHaveFocus();
    await user.click(canceled.getByRole("button", { name: "Cancel" }));
    await expect(
      canvas.queryByRole("form", { name: "Add Louvre" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Add Louvre" })
    ).toHaveFocus();
    await expect(schedulingPosts).not.toHaveBeenCalled();

    const dismissed = within(await addLouvre());
    await expect(dismissed.getByLabelText("Start clock")).toHaveFocus();
    await user.keyboard("{Escape}");
    await expect(
      canvas.queryByRole("form", { name: "Add Louvre" })
    ).not.toBeInTheDocument();
    await expect(schedulingPosts).not.toHaveBeenCalled();

    const draft = within(await addLouvre());
    const clock = draft.getByLabelText("Start clock");
    await expect(clock).toHaveValue("11:00");
    await expect(clock).toHaveFocus();
    fireEvent.change(clock, { target: { value: "11:45" } });
    await expect(clock).toHaveValue("11:45");
    await expect(schedulingPosts).not.toHaveBeenCalled();
    await user.click(canvas.getByRole("listitem", { name: "Eiffel Tower" }));

    await expect(
      await canvas.findByText(/The itinerary couldn't be refreshed/)
    ).toBeVisible();
    await expect(
      canvas.getByText("Louvre is saved in the itinerary.")
    ).toBeVisible();
    await expect(
      canvas.queryByRole("form", { name: "Add Louvre" })
    ).not.toBeInTheDocument();
    await user.click(canvas.getByRole("button", { name: "Refresh itinerary" }));
    const louvre = within(
      await canvas.findByRole("listitem", { name: "Louvre" })
    );
    const start = louvre.getByRole("textbox", {
      name: "Start clock for Louvre"
    });
    await expect(start).toBeVisible();
    await expect(start).toHaveValue("11:45");
    await expect(schedulingPosts).toHaveBeenCalledTimes(1);
    await expect(schedulingPosts).toHaveBeenCalledWith({
      attractionId: 42,
      date: "2099-06-10",
      startTime: "11:45"
    });
  }
};

export const InspectsSavedItineraryBeforeRetryingAnUnconfirmedEntry: Story = {
  parameters: {
    savedAttractions: [
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 42,
        attractionName: "Art museum",
        attractionCategory: "ART_MUSEUM",
        cityName: "Florence",
        regionName: "Tuscany",
        countryName: "Italy"
      }
    ],
    configureTripServer: (server: Server) => {
      schedulingPosts.mockClear();
      const day = "2099-06-10";
      const original = itineraryFixture(day, day, [
        {
          attractionId: 42,
          name: "Art museum",
          place: "Florence",
          attractionGroup: "PRIMARY",
          mustVisit: true,
          category: "ART_MUSEUM",
          visitDuration: "3-2h"
        }
      ]);
      const timing = {
        zone: "Europe/Belgrade",
        start: `${day}T09:00+02:00`,
        end: `${day}T09:45+02:00`
      };
      const saved = itineraryFixture(day, day);
      saved.timeZone = timing.zone;
      saved.days[0].entries = [
        {
          entryId: 21,
          attractionId: 42,
          name: "Art museum",
          category: "ART_MUSEUM",
          attractionGroup: "PRIMARY",
          mustVisit: true,
          fixedStart: false,
          warnings: [],
          timing
        }
      ];
      let current = original;
      const inspectionFailures: MirageResponse[] = [];
      server.get(
        "http://localhost:8080/trips/1/itinerary",
        () => inspectionFailures.shift() ?? current
      );
      const writes = [
        () =>
          new MirageResponse(
            400,
            {},
            {
              errorCode: "BAD_REQUEST",
              errorMessage:
                "Enter the required details to add this attraction.",
              schedulingInputs: { requiredInputs: ["VISIT_DURATION"] }
            }
          ),
        () => {
          inspectionFailures.push(new MirageResponse(503));
          return new MirageResponse(503);
        },
        () => {
          current = saved;
          return new MirageResponse(204);
        }
      ];
      server.post(schedulingUrl, (_schema, request) => {
        schedulingPosts(JSON.parse(request.requestBody));
        return writes.shift()?.() ?? new MirageResponse(500);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await user.click(
      await canvas.findByRole("button", { name: "Add Art museum" })
    );
    await user.click(
      await body.findByRole("menuitem", { name: /Jun 10, 2099/ })
    );
    const draft = within(
      await canvas.findByRole("form", { name: "Add Art museum" })
    );
    fireEvent.change(await draft.findByLabelText("Start clock"), {
      target: { value: "09:00" }
    });
    await user.type(
      draft.getByLabelText("Itinerary time zone"),
      "Europe/Belgrade"
    );
    await user.click(draft.getByRole("button", { name: "Add to day" }));
    await expect(schedulingPosts).toHaveBeenCalledTimes(1);
    await expect(schedulingPosts).toHaveBeenCalledWith({
      attractionId: 42,
      date: "2099-06-10",
      startTime: "09:00",
      timeZone: "Europe/Belgrade"
    });
    await user.type(await draft.findByLabelText("Visit duration"), "30-45m");
    await user.click(draft.getByRole("button", { name: "Add to day" }));

    await user.click(
      await draft.findByRole("button", { name: "Inspect saved itinerary" })
    );
    await draft.findByText(
      "The saved itinerary couldn't be loaded. Try inspecting it again."
    );
    await expect(
      draft.queryByRole("button", { name: "Add to day" })
    ).not.toBeInTheDocument();
    await user.click(
      draft.getByRole("button", { name: "Inspect saved itinerary" })
    );
    await draft.findByText(
      /The saved itinerary does not contain this attraction/
    );
    await expect(draft.getByLabelText("Visit duration")).toHaveValue("30-45m");
    await expect(schedulingPosts).toHaveBeenCalledTimes(2);
    const request = {
      attractionId: 42,
      date: "2099-06-10",
      startTime: "09:00",
      visitDuration: "30-45m",
      timeZone: "Europe/Belgrade"
    };
    await expect(schedulingPosts).toHaveBeenNthCalledWith(2, request);

    await user.click(draft.getByRole("button", { name: "Add to day" }));
    await expect(
      await canvas.findByRole("listitem", { name: "Art museum" })
    ).toBeVisible();
    await expect(schedulingPosts).toHaveBeenCalledTimes(3);
    await expect(schedulingPosts).toHaveBeenNthCalledWith(3, request);
    await user.click(canvas.getByRole("button", { name: "Edit" }));
    await expect(await canvas.findByText("30-45m")).toBeVisible();
  }
};

export const InspectsALostSuccessfulAdditionWithoutSubmittingAgain: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      schedulingPosts.mockClear();
      let saved = compositionTimeline();
      const scheduled = timelineWithScheduledLunaCafe(saved, {
        start: "08:00",
        end: "08:30",
        index: 0
      });
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.post(schedulingUrl, (_schema, request) => {
        schedulingPosts(JSON.parse(request.requestBody));
        saved = scheduled;
        return new MirageResponse(503);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await user.click(
      await canvas.findByRole("button", { name: "Add Luna Cafe" })
    );
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", {
        name: /Jun 10, 2099/
      })
    );
    const draft = within(
      await canvas.findByRole("form", { name: "Add Luna Cafe" })
    );
    fireEvent.change(draft.getByLabelText("Start clock"), {
      target: { value: "08:00" }
    });
    await user.click(draft.getByRole("button", { name: "Add to day" }));
    const inspect = await draft.findByRole("button", {
      name: "Inspect saved itinerary"
    });
    await expect(
      canvas.getByRole("button", { name: "Check itinerary" })
    ).toHaveAttribute("aria-disabled", "true");

    await user.click(canvas.getByRole("button", { name: "Refresh itinerary" }));
    await canvas.findByText(/Newer itinerary data is available/);
    await expect(inspect).toBeVisible();
    await expect(draft.getByLabelText("Start clock")).toHaveValue("08:00");
    await expect(
      canvas.queryByRole("listitem", { name: "Luna Cafe" })
    ).not.toBeInTheDocument();

    await user.click(inspect);
    await expectLunaCafeScheduled(canvas, "08:00");
    await expect(schedulingPosts).toHaveBeenCalledTimes(1);
  }
};

export const ATripWithSavedEntriesStillOpensInReviewAfterTheTrip: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    trip: { ...ITINERARY_TRIP, hasItineraryEntries: true }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("button", { name: "Review" })
    ).toHaveAttribute("aria-current", "step");
  }
};

export const KeepsAnInvalidSpringClockAndSavesTheFirstFallOccurrenceWithoutAPrompt: Story =
  {
    parameters: {
      savedAttractions: SAVED_ATTRACTIONS,
      trip: { ...ITINERARY_TRIP, fromDate: "2027-03-28", toDate: "2027-10-31" },
      configureTripServer: (server: Server) => {
        schedulingPosts.mockClear();
        // Only the two dates exercised here; the server's timing is not simulated in the browser.
        const original = itineraryFixture("2027-03-28", "2027-03-28", [
          {
            attractionId: 42,
            name: "Art museum",
            place: "Florence",
            attractionGroup: "PRIMARY",
            mustVisit: true,
            category: "ART_MUSEUM",
            visitDuration: "30m"
          }
        ]);
        original.days.push({ id: 2, date: "2027-10-31", entries: [] });
        original.timeZone = "Europe/Belgrade";
        const saved = structuredClone(original);
        saved.unscheduledAttractions = [];
        saved.days[1].entries.push({
          entryId: 21,
          attractionId: 42,
          name: "Art museum",
          category: "ART_MUSEUM",
          attractionGroup: "PRIMARY",
          mustVisit: true,
          fixedStart: false,
          warnings: [],
          timing: {
            zone: "Europe/Belgrade",
            start: "2027-10-31T02:30+02:00",
            end: "2027-10-31T02:00+01:00"
          }
        });
        let current = original;
        server.get(itineraryUrl, () => current);
        const writes = [
          () =>
            new MirageResponse(
              400,
              {},
              {
                errorCode: "BAD_REQUEST",
                errorMessage:
                  "That start clock does not occur in Europe/Belgrade on this date. Choose another time."
              }
            ),
          () => {
            current = saved;
            return new MirageResponse(204);
          }
        ];
        server.post(schedulingUrl, (_schema, request) => {
          schedulingPosts(JSON.parse(request.requestBody));
          return writes.shift()?.() ?? new MirageResponse(500);
        });
      }
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const body = within(canvasElement.ownerDocument.body);
      const user = setupUser();
      await user.click(
        await canvas.findByRole("button", { name: "Itinerary" })
      );
      await user.click(
        await canvas.findByRole("button", { name: "Add Art museum" })
      );
      await user.click(
        await body.findByRole("menuitem", { name: /Mar 28, 2027/ })
      );
      const spring = within(
        await canvas.findByRole("form", { name: "Add Art museum" })
      );
      fireEvent.change(await spring.findByLabelText("Start clock"), {
        target: { value: "02:30" }
      });
      await user.click(spring.getByRole("button", { name: "Add to day" }));
      await expect(
        await spring.findByText(/That start clock does not occur/)
      ).toBeVisible();
      await expect(spring.getByLabelText("Start clock")).toHaveValue("02:30");
      await user.click(spring.getByRole("button", { name: "Cancel" }));

      await user.click(canvas.getByRole("button", { name: "Add Art museum" }));
      await user.click(
        await body.findByRole("menuitem", { name: /Oct 31, 2027/ })
      );
      const fall = within(
        await canvas.findByRole("form", { name: "Add Art museum" })
      );
      fireEvent.change(await fall.findByLabelText("Start clock"), {
        target: { value: "02:30" }
      });
      await user.click(fall.getByRole("button", { name: "Add to day" }));
      const museum = within(
        await canvas.findByRole("listitem", { name: "Art museum" })
      );
      const start = museum.getByRole("textbox", {
        name: "Start clock for Art museum"
      });
      const end = museum.getByRole("textbox", {
        name: "End clock for Art museum"
      });
      await expect(start).toBeVisible();
      await expect(start).toHaveValue("02:30");
      await expect(end).toBeVisible();
      await expect(end).toHaveValue("02:00");
      await expect(schedulingPosts).toHaveBeenLastCalledWith({
        attractionId: 42,
        date: "2027-10-31",
        startTime: "02:30"
      });
    }
  };

export const PagesThroughTheItineraryAt768Pixels: Story = {
  parameters: { trip: ITINERARY_TRIP },
  decorators: [
    (Story) => (
      <div style={{ width: "768px", maxWidth: "100%" }}>
        <Story />
      </div>
    )
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const itinerary = await canvas.findByRole("button", { name: "Itinerary" });
    await user.click(itinerary);

    const days = await canvas.findByRole("region", { name: "Itinerary days" });
    const pager = within(canvas.getByRole("region", { name: "Trip overview" }));
    await pager.findByRole("button", { name: "Day 1 of 15" });
    const [day] = within(days).getAllByRole("article");
    await expect(days.scrollWidth).toBeLessThanOrEqual(days.clientWidth);
    await expect(day.getBoundingClientRect().right).toBeCloseTo(
      days.getBoundingClientRect().right,
      0
    );
    await expect(
      within(days).getByRole("heading", { name: "Tuesday, Jun 10, 2025" })
    ).toBeVisible();
    await expect(
      pager.getByRole("button", { name: "Previous day" })
    ).toBeDisabled();

    await user.click(pager.getByRole("button", { name: "Next day" }));
    await pager.findByRole("button", { name: "Day 2 of 15" });
    await user.click(pager.getByRole("button", { name: "Previous day" }));
    await user.click(pager.getByRole("button", { name: "Day 1 of 15" }));
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", {
        name: "Friday, Jun 20, 2025"
      })
    );
    await pager.findByRole("button", { name: "Day 11 of 15" });

    await user.keyboard("{Alt>}4{/Alt}");
    await expect(canvas.getByRole("button", { name: "Plan" })).toHaveAttribute(
      "aria-current",
      "step"
    );
    await expect(
      canvas.queryByRole("region", { name: "Itinerary days" })
    ).not.toBeInTheDocument();
    await user.keyboard("{Alt>}3{/Alt}");
    await pager.findByRole("button", { name: "Day 11 of 15" });
    await expect(
      canvas.getByRole("heading", { name: "Friday, Jun 20, 2025" })
    ).toBeVisible();
  }
};

export const ShowsUnscheduledAttractionsInBoardOrder: Story = {
  parameters: {
    trip: ITINERARY_TRIP,
    configureTripServer: (server: Server) => {
      server.get(
        "http://localhost:8080/trips/1/itinerary",
        () =>
          itineraryFixture("2025-06-10", "2025-06-24", [
            {
              attractionId: 7,
              name: "Zurich Zoo",
              place: "Zurich",
              attractionGroup: "PRIMARY",
              mustVisit: true,
              category: "ZOO_AND_AQUARIUM",
              workingHours: "09:00-17:00",
              visitDuration: "45-60 min"
            },
            {
              attractionId: 5,
              name: "Arcade",
              place: "Zurich",
              attractionGroup: "PRIMARY",
              mustVisit: false,
              category: "HISTORIC_SITE"
            },
            {
              attractionId: 3,
              name: "Temple",
              place: "Athens",
              attractionGroup: "PRIMARY",
              mustVisit: false,
              category: "HISTORIC_SITE"
            },
            {
              attractionId: 6,
              name: "Viewpoint",
              place: "Zurich",
              attractionGroup: "SECONDARY",
              mustVisit: true,
              category: "OTHER_LANDMARK"
            },
            {
              attractionId: 4,
              name: "Bistro",
              place: "Athens",
              attractionGroup: "SECONDARY",
              mustVisit: false,
              category: "EATERY"
            }
          ]),
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const unscheduled = within(
      await canvas.findByRole("region", { name: "Unscheduled attractions" })
    );
    const top = within(
      unscheduled.getByRole("region", { name: "Top Attractions" })
    );
    const [zoo, arcade, temple] = top.getAllByRole("article");
    await expect(zoo).toHaveAccessibleName("Zurich Zoo");
    await expect(zoo).toHaveAccessibleDescription(/Must see/);
    await expect(
      within(zoo).getByText("Working hours: 09:00-17:00")
    ).toBeVisible();
    await expect(
      within(zoo).getByText("Visit duration: 45-60 min")
    ).toBeVisible();
    await expect(arcade).toHaveAccessibleName("Arcade");
    await expect(arcade).toHaveAccessibleDescription(/Worth seeing/);
    await expect(temple).toHaveAccessibleName("Temple");
    const secondary = within(
      unscheduled.getByRole("region", { name: "Secondary Spots" })
    );
    await expect(
      secondary.getByRole("article", { name: "Viewpoint" })
    ).toHaveAccessibleDescription(/Fit in nearby/);
    await expect(
      secondary.getByRole("article", { name: "Bistro" })
    ).toHaveAccessibleDescription(/Eatery.*If passing by/);
  }
};

export const CardMoveKeepsPlacesInOpenBoardOrder: Story = {
  parameters: {
    savedAttractions: [
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 7,
        attractionName: "Colosseum",
        cityName: "Rome"
      },
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 8,
        attractionName: "Uffizi",
        cityName: "Florence"
      },
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 9,
        attractionName: "Pantheon",
        cityName: "Rome"
      }
    ],
    configureTripServer: (server: Server) => {
      const colosseum = {
        attractionId: 7,
        name: "Colosseum",
        place: "Rome",
        attractionGroup: "PRIMARY",
        mustVisit: true,
        category: "HISTORIC_SITE"
      } as const;
      const uffizi = {
        ...colosseum,
        attractionId: 8,
        name: "Uffizi",
        place: "Florence"
      };
      const pantheon = { ...colosseum, attractionId: 9, name: "Pantheon" };
      let savedUnscheduled = [colosseum, pantheon, uffizi];
      server.put(
        "http://localhost:8080/trips/1/board/attractions/7",
        (_schema, request) => {
          boardMoves("1", "7", JSON.parse(request.requestBody));
          savedUnscheduled = [uffizi, pantheon, colosseum];
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
      server.get(
        "http://localhost:8080/trips/1/itinerary",
        () => itineraryFixture("2099-06-10", "2099-06-24", savedUnscheduled),
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const itinerary = await canvas.findByRole("button", { name: "Itinerary" });
    await user.click(itinerary);
    const unscheduled = await canvas.findByRole("region", {
      name: "Unscheduled attractions"
    });
    const [first, second, third] = within(unscheduled).getAllByRole("article");
    await expect(first).toHaveAccessibleName("Colosseum");
    await expect(second).toHaveAccessibleName("Pantheon");
    await expect(third).toHaveAccessibleName("Uffizi");

    await user.click(canvas.getByRole("button", { name: "Edit" }));
    const rome = canvas
      .getByRole("heading", { name: "Rome" })
      .closest(".city-group") as HTMLElement;
    const top = columnFor(rome, "Top Attractions");
    const source = within(top)
      .getByRole("link", { name: "Colosseum" })
      .closest("li") as HTMLElement;
    const dataTransfer = new DataTransfer();
    fireEvent.dragStart(source, { dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.drop(top, { dataTransfer });

    await waitFor(() =>
      expect(boardMoves).toHaveBeenCalledWith("1", "7", {
        targetGroup: "PRIMARY",
        previousAttractionId: 9,
        nextAttractionId: null
      })
    );
    await waitFor(() =>
      expect(
        within(top)
          .getAllByRole("link")
          .map((card) => card.textContent)
      ).toEqual(["Pantheon", "Colosseum"])
    );
    await expect(
      canvas
        .getAllByRole("heading", { name: /^(Rome|Florence)$/ })
        .map((city) => city.textContent)
    ).toEqual(["Rome", "Florence"]);

    await user.click(itinerary);
    const refreshedUnscheduled = within(
      await canvas.findByRole("region", { name: "Unscheduled attractions" })
    );
    await waitFor(async () => {
      await expect(
        refreshedUnscheduled.getAllByRole("article")[0]
      ).toHaveAccessibleName("Pantheon");
    });
    const [, moved, florence] = refreshedUnscheduled.getAllByRole("article");
    await expect(moved).toHaveAccessibleName("Colosseum");
    await expect(florence).toHaveAccessibleName("Uffizi");
  }
};

export const GoesToPrepareWithoutUnscheduledAttractions: Story = {
  parameters: { trip: ITINERARY_TRIP },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const unscheduled = within(
      await canvas.findByRole("region", { name: "Unscheduled attractions" })
    );
    await expect(
      unscheduled.getByText("No attractions are available to schedule.")
    ).toBeVisible();
    await user.click(
      unscheduled.getByRole("button", {
        name: "Find more attractions on the board"
      })
    );
    await expect(
      canvas.getByRole("button", { name: "Prepare" })
    ).toHaveAttribute("aria-current", "step");
    await expect(
      canvas.getByRole("button", { name: "Add attractions" })
    ).toBeVisible();
  }
};

export const ReloadsTheItineraryAndKeepsStaleDaysVisible: Story = {
  parameters: {
    trip: ITINERARY_TRIP,
    configureTripServer: (server: Server) => {
      const zoo = {
        attractionId: 7,
        name: "Zurich Zoo",
        place: "Zurich",
        attractionGroup: "PRIMARY",
        mustVisit: true,
        category: "ZOO_AND_AQUARIUM"
      } as const;
      const arcade = {
        attractionId: 5,
        name: "Arcade",
        place: "Zurich",
        attractionGroup: "PRIMARY",
        mustVisit: false,
        category: "HISTORIC_SITE"
      } as const;
      const changed: GetItineraryResponse["unscheduledAttractions"] = [
        { ...arcade, mustVisit: true },
        { ...zoo, attractionGroup: "SECONDARY", mustVisit: false }
      ];
      const responses = [
        new MirageResponse(503), // The check state is loaded in the header before opening the itinerary.
        new MirageResponse(503),
        itineraryFixture("2025-06-10", "2025-06-24", [zoo, arcade]),
        new MirageResponse(503),
        itineraryFixture("2025-06-10", "2025-06-25", changed),
        itineraryFixture("2025-06-10", "2025-06-26", changed)
      ];
      server.get(
        "http://localhost:8080/trips/1/itinerary",
        () => responses.shift() ?? new MirageResponse(500),
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const day = "Tuesday, Jun 10, 2025";
    const stale =
      "The itinerary couldn't be refreshed. Days and unscheduled attractions may be out of date.";
    await canvas.findByText("Check state unavailable");
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    await canvas.findByText("The itinerary couldn't be loaded.");
    await expect(
      canvas.queryByRole("region", { name: "Itinerary days" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("region", { name: "Unscheduled attractions" })
    ).not.toBeInTheDocument();

    const retry = canvas.getByRole("button", { name: "Retry" });
    await waitFor(() =>
      expect(retry).not.toHaveAttribute("aria-disabled", "true")
    );
    await user.click(retry);
    await canvas.findByRole("heading", { name: day });
    const unscheduled = within(
      canvas.getByRole("region", { name: "Unscheduled attractions" })
    );
    await expect(unscheduled.getAllByRole("article")[0]).toHaveAccessibleName(
      "Zurich Zoo"
    );
    await expect(
      unscheduled.getAllByRole("article")[0]
    ).toHaveAccessibleDescription(/Must see/);

    const ownerDocument = canvasElement.ownerDocument;
    let visibility: DocumentVisibilityState = "hidden";
    Object.defineProperty(ownerDocument, "visibilityState", {
      configurable: true,
      get: () => visibility
    });
    try {
      fireEvent(ownerDocument, new Event("visibilitychange"));
      visibility = "visible";
      fireEvent(ownerDocument, new Event("visibilitychange"));
      await canvas.findByText(stale);
      await expect(canvas.getByText("Refresh needed")).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "Check itinerary" })
      ).toHaveAccessibleDescription(
        "Refresh the itinerary before checking it."
      );
    } finally {
      Reflect.deleteProperty(ownerDocument, "visibilityState");
    }
    await expect(canvas.getByRole("heading", { name: day })).toBeVisible();
    await expect(unscheduled.getAllByRole("article")[0]).toHaveAccessibleName(
      "Zurich Zoo"
    );

    await user.click(canvas.getByRole("button", { name: "Refresh itinerary" }));
    await canvas.findByRole("button", { name: /^Days? .+ of 16$/ });
    const header = within(
      canvas.getByRole("region", { name: "Trip overview" })
    );
    await expect(header.getByText("16 days")).toBeInTheDocument();
    await expect(canvas.queryByText(stale)).not.toBeInTheDocument();
    const [first, second] = unscheduled.getAllByRole("article");
    await expect(first).toHaveAccessibleName("Arcade");
    await expect(first).toHaveAccessibleDescription(/Must see/);
    await expect(second).toHaveAccessibleName("Zurich Zoo");
    await expect(second).toHaveAccessibleDescription(/If passing by/);

    await user.click(canvas.getByRole("button", { name: "Plan" }));
    await user.click(canvas.getByRole("button", { name: "Itinerary" }));
    await canvas.findByRole("button", { name: /^Days? .+ of 17$/ });
    await expect(header.getByText("17 days")).toBeInTheDocument();
  }
};

export const RefreshKeepsAnUnfinishedClockUntilItIsCancelled: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "390px" }}>
        <Story />
      </div>
    )
  ],
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      server.get(itineraryUrl, () =>
        savedTimeline("2099-06-10T09:00+02:00", "2099-06-10T09:30+02:00")
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "Itinerary" }));
    const museum = await canvas.findByRole("listitem", { name: "Museum" });
    const start = within(museum).getByRole("textbox", {
      name: "Start clock for Museum"
    });
    await user.clear(start);
    await user.type(start, "09:2");

    const unsavedUnload = new Event("beforeunload", { cancelable: true });
    canvasElement.ownerDocument.defaultView?.dispatchEvent(unsavedUnload);
    await expect(unsavedUnload.defaultPrevented).toBe(true);

    server.get(itineraryUrl, () =>
      savedTimeline("2099-06-10T10:00+02:00", "2099-06-10T10:45+02:00")
    );
    const refresh = canvas.getByRole("button", { name: "Refresh itinerary" });
    await user.click(refresh);
    await expect(
      await canvas.findByText(/Newer itinerary data is available/)
    ).toBeVisible();
    await expect(start).toHaveValue("09:2");
    await expect(start).toHaveFocus();
    await expect(
      within(museum).getByRole("textbox", { name: "End clock for Museum" })
    ).toHaveValue("09:30");

    await user.click(canvas.getByRole("button", { name: "Next day" }));
    await expect(
      canvas.queryByRole("listitem", { name: "Museum" })
    ).not.toBeInTheDocument();
    const pagedAway = new Event("beforeunload", { cancelable: true });
    canvasElement.ownerDocument.defaultView?.dispatchEvent(pagedAway);
    await expect(pagedAway.defaultPrevented).toBe(true);
    await user.click(canvas.getByRole("button", { name: "Previous day" }));
    const restored = await canvas.findByRole("textbox", {
      name: "Start clock for Museum"
    });
    await expect(restored).toHaveValue("09:00");
    await user.click(restored);
    await expect(restored).toHaveValue("09:2");

    await user.keyboard("{Escape}");
    await user.click(refresh);
    await waitFor(() => expect(restored).toHaveValue("10:00"));
    await expect(
      canvas.queryByText(/Newer itinerary data is available/)
    ).not.toBeInTheDocument();
  }
};

export const RefreshKeepsAnOpenBoardNoteAndTabReturnUpdatesTheIdleBoard: Story =
  {
    parameters: {
      savedAttractions: [{ ...SAVED_ATTRACTIONS[0], note: "Original note" }]
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const user = setupUser();
      await user.click(await canvas.findByTitle("Edit note"));
      const note = canvas.getByRole("textbox");
      await user.clear(note);
      await user.type(note, "My unfinished note");

      const newerBoard = [
        {
          ...SAVED_ATTRACTIONS[0],
          note: "New saved note",
          permanentlyClosedAt: "2026-11-20T10:00:00"
        }
      ];
      server.get("http://localhost:8080/trips/1/attractions", () => newerBoard);
      await user.click(
        canvas.getByRole("button", { name: "Refresh trip board" })
      );
      await expect(
        await canvas.findByText(/Newer board data is available/)
      ).toBeVisible();
      await expect(note).toHaveValue("My unfinished note");
      await expect(note).toHaveFocus();

      await user.click(canvas.getByRole("button", { name: "Cancel" }));
      await expect(canvas.getByText("Original note")).toBeVisible();
      const ownerDocument = canvasElement.ownerDocument;
      Object.defineProperty(ownerDocument, "visibilityState", {
        configurable: true,
        value: "visible"
      });
      try {
        fireEvent(ownerDocument, new Event("visibilitychange"));
        await expect(await canvas.findByText("New saved note")).toBeVisible();
        await expect(
          canvas.getByText(/Permanently closed since/)
        ).toBeVisible();
      } finally {
        Reflect.deleteProperty(ownerDocument, "visibilityState");
      }
      await expect(
        canvas.queryByText(/Newer board data is available/)
      ).not.toBeInTheDocument();
    }
  };

export const ADelayedBoardRefreshCannotUndoAConfirmedEdit: Story = {
  parameters: {
    savedAttractions: [{ ...SAVED_ATTRACTIONS[0], note: "Earlier note" }]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const editNote = await canvas.findByTitle("Edit note");
    let saved = [{ ...SAVED_ATTRACTIONS[0], note: "Earlier note" }];
    server.get("http://localhost:8080/trips/1/attractions", () => saved, {
      timing: 1400
    });
    server.put(
      "http://localhost:8080/trips/1/attractions/0/note",
      (_schema, request) => {
        const body: { note: string } = JSON.parse(request.requestBody);
        saved = [{ ...SAVED_ATTRACTIONS[0], note: body.note }];
        return new MirageResponse(204);
      },
      { timing: 0 }
    );

    const refresh = canvas.getByRole("button", { name: "Refresh trip board" });
    await user.click(refresh);
    await expect(refresh).toHaveAttribute("aria-busy", "true");
    await user.click(editNote);
    const note = canvas.getByRole("textbox");
    await user.clear(note);
    await user.type(note, "Confirmed newer note");
    await user.click(canvas.getByRole("button", { name: "Save" }));
    await expect(await canvas.findByText("Confirmed newer note")).toBeVisible();
    await expect(refresh).toHaveAttribute("aria-busy", "true");

    await waitFor(() => expect(refresh).toHaveAttribute("aria-busy", "false"), {
      timeout: 3000
    });
    await expect(canvas.getByText("Confirmed newer note")).toBeVisible();
    await expect(canvas.queryByText("Earlier note")).not.toBeInTheDocument();
  }
};

export const InspectsAnUnconfirmedBoardEditBeforeLeavingTheStep: Story = {
  parameters: {
    configureTripServer: (server: Server) => {
      let saved = SAVED_ATTRACTIONS;
      boardNotes.mockClear();
      server.get("http://localhost:8080/trips/1/attractions", () => saved);
      server.put(
        "http://localhost:8080/trips/1/attractions/0/note",
        (_schema, request) => {
          const body: { note: string } = JSON.parse(request.requestBody);
          boardNotes(body);
          saved = [{ ...SAVED_ATTRACTIONS[0], note: body.note }];
          return new MirageResponse(
            503,
            {},
            {
              errorMessage: "The save couldn't be confirmed."
            }
          );
        },
        { timing: 800 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    await user.click(await canvas.findByRole("button", { name: "+ Add note" }));
    await user.type(canvas.getByRole("textbox"), "Arrive before lunch");
    await user.click(canvas.getByRole("button", { name: "Save" }));
    await canvas.findByText("Saving");

    await user.click(canvas.getByRole("button", { name: "Itinerary" }));
    const departure = await overlay(canvasElement).findByRole("dialog", {
      name: "Leave the current planning change?"
    });
    await waitFor(() =>
      expect(
        within(departure).getByText(/may have reached the trip/)
      ).toBeVisible()
    );
    await expect(
      within(departure).queryByRole("button", { name: "Leave without saving" })
    ).not.toBeInTheDocument();
    await user.click(within(departure).getByRole("button", { name: "Stay" }));
    const feedback = within(
      canvas.getByRole("status", {
        name: "Marked change for Casino of Monte-Carlo"
      })
    );
    await feedback.findByText("The save couldn't be confirmed.");
    await expect(canvas.getByTitle("Unmark must visit")).toBeDisabled();
    await expect(
      canvas.queryByText("Arrive before lunch")
    ).not.toBeInTheDocument();
    const unconfirmedUnload = new Event("beforeunload", { cancelable: true });
    canvasElement.ownerDocument.defaultView?.dispatchEvent(unconfirmedUnload);
    await expect(unconfirmedUnload.defaultPrevented).toBe(true);
    await user.click(
      feedback.getByRole("button", { name: "Reload saved planning" })
    );
    await expect(await canvas.findByText("Arrive before lunch")).toBeVisible();
    await expect(await feedback.findByText("Saved")).toBeVisible();
    await expect(boardNotes).toHaveBeenCalledTimes(1);
    await user.click(canvas.getByRole("button", { name: "Itinerary" }));
    await canvas.findByRole("region", { name: "Itinerary days" });
  }
};

export const ReloadingSavedPlanningAlsoRefreshesUnscheduledAttractions: Story =
  {
    parameters: {
      configureTripServer: (server: Server) => {
        const casino = {
          attractionId: 0,
          name: "Casino of Monte-Carlo",
          place: "Monaco",
          attractionGroup: "PRIMARY",
          mustVisit: false,
          category: "POINT_OF_INTEREST_AND_LANDMARK"
        } as const;
        const saved = itineraryFixture("2099-06-10", "2099-06-24", [
          { ...casino, mustVisit: true }
        ]);
        saved.lastCheckedAt = "2026-11-20T10:00:00Z";
        saved.checkState = "CHANGED_SINCE_LAST_CHECK";
        const responses = [
          itineraryFixture("2099-06-10", "2099-06-24", [casino]),
          new MirageResponse(503),
          saved
        ];
        server.get(
          "http://localhost:8080/trips/1/itinerary",
          () => responses.shift() ?? saved,
          { timing: 0 }
        );
        let mustVisit = false;
        server.get("http://localhost:8080/trips/1/attractions", () => [
          { ...SAVED_ATTRACTIONS[0], mustVisit }
        ]);
        server.put(
          "http://localhost:8080/trips/1/attractions/0/must-visit",
          () => {
            mustVisit = true;
            return new MirageResponse(
              503,
              {},
              { errorMessage: "Save unconfirmed." }
            );
          }
        );
      }
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const user = setupUser();
      await canvas.findByText("Not yet checked");
      await user.click(await canvas.findByTitle("Mark must visit"));
      await canvas.findByText("Save unconfirmed.");

      await user.click(
        canvas.getByRole("button", { name: "Reload saved planning" })
      );
      await canvas.findByText(/Saved planning couldn't be loaded/);
      await expect(canvas.getByTitle("Mark must visit")).toBeDisabled();

      await user.click(
        canvas.getByRole("button", { name: "Reload saved planning" })
      );
      await canvas.findByTitle("Unmark must visit");
      await expect(
        await canvas.findByText("Changed since last check")
      ).toBeVisible();
      await user.click(canvas.getByRole("button", { name: "Itinerary" }));
      const card = await canvas.findByRole("article", {
        name: "Casino of Monte-Carlo"
      });
      await expect(card).toHaveAccessibleDescription(/Must see/);
      await expect(
        canvas.queryByRole("button", { name: "Reload saved planning" })
      ).not.toBeInTheDocument();
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

const savedCasinoEntry = {
  entryId: 21,
  attractionId: 0,
  name: "Casino of Monte-Carlo",
  category: "POINT_OF_INTEREST_AND_LANDMARK",
  attractionGroup: "PRIMARY",
  mustVisit: true,
  fixedStart: true,
  warnings: [],
  timing: {
    start: "2099-06-11T09:00+02:00",
    end: "2099-06-11T09:45+02:00",
    zone: "Europe/Monaco"
  }
} satisfies GetItineraryResponse["days"][number]["entries"][number];

export const RevealsTheBoardCardAndReturnsToItsCurrentItineraryEntry: Story = {
  parameters: {
    savedAttractions: [
      { ...SAVED_ATTRACTIONS[0], mustVisit: false, note: "Original note" },
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 5,
        attractionName: "Garden",
        mustVisit: false
      }
    ],
    configureTripServer: (server: Server) => {
      const saved = itineraryFixture("2099-06-10", "2099-06-24");
      const casinoEntry = {
        ...savedCasinoEntry,
        mustVisit: false,
        tripNote: "Original note"
      };
      saved.days[1].entries.push(casinoEntry);
      server.get(itineraryUrl, () => saved, { timing: 150 });
      server.get("http://localhost:8080/attractions/0", () => ({
        ...museumCatalogue,
        attractionId: 0,
        attractionName: savedCasinoEntry.name
      }));
      server.put(
        "http://localhost:8080/trips/1/attractions/0/note",
        (_schema, request) => {
          const body: UpdateTripAttractionNoteRequest = JSON.parse(
            request.requestBody
          );
          casinoEntry.tripNote = body.note ?? "";
          return new MirageResponse(204);
        }
      );
      server.delete("http://localhost:8080/trips/1/attractions/0", () => {
        saved.days[1].entries = [];
        return new MirageResponse(204);
      });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dialogs = overlay(canvasElement);
    const user = setupUser();
    const name = savedCasinoEntry.name;
    await user.click(
      await canvas.findByRole("button", { name: "Filters on demand" })
    );
    await user.selectOptions(
      canvas.getByRole("combobox", { name: "Must Visit" }),
      "true"
    );
    await expect(canvas.queryByRole("link", { name })).not.toBeInTheDocument();
    await user.click(canvas.getByRole("button", { name: "Collapse Monaco" }));
    await user.click(canvas.getByRole("button", { name: "Itinerary" }));
    await user.click(await canvas.findByRole("button", { name: "Next day" }));

    await user.click(await canvas.findByText("Original note"));
    const facts = within(await dialogs.findByRole("dialog", { name }));
    await user.click(
      facts.getByRole("button", { name: "Edit trip data on board" })
    );
    const cardLink = await canvas.findByRole("link", { name });
    const boardCard = cardLink.closest("li")!;
    await waitFor(() => expect(boardCard).toHaveFocus());
    await expect(
      canvas.getByRole("combobox", { name: "Must Visit" })
    ).toHaveValue("true");
    await expect(
      canvas.queryByRole("link", { name: "Garden" })
    ).not.toBeInTheDocument();

    const card = within(boardCard);
    await user.click(card.getByTitle("Edit note"));
    const note = card.getByRole("textbox", { name: "Trip note" });
    await user.clear(note);
    await user.type(note, "Ask for the exit map");
    await user.click(card.getByRole("button", { name: "Save" }));
    await user.click(
      canvas.getByRole("button", { name: "Return to itinerary" })
    );
    const entry = await canvas.findByRole("button", { name });
    await waitFor(() => expect(entry).toHaveFocus());
    await expect(
      canvas.getByRole("note", { name: "Trip note" })
    ).toHaveTextContent("Ask for the exit map");
    await expect(
      canvas.getByRole("textbox", { name: `Start clock for ${name}` })
    ).toHaveValue("09:00");

    await user.click(entry);
    const updated = within(await dialogs.findByRole("dialog", { name }));
    const trip = within(updated.getByRole("region", { name: "Trip data" }));
    await waitFor(() =>
      expect(trip.getByText("Ask for the exit map")).toBeVisible()
    );
    await user.click(
      updated.getByRole("button", { name: "Edit trip data on board" })
    );
    await user.click(
      await canvas.findByRole("button", { name: `Remove ${name} from trip` })
    );
    const removal = within(await dialogs.findByRole("alertdialog"));
    await waitFor(() =>
      expect(removal.getByText(/Day 2.*09:00.*09:45/)).toBeVisible()
    );
    await user.click(removal.getByRole("button", { name: "Delete" }));
    await user.click(
      await canvas.findByRole("button", { name: "Return to itinerary" })
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("heading", { name: /Jun 11, 2099/ })
      ).toHaveFocus()
    );
    await expect(
      canvas.queryByRole("button", { name })
    ).not.toBeInTheDocument();
  }
};

export const RemovingAScheduledAttractionRequiresItsDayPreview: Story = {
  parameters: {
    savedAttractions: SAVED_ATTRACTIONS,
    configureTripServer: (server: Server) => {
      const saved = itineraryFixture("2099-06-10", "2099-06-24");
      saved.days[1].entries.push(savedCasinoEntry);
      server.get(itineraryUrl, () => saved, { timing: 0 });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const removals = fn();
    server.delete(
      "http://localhost:8080/trips/1/attractions/0",
      (_schema, request) => {
        removals(JSON.parse(request.requestBody || "null"));
        return new MirageResponse(204);
      },
      { timing: 0 }
    );

    const remove = await canvas.findByRole("button", {
      name: "Remove Casino of Monte-Carlo from trip"
    });
    await user.click(remove);
    const dialog = within(
      await overlay(canvasElement).findByRole("alertdialog")
    );
    await waitFor(() =>
      expect(dialog.getByText(/Day 2.*09:00.*09:45/)).toBeVisible()
    );
    await user.click(dialog.getByRole("button", { name: "Cancel" }));

    await expect(remove).toBeVisible();
    await expect(removals).not.toHaveBeenCalled();

    await user.click(remove);
    const reopened = within(
      await overlay(canvasElement).findByRole("alertdialog")
    );
    await waitFor(() =>
      expect(reopened.getByText(/Day 2.*09:00.*09:45/)).toBeVisible()
    );
    await user.click(reopened.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(remove).not.toBeInTheDocument());
    await expect(removals).toHaveBeenCalledTimes(1);
    await expect(removals).toHaveBeenCalledWith({ entryId: 21 });
  }
};

export const ExcludingAScheduledAttractionRequiresReviewingTheChangedPreview: Story =
  {
    parameters: { savedAttractions: SAVED_ATTRACTIONS },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const user = setupUser();
      const parent = overlay(canvasElement);
      const exclusion = fn();
      const saved = itineraryFixture("2099-06-10", "2099-06-24");
      saved.days[1].entries = [savedCasinoEntry];
      server.get(itineraryUrl, () => saved, { timing: 0 });
      const moveUrl = "http://localhost:8080/trips/1/board/attractions/0";
      server.put(
        moveUrl,
        (_schema, request) => {
          exclusion(JSON.parse(request.requestBody));
          saved.days[1].entries = [];
          saved.days[2].entries = [
            {
              ...savedCasinoEntry,
              entryId: 22,
              timing: {
                ...savedCasinoEntry.timing,
                start: "2099-06-12T09:00+02:00",
                end: "2099-06-12T09:45+02:00"
              }
            }
          ];
          return new MirageResponse(
            409,
            {},
            {
              errorCode: "RESOURCE_HAS_DEPENDENCIES",
              errorMessage: "The itinerary consequences changed."
            }
          );
        },
        { timing: 0 }
      );

      await canvas.findByRole("link", { name: "Casino of Monte-Carlo" });
      const source = columnFor(canvasElement, "Top Attractions");
      const excluded = columnFor(canvasElement, "Excluded Attractions");
      const card = (
        await within(source).findByRole("link", {
          name: "Casino of Monte-Carlo"
        })
      ).closest("li.attraction") as HTMLElement;
      const drag = new DataTransfer();
      fireEvent.dragStart(card, { dataTransfer: drag });
      await new Promise((resolve) => setTimeout(resolve, 0));
      fireEvent.drop(excluded, { dataTransfer: drag });
      const dialog = within(await parent.findByRole("alertdialog"));
      await dialog.findByText(/Day 2.*09:00.*09:45/);
      await expect(exclusion).not.toHaveBeenCalled();
      await user.click(
        dialog.getByRole("button", { name: "Move to Excluded" })
      );

      await user.click(
        await canvas.findByRole("button", {
          name: "Review itinerary consequences"
        })
      );
      const renewed = within(await parent.findByRole("alertdialog"));
      await renewed.findByText(/Day 3.*09:00.*09:45/);
      await expect(exclusion).toHaveBeenCalledTimes(1);
      await expect(exclusion).toHaveBeenCalledWith({
        targetGroup: "EXCLUDED",
        previousAttractionId: null,
        nextAttractionId: null,
        itineraryRemoval: { entryId: 21 }
      });
      server.put(
        moveUrl,
        (_schema, request) => {
          exclusion(JSON.parse(request.requestBody));
          saved.days[2].entries = [];
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
      await user.click(
        renewed.getByRole("button", { name: "Move to Excluded" })
      );

      await within(excluded).findByRole("link", {
        name: "Casino of Monte-Carlo"
      });
      await expect(exclusion).toHaveBeenNthCalledWith(2, {
        targetGroup: "EXCLUDED",
        previousAttractionId: null,
        nextAttractionId: null,
        itineraryRemoval: { entryId: 22 }
      });
    }
  };

const casinoAndGardenBoard = [
  ...SAVED_ATTRACTIONS,
  { ...SAVED_ATTRACTIONS[0], attractionId: 5, attractionName: "Garden" }
];

export const RemoveAllKeepsTheScheduledAttractionInTheCity: Story = {
  parameters: {
    savedAttractions: casinoAndGardenBoard,
    configureTripServer: (server: Server) => {
      const saved = itineraryFixture("2099-06-10", "2099-06-24");
      saved.days[1].entries.push(savedCasinoEntry);
      server.get(itineraryUrl, () => saved, { timing: 0 });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const removals = fn();
    server.delete(
      "http://localhost:8080/trips/1/attractions/:attractionId",
      (_schema, request) => {
        removals(request.params.attractionId, request.requestBody);
        return new MirageResponse(204);
      },
      { timing: 0 }
    );

    await user.click(
      await canvas.findByRole("button", {
        name: "Remove all attractions from Monaco"
      })
    );
    const dialog = within(
      await overlay(canvasElement).findByRole("alertdialog")
    );
    await waitFor(() =>
      expect(
        dialog.getByText(/Remove all unscheduled attractions from Monaco/)
      ).toBeVisible()
    );
    await user.click(dialog.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(
        canvas.queryByRole("link", { name: "Garden" })
      ).not.toBeInTheDocument()
    );
    await expect(
      canvas.getByRole("link", { name: "Casino of Monte-Carlo" })
    ).toBeVisible();
    await expect(removals).toHaveBeenCalledTimes(1);
    await expect(removals.mock.calls[0][0]).toBe("5");
    await expect(removals.mock.calls[0][1] || "").toBe("");
  }
};

export const PlanLinksToSavedEntriesAndKeepsTheBoardFilters: Story = {
  parameters: {
    trip: { ...ITINERARY_TRIP, hasItineraryEntries: true },
    savedAttractions: [
      ...SAVED_ATTRACTIONS,
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 5,
        attractionName: "Garden"
      },
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 6,
        attractionName: "Unscheduled Museum",
        mustVisit: false
      }
    ],
    configureTripServer: (server: Server) => {
      const saved = itineraryFixture("2025-06-10", "2025-06-24");
      saved.timeZone = "Europe/Rome";
      saved.days[0].entries.push({
        entryId: 21,
        attractionId: 0,
        name: "Casino of Monte-Carlo",
        category: "POINT_OF_INTEREST_AND_LANDMARK",
        attractionGroup: "PRIMARY",
        mustVisit: true,
        fixedStart: false,
        warnings: [],
        timing: {
          start: "2025-06-10T09:00+02:00",
          end: "2025-06-10T09:45+02:00",
          zone: "Europe/Rome"
        }
      });
      saved.days[10].entries.push({
        entryId: 42,
        attractionId: 5,
        name: "Garden",
        category: "PARK",
        attractionGroup: "PRIMARY",
        mustVisit: true,
        fixedStart: false,
        warnings: [],
        timing: {
          start: "2025-06-20T09:00+02:00",
          end: "2025-06-20T09:45+02:00",
          zone: "Europe/Rome"
        }
      });
      server.get(itineraryUrl, () => saved, { timing: 0 });
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const scheduledStatus = /^Scheduled \u00b7 Day /;
    await canvas.findByRole("link", { name: "Garden" });
    await canvas.findByText("Not yet checked");
    await expect(
      canvas.getByRole("button", { name: "Review" })
    ).toHaveAttribute("aria-current", "step");
    await expect(canvas.queryByText(scheduledStatus)).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "Edit" }));
    await expect(canvas.queryByText(scheduledStatus)).not.toBeInTheDocument();
    const plan = canvas.getByRole("button", { name: "Plan" });
    await user.click(plan);

    const casino = canvas.getByRole("link", { name: "Casino of Monte-Carlo" });
    await expect(
      await within(casino.closest("li")!).findByRole("link", {
        name: "Scheduled \u00b7 Day 1"
      })
    ).toBeVisible();
    const garden = canvas.getByRole("link", { name: "Garden" });
    const status = within(garden.closest("li")!).getByRole("link", {
      name: "Scheduled \u00b7 Day 11"
    });
    const museum = canvas.getByRole("link", { name: "Unscheduled Museum" });
    await expect(
      within(museum.closest("li")!).queryByText(scheduledStatus)
    ).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "Filters on demand" }));
    await user.selectOptions(
      canvas.getByRole("combobox", { name: "Must Visit" }),
      "true"
    );
    status.focus();
    await user.keyboard("{Enter}");
    await expect(
      await canvas.findByRole("heading", { name: "Friday, Jun 20, 2025" })
    ).toBeVisible();
    const entry = canvas.getByRole("listitem", { name: "Garden" });
    await waitFor(() => expect(entry).toHaveFocus());

    await user.click(plan);
    await expect(
      canvas.getByRole("combobox", { name: "Must Visit" })
    ).toHaveValue("true");
    await expect(
      canvas.queryByRole("link", { name: "Unscheduled Museum" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "Scheduled \u00b7 Day 11" })
    ).toBeVisible();
  }
};

const planStatusTrip = {
  ...ITINERARY_TRIP,
  fromDate: "2099-06-10",
  toDate: "2099-06-11"
};

const planStatusUnscheduled: GetItineraryResponse["unscheduledAttractions"] = [
  {
    attractionId: 42,
    name: "Market steps",
    place: "Florence",
    attractionGroup: "SECONDARY",
    mustVisit: false,
    category: "HISTORIC_SITE",
    visitDuration: "45m"
  }
];

export const PlanUpdatesStatusAfterSchedulingAndRefresh: Story = {
  parameters: {
    trip: planStatusTrip,
    savedAttractions: [
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 42,
        attractionName: "Market steps",
        attractionCategory: "HISTORIC_SITE",
        attractionGroup: "SECONDARY",
        mustVisit: false
      }
    ],
    configureTripServer: (server: Server) => {
      const saved = itineraryFixture(
        planStatusTrip.fromDate,
        planStatusTrip.toDate,
        planStatusUnscheduled
      );
      saved.timeZone = "Europe/Rome";
      server.get(itineraryUrl, () => saved, { timing: 0 });
      server.post(
        schedulingUrl,
        () => {
          saved.days[0].entries.push({
            entryId: 51,
            attractionId: 42,
            name: "Market steps",
            category: "HISTORIC_SITE",
            attractionGroup: "SECONDARY",
            mustVisit: false,
            fixedStart: false,
            warnings: [],
            timing: {
              start: "2099-06-10T09:00+02:00",
              end: "2099-06-10T09:45+02:00",
              zone: "Europe/Rome"
            }
          });
          saved.unscheduledAttractions = [];
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const plan = await canvas.findByRole("button", { name: "Plan" });
    await user.click(plan);
    await expect(
      canvas.getByRole("link", { name: "Market steps" })
    ).toBeVisible();
    await expect(
      canvas.queryByText(/^Scheduled \u00b7 Day /)
    ).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "Itinerary" }));
    await user.click(
      await canvas.findByRole("button", { name: "Add Market steps" })
    );
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", {
        name: /Jun 10, 2099/
      })
    );
    const draft = within(
      await canvas.findByRole("form", { name: "Add Market steps" })
    );
    await user.type(draft.getByLabelText("Start clock"), "09:00");
    await user.tab();
    await canvas.findByRole("listitem", { name: "Market steps" });
    await user.click(plan);
    const status = "Scheduled \u00b7 Day 1";
    await expect(
      await canvas.findByRole("link", { name: status })
    ).toBeVisible();

    server.get(itineraryUrl, () => new MirageResponse(503), { timing: 0 });
    const refresh = canvas.getByRole("button", { name: "Refresh trip board" });
    await user.click(refresh);
    await expect(
      await canvas.findByText(/Scheduled status may be out of date/)
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: status })).toBeVisible();

    const updated = itineraryFixture(
      planStatusTrip.fromDate,
      planStatusTrip.toDate,
      planStatusUnscheduled
    );
    updated.timeZone = "Europe/Rome";
    server.get(itineraryUrl, () => updated, { timing: 0 });
    canvasElement.ownerDocument.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() =>
      expect(canvas.queryByText(status)).not.toBeInTheDocument()
    );
    await expect(
      canvas.getByRole("link", { name: "Market steps" })
    ).toBeVisible();
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
  await waitFor(
    () =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Trip Planner"
        })
      ).not.toBeInTheDocument(),
    { timeout: 8000 }
  );
  await within(canvasElement).findByRole("button", { name: "Add attractions" });
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

export const StagesCompletePrepareDraft: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const saves = fn();
    const otherWrites = fn();
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        saves(JSON.parse(request.requestBody));
        return new MirageResponse(204);
      },
      { timing: 0 }
    );
    server.delete(
      "http://localhost:8080/trips/1/attractions/:attractionId",
      otherWrites
    );
    server.put("http://localhost:8080/trips/1/board", otherWrites);

    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");
    await user.click(
      await canvas.findByRole("button", {
        name: "Remove Casino Square from trip"
      })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: "Delete" })
    );
    const header = within(
      canvas.getByRole("region", { name: "Trip overview" })
    );
    await expect(saves).not.toHaveBeenCalled();
    await expect(otherWrites).not.toHaveBeenCalled();
    await expect(boardMoves).not.toHaveBeenCalled();
    await user.click(
      await header.findByRole("button", { name: "Save to trip (2)" })
    );

    await header.findByText("2 changes saved");
    await expect(saves).toHaveBeenCalledTimes(2);
    await expect(saves).toHaveBeenNthCalledWith(1, {
      attractionId: 0,
      attractionGroup: "SECONDARY"
    });
    await expect(saves).toHaveBeenNthCalledWith(2, {
      attractionId: 2,
      attractionGroup: "EXCLUDED"
    });
    await expect(otherWrites).not.toHaveBeenCalled();
    await expect(
      header.queryByRole("button", { name: /Save to trip/ })
    ).not.toBeInTheDocument();
    await expect(
      header.getByRole("button", { name: "Prepare" })
    ).toHaveAttribute("aria-current", "step");
  }
};

export const GuardsLeavingTheWholePrepareDraft: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await searchAndAddCountry(canvasElement, user, "Lith", "Lithuania");
    await user.click(
      await canvas.findByRole("button", {
        name: "Remove Casino of Monte-Carlo from trip"
      })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: "Delete" })
    );
    await user.click(canvas.getByRole("button", { name: "My Trips" }));

    const dialog = within(
      await overlay(canvasElement).findByRole("dialog", {
        name: "Save your Prepare changes?"
      })
    );
    await user.click(dialog.getByRole("button", { name: "Stay" }));
    await expect(
      await canvas.findByRole("button", { name: "Save to trip (2)" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Vilnius Old Town" })
    ).toBeVisible();
    await expect(
      canvas.queryByRole("link", { name: "Casino of Monte-Carlo" })
    ).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "My Trips" }));
    await user.click(
      await overlay(canvasElement).findByRole("button", {
        name: "Leave without saving"
      })
    );
    await expect(await canvas.findByText("My Trips list page")).toBeVisible();
  }
};

export const KeepsRejectedPrepareDraftForCorrection: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const saves = fn();
    const responses = [
      new MirageResponse(400, {}, { errorMessage: "Review this selection." }),
      new MirageResponse(204),
      new MirageResponse(204)
    ];
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        saves(JSON.parse(request.requestBody));
        return responses.shift() ?? new MirageResponse(500);
      },
      { timing: 200 }
    );
    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");
    const edit = await canvas.findByRole("button", { name: "Edit" });
    await user.click(edit);
    await canvas.findAllByText("Review this selection.");
    await expect(
      canvas.getByRole("button", { name: "Prepare" })
    ).toHaveAttribute("aria-current", "step");
    await expect(
      await canvas.findByRole("button", { name: "Save to trip (3)" })
    ).toBeEnabled();

    await user.click(
      canvas.getByRole("button", { name: "Remove Casino Square from trip" })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: "Delete" })
    );
    await user.click(edit);
    await waitFor(() => expect(edit).toHaveAttribute("aria-current", "step"));
    await expect(saves).toHaveBeenCalledTimes(3);
    await expect(saves).toHaveBeenNthCalledWith(2, {
      attractionId: 0,
      attractionGroup: "SECONDARY"
    });
    await expect(saves).toHaveBeenNthCalledWith(3, {
      attractionId: 2,
      attractionGroup: "EXCLUDED"
    });
    await expect(
      canvas.queryByRole("button", { name: "Add attractions" })
    ).not.toBeInTheDocument();
  }
};

export const RetriesPlacementWithoutAddingTheAttractionAgain: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const additions = fn();
    const moves = fn();
    const responses = [
      new MirageResponse(400, {}, { errorMessage: "Review this placement." }),
      new MirageResponse(204)
    ];
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        additions(JSON.parse(request.requestBody));
        return new MirageResponse(204);
      },
      { timing: 0 }
    );
    server.put(
      "http://localhost:8080/trips/1/board/attractions/1",
      (_schema, request) => {
        moves(JSON.parse(request.requestBody));
        return responses.shift() ?? new MirageResponse(500);
      },
      { timing: 0 }
    );

    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");
    await user.click(
      canvas.getByRole("button", { name: "Remove Larvotto Beach from trip" })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: "Delete" })
    );
    const top = columnFor(canvasElement, "Top Attractions");
    const square = within(top)
      .getByRole("link", { name: "Casino Square" })
      .closest("li.attraction") as HTMLElement;
    const dataTransfer = new DataTransfer();
    fireEvent.dragStart(square, { dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.dragOver(top, { clientY: -1, dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.drop(top, { dataTransfer });
    await expect(additions).not.toHaveBeenCalled();
    await expect(moves).not.toHaveBeenCalled();

    await user.click(
      await canvas.findByRole("button", { name: "Save to trip (1)" })
    );
    await canvas.findAllByText(
      /1 of 2 changes saved\. Review this placement\./
    );
    await expect(additions).toHaveBeenCalledTimes(1);
    await expect(additions).toHaveBeenCalledWith({
      attractionId: 1,
      attractionGroup: "PRIMARY"
    });
    await expect(moves).toHaveBeenCalledTimes(1);
    await expect(moves).toHaveBeenCalledWith({
      targetGroup: "PRIMARY",
      previousAttractionId: null,
      nextAttractionId: 0
    });
    const retry = await canvas.findByRole("button", {
      name: "Save to trip (1)"
    });
    await expect(retry).toBeEnabled();
    await expect(
      Array.from(top.querySelectorAll("li.attraction")).map((card) =>
        card.getAttribute("data-id")
      )
    ).toEqual(["1", "0"]);

    await user.click(retry);
    await waitFor(() => expect(moves).toHaveBeenCalledTimes(2));
    await expect(moves.mock.calls[1]).toEqual(moves.mock.calls[0]);
    await expect(additions).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: /Save to trip/ })
      ).not.toBeInTheDocument()
    );
  }
};

export const InspectsSavedTripBeforeResubmittingUnconfirmedPrepare: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const saves = fn();
    const responses = [
      new MirageResponse(500, {}, { errorMessage: "Save not confirmed." }),
      new MirageResponse(204)
    ];
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        saves(JSON.parse(request.requestBody));
        return responses.shift() ?? new MirageResponse(500);
      },
      { timing: 0 }
    );
    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await searchAndAddCountry(canvasElement, user, "Lith", "Lithuania");
    await user.click(canvas.getByRole("button", { name: "Save to trip (1)" }));
    await canvas.findAllByText("Save not confirmed.");
    const save = await canvas.findByRole("button", {
      name: "Save to trip (1)"
    });
    await expect(save).toBeDisabled();
    await expect(
      canvas.getByRole("link", { name: "Vilnius Old Town" })
    ).toBeVisible();
    await user.click(
      canvas.getAllByRole("button", { name: "Reload saved planning" })[0]
    );
    const inspection = within(
      await overlay(canvasElement).findByRole("dialog", {
        name: "Inspect saved trip"
      })
    );
    await waitFor(() =>
      expect(inspection.getByText("Casino of Monte-Carlo")).toBeVisible()
    );
    await expect(
      inspection.queryByText("Vilnius Old Town")
    ).not.toBeInTheDocument();
    await expect(saves).toHaveBeenCalledTimes(1);
    await user.click(
      await inspection.findByRole("button", { name: "Keep draft" })
    );
    await expect(
      await canvas.findByRole("link", { name: "Vilnius Old Town" })
    ).toBeVisible();
    await expect(save).toBeEnabled();
    await expect(saves).toHaveBeenCalledTimes(1);

    await user.click(save);
    await waitFor(() => expect(saves).toHaveBeenCalledTimes(2));
    await canvas.findByText("1 change saved");
  }
};

export const ReaddingAStagedRemovalRestoresTripData: Story = {
  parameters: {
    savedAttractions: [
      {
        ...SAVED_ATTRACTIONS[0],
        mustVisit: false,
        note: "Keep my trip note."
      }
    ],
    configureTripServer: (server: Server) => {
      const saved = itineraryFixture("2099-06-10", "2099-06-24");
      saved.days[1].entries.push({ ...savedCasinoEntry, mustVisit: false });
      server.get(itineraryUrl, () => saved, { timing: 0 });
    }
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await user.click(
      canvas.getByRole("button", {
        name: "Remove Casino of Monte-Carlo from trip"
      })
    );
    const removal = within(
      await overlay(canvasElement).findByRole("alertdialog")
    );
    await removal.findByText(/Day 2.*09:00.*09:45/);
    await user.click(removal.getByRole("button", { name: "Delete" }));
    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");

    await expect(
      within(columnFor(canvasElement, "Top Attractions")).getByRole("link", {
        name: "Casino of Monte-Carlo"
      })
    ).toBeVisible();
    await expect(canvas.getByText("Keep my trip note.")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Save to trip (2)" })
    ).toBeVisible();

    const square = canvas
      .getByRole("link", { name: "Casino Square" })
      .closest("li.attraction") as HTMLElement;
    const dataTransfer = new DataTransfer();
    fireEvent.dragStart(square, { dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.drop(columnFor(canvasElement, "Secondary Spots"), {
      dataTransfer
    });
    await user.click(
      canvas.getByRole("button", { name: "Remove Casino Square from trip" })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: "Delete" })
    );
    await expect(
      await canvas.findByRole("button", { name: "Save to trip (1)" })
    ).toBeVisible();

    await user.click(
      canvas.getByRole("button", { name: "Remove Larvotto Beach from trip" })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: "Delete" })
    );
    await expect(await canvas.findByText("All changes saved")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: /Save to trip/ })
    ).not.toBeInTheDocument();
    await expect(canvas.getByText("Keep my trip note.")).toBeVisible();
    await user.click(canvas.getByRole("button", { name: "Edit" }));
    await user.click(canvas.getByRole("button", { name: "Plan" }));
    await expect(
      await canvas.findByRole("link", { name: /Scheduled .*Day 2/ })
    ).toBeVisible();
  }
};

export const LeavesOnlyTheUnsavedPrepareRemovalBehind: Story = {
  parameters: { savedAttractions: casinoAndGardenBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const parent = overlay(canvasElement);
    const saved = itineraryFixture("2099-06-10", "2099-06-24");
    saved.days[1].entries = [savedCasinoEntry];
    saved.days[2].entries = [
      {
        ...savedCasinoEntry,
        entryId: 22,
        attractionId: 5,
        name: "Garden",
        timing: {
          ...savedCasinoEntry.timing,
          start: "2099-06-12T11:00+02:00",
          end: "2099-06-12T11:45+02:00"
        }
      }
    ];
    server.get(itineraryUrl, () => saved, { timing: 0 });
    const removals = fn();
    server.delete(
      "http://localhost:8080/trips/1/attractions/0",
      (_schema, request) => {
        removals("0", JSON.parse(request.requestBody || "null"));
        saved.days[1].entries = [];
        return new MirageResponse(204);
      },
      { timing: 0 }
    );
    server.delete(
      "http://localhost:8080/trips/1/attractions/5",
      (_schema, request) => {
        removals("5", JSON.parse(request.requestBody || "null"));
        return new MirageResponse(
          400,
          {},
          { errorMessage: "Garden could not be removed." }
        );
      },
      { timing: 0 }
    );

    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await user.click(
      await canvas.findByRole("button", {
        name: "Remove Casino of Monte-Carlo from trip"
      })
    );
    const casino = within(await parent.findByRole("alertdialog"));
    await casino.findByText(/Day 2.*09:00.*09:45/);
    await user.click(casino.getByRole("button", { name: "Delete" }));
    await user.click(
      canvas.getByRole("button", { name: "Remove Garden from trip" })
    );
    const garden = within(await parent.findByRole("alertdialog"));
    await garden.findByText(/Day 3.*11:00.*11:45/);
    await user.click(garden.getByRole("button", { name: "Delete" }));
    await expect(
      await canvas.findByRole("button", { name: "Save to trip (2)" })
    ).toBeVisible();
    await expect(removals).not.toHaveBeenCalled();

    await user.click(canvas.getByRole("button", { name: "Edit" }));
    await canvas.findByRole("button", { name: "Save to trip (1)" });
    await expect(removals).toHaveBeenNthCalledWith(1, "0", { entryId: 21 });
    await expect(removals).toHaveBeenNthCalledWith(2, "5", { entryId: 22 });

    await user.click(canvas.getByRole("button", { name: "My Trips" }));
    const leave = within(
      await parent.findByRole("dialog", { name: "Save your Prepare changes?" })
    );
    await user.click(
      leave.getByRole("button", { name: "Leave without saving" })
    );
    await expect(await canvas.findByText("My Trips list page")).toBeVisible();
    await expect(removals).toHaveBeenCalledTimes(2);
  }
};

export const PrepareDisclosesAndRemovesASharedTransferOnlyOnce: Story = {
  parameters: { savedAttractions: casinoAndGardenBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parent = overlay(canvasElement);
    const user = setupUser();
    const saved = itineraryFixture("2099-06-10", "2099-06-24");
    const transfer: ItineraryTransferDto = {
      fromEntryId: 21,
      toEntryId: 22,
      mode: "BUS",
      minutes: 25
    };
    saved.days[1].entries = [
      { ...savedCasinoEntry, outgoingTransfer: transfer },
      {
        ...savedCasinoEntry,
        entryId: 22,
        attractionId: 5,
        name: "Garden",
        timing: {
          ...savedCasinoEntry.timing,
          start: "2099-06-11T11:00+02:00",
          end: "2099-06-11T11:45+02:00"
        }
      }
    ];
    server.get(itineraryUrl, () => saved, { timing: 0 });
    const removals = fn();
    server.delete(
      "http://localhost:8080/trips/1/attractions/:attractionId",
      (_schema, request) => {
        removals(request.params.attractionId, JSON.parse(request.requestBody));
        saved.days[1].entries.shift();
        return new MirageResponse(204);
      },
      { timing: 0 }
    );

    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await user.click(
      await canvas.findByRole("button", {
        name: "Remove Casino of Monte-Carlo from trip"
      })
    );
    const casino = within(await parent.findByRole("alertdialog"));
    await waitFor(() =>
      expect(casino.getByText("Casino of Monte-Carlo to Garden")).toBeVisible()
    );
    await expect(casino.getByText("Bus · 25m")).toBeVisible();
    await user.click(casino.getByRole("button", { name: "Delete" }));

    await user.click(
      await canvas.findByRole("button", { name: "Remove Garden from trip" })
    );
    const garden = within(await parent.findByRole("alertdialog"));
    await waitFor(() =>
      expect(garden.getByText("Casino of Monte-Carlo to Garden")).toBeVisible()
    );
    await user.click(garden.getByRole("button", { name: "Delete" }));
    await expect(removals).not.toHaveBeenCalled();

    await user.click(
      await canvas.findByRole("button", { name: "Save to trip (2)" })
    );
    await waitFor(() => expect(removals).toHaveBeenCalledTimes(2));
    await expect(removals).toHaveBeenNthCalledWith(1, "0", {
      entryId: 21,
      transfersToRemove: [transfer]
    });
    await expect(removals).toHaveBeenNthCalledWith(2, "5", {
      entryId: 22,
      transfersToRemove: []
    });
  }
};

export const NewTripNotesDoNotCopyCatalogueTips: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    await searchAndAddCountry(canvasElement, user, "Lith", "Lithuania");
    const edit = canvas.getByRole("button", { name: "Edit" });
    await user.click(edit);
    await waitFor(() => expect(edit).toHaveAttribute("aria-current", "step"));
    const card = within(
      canvas
        .getByRole("link", { name: "Vilnius Old Town" })
        .closest("li.attraction") as HTMLElement
    );
    await expect(
      await card.findByRole("button", { name: "+ Add note" })
    ).toBeVisible();
    await expect(
      card.getByRole("note", { name: "Catalogue tip" })
    ).toHaveTextContent("There are no hard rules for tipping");
  }
};

export const EmptySavedTripNotesDoNotFallBackToCatalogueTips: Story = {
  parameters: {
    savedAttractions: [
      { ...SAVED_ATTRACTIONS[0], note: null, tip: "Catalogue advice" }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = within(
      (
        await canvas.findByRole("link", { name: "Casino of Monte-Carlo" })
      ).closest("li.attraction") as HTMLElement
    );
    await expect(
      await card.findByRole("button", { name: "+ Add note" })
    ).toBeVisible();
    await expect(
      card.getByRole("note", { name: "Catalogue tip" })
    ).toHaveTextContent("Catalogue advice");
  }
};

export const IdenticalCatalogueTipsAndTripNotesRemainSeparate: Story = {
  parameters: {
    savedAttractions: [
      {
        ...SAVED_ATTRACTIONS[0],
        note: "Catalogue advice",
        tip: "Catalogue advice"
      }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("note", { name: "Catalogue tip" })
    ).toHaveTextContent("Catalogue advice");
    await expect(
      canvas.getByRole("note", { name: "Trip note" })
    ).toHaveTextContent("Catalogue advice");
    await expect(canvas.getAllByText("Catalogue advice")).toHaveLength(2);
  }
};

export const FormSaveShortcutAndPendingEditUseOnePrepareSave: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const saves = fn();
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        saves(JSON.parse(request.requestBody));
        return new MirageResponse(204);
      },
      { timing: 200 }
    );
    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");
    const modal = within(await openSearchForAttraction(canvasElement, user));
    await user.type(modal.getByRole("textbox"), "Lith");
    await user.click(await modal.findByRole("menuitem", { name: "Lithuania" }));
    const update = modal.getByRole("button", { name: "Update" });
    await waitFor(() => expect(update).toBeEnabled());
    update.focus();
    await user.keyboard("{Control>}s{/Control}");
    await canvas.findByRole("button", { name: "Save to trip (4)" });
    await expect(saves).not.toHaveBeenCalled();

    const unsavedUnload = new Event("beforeunload", { cancelable: true });
    canvasElement.ownerDocument.defaultView?.dispatchEvent(unsavedUnload);
    await expect(unsavedUnload.defaultPrevented).toBe(true);

    await user.keyboard("{Control>}s{/Control}");
    await canvas.findByRole("button", { name: "Saving..." });
    const edit = canvas.getByRole("button", { name: "Edit" });
    await user.click(edit);
    await expect(
      canvas.getByRole("button", { name: "Prepare" })
    ).toHaveAttribute("aria-current", "step");
    await waitFor(() => expect(edit).toHaveAttribute("aria-current", "step"), {
      timeout: 3000
    });
    await expect(saves).toHaveBeenCalledTimes(4);
    await expect(
      new Set(saves.mock.calls.map(([body]) => body.attractionId)).size
    ).toBe(4);
    const savedUnload = new Event("beforeunload", { cancelable: true });
    canvasElement.ownerDocument.defaultView?.dispatchEvent(savedUnload);
    await expect(savedUnload.defaultPrevented).toBe(false);
  }
};

export const SavesPrepareBeforeUsingAppNavigation: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const saves = fn();
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        saves(JSON.parse(request.requestBody));
        return new MirageResponse(204);
      },
      { timing: 500 }
    );
    await searchAndAddCountry(canvasElement, user, "Lith", "Lithuania");
    await user.click(canvas.getByRole("button", { name: "Trip Trove" }));
    const dialog = within(
      await overlay(canvasElement).findByRole("dialog", {
        name: "Save your Prepare changes?"
      })
    );
    await user.click(dialog.getByRole("button", { name: "Save to trip" }));
    await expect(
      await dialog.findByRole("button", { name: "Saving..." })
    ).toBeDisabled();
    await expect(
      dialog.getByRole("button", { name: "Leave without saving" })
    ).toBeDisabled();
    await expect(canvas.queryByText("Home page")).not.toBeInTheDocument();
    await expect(await canvas.findByText("Home page")).toBeVisible();
    await expect(saves).toHaveBeenCalledTimes(1);
  }
};

export const InspectionRecognisesAnAlreadyCommittedPrepare: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const saves = fn();
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        saves(JSON.parse(request.requestBody));
        return new MirageResponse(500, {}, { errorMessage: "Reply lost." });
      },
      { timing: 0 }
    );
    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await searchAndAddCountry(canvasElement, user, "Lith", "Lithuania");
    server.get(
      "http://localhost:8080/trips/1/attractions",
      () => [
        ...SAVED_ATTRACTIONS,
        {
          ...SAVED_ATTRACTIONS[0],
          attractionId: 3,
          attractionName: "Vilnius Old Town",
          cityName: "Vilnius",
          countryName: "Lithuania",
          regionName: "Vilnius",
          note: null
        }
      ],
      { timing: 0 }
    );
    await user.click(canvas.getByRole("button", { name: "Save to trip (1)" }));
    await canvas.findAllByText("Reply lost.");
    await user.click(
      canvas.getAllByRole("button", { name: "Reload saved planning" })[0]
    );
    const inspection = within(
      await overlay(canvasElement).findByRole("dialog", {
        name: "Inspect saved trip"
      })
    );
    await waitFor(() =>
      expect(inspection.getByText("Vilnius Old Town")).toBeVisible()
    );
    await user.click(
      await inspection.findByRole("button", { name: "Keep draft" })
    );
    await canvas.findByText("All changes saved");
    await user.keyboard("{Control>}s{/Control}");
    await expect(saves).toHaveBeenCalledTimes(1);
    await expect(
      canvas.queryByRole("button", { name: /Save to trip/ })
    ).not.toBeInTheDocument();
  }
};

export const ReaddingACollectionRestoresSavedPlaceAndCardOrder: Story = {
  parameters: {
    savedAttractions: [
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 2,
        attractionName: "Larvotto Beach"
      },
      { ...SAVED_ATTRACTIONS[0], note: "Keep my trip note." },
      {
        ...SAVED_ATTRACTIONS[0],
        attractionId: 3,
        attractionName: "Vilnius Old Town",
        cityName: "Vilnius",
        regionName: "Vilnius",
        countryName: "Lithuania"
      }
    ]
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await user.click(
      canvas.getByRole("button", { name: "Remove all attractions from Monaco" })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: "Delete" })
    );
    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");
    await expect(
      canvas
        .getAllByRole("heading", { name: /^(Monaco|Vilnius)$/ })
        .map((heading) => heading.textContent)
    ).toEqual(["Monaco", "Vilnius"]);
    const monaco = within(
      canvas
        .getByRole("heading", { name: /^Monaco$/ })
        .closest(".city-group") as HTMLElement
    );
    const top = within(
      monaco
        .getByRole("heading", { name: "Top Attractions" })
        .closest(".attraction-board-column") as HTMLElement
    );
    await expect(
      top.getAllByRole("link").map((link) => link.textContent)
    ).toEqual(["Larvotto Beach", "Casino of Monte-Carlo", "Casino Square"]);
    await expect(monaco.getByText("Keep my trip note.")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Save to trip (1)" })
    ).toBeVisible();
  }
};

export const ChangingStepsWaitsForAnExistingPlanningChange: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    server.put(
      "http://localhost:8080/trips/1/attractions/0/note",
      () => new MirageResponse(204),
      { timing: 800 }
    );
    const card = within(
      (
        await canvas.findByRole("link", { name: "Casino of Monte-Carlo" })
      ).closest("li.attraction") as HTMLElement
    );
    await user.click(card.getByRole("button", { name: "+ Add note" }));
    await user.type(card.getByRole("textbox"), "Save before switching steps");
    await user.click(card.getByRole("button", { name: "Save" }));
    await card.findByText("Saving");
    const pendingUnload = new Event("beforeunload", { cancelable: true });
    canvasElement.ownerDocument.defaultView?.dispatchEvent(pendingUnload);
    await expect(pendingUnload.defaultPrevented).toBe(true);

    const edit = canvas.getByRole("button", { name: "Edit" });
    const plan = canvas.getByRole("button", { name: "Plan" });
    await user.click(plan);
    await expect(edit).toHaveAttribute("aria-current", "step");
    await waitFor(() => expect(plan).toHaveAttribute("aria-current", "step"));
    await expect(card.getByText("Save before switching steps")).toBeVisible();

    await user.click(edit);
    await user.click(card.getByTitle("Edit note"));
    await user.clear(card.getByRole("textbox"));
    await user.type(card.getByRole("textbox"), "Save before preparing");
    await user.click(card.getByRole("button", { name: "Save" }));
    await card.findByText("Saving");
    const prepare = canvas.getByRole("button", { name: "Prepare" });
    await user.click(prepare);
    await expect(edit).toHaveAttribute("aria-current", "step");
    await waitFor(() =>
      expect(prepare).toHaveAttribute("aria-current", "step")
    );
    await expect(card.getByText("Save before preparing")).toBeVisible();
  }
};

export const LeavingWaitsForRejectionAndKeepsTheBoardProposal: Story = {
  parameters: {
    savedAttractions: [{ ...SAVED_ATTRACTIONS[0], note: "Saved trip note" }],
    configureTripServer: (server: Server) => {
      server.put(
        "http://localhost:8080/trips/1/attractions/0/note",
        () => new MirageResponse(400, {}, { errorMessage: "Revise the note." }),
        { timing: 500 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    await user.click(await canvas.findByTitle("Edit note"));
    await user.clear(canvas.getByRole("textbox"));
    await user.type(canvas.getByRole("textbox"), "Keep this proposal");
    await user.click(canvas.getByRole("button", { name: "Save" }));
    await canvas.findByText("Saving");
    await user.click(canvas.getByRole("button", { name: "My Trips" }));
    await expect(canvas.getByText("Saved trip note")).toBeVisible();
    await expect(
      canvas.queryByText("My Trips list page")
    ).not.toBeInTheDocument();

    const dialog = await overlay(canvasElement).findByRole("dialog", {
      name: "Leave the current planning change?"
    });
    await user.click(within(dialog).getByRole("button", { name: "Stay" }));
    await expect(await canvas.findByText("Revise the note.")).toBeVisible();
    await expect(canvas.getByText("Saved trip note")).toBeVisible();
    await user.click(canvas.getByTitle("Edit note"));
    await expect(canvas.getByRole("textbox")).toHaveValue("Keep this proposal");

    await user.click(canvas.getByRole("button", { name: "My Trips" }));
    await user.click(
      await overlay(canvasElement).findByRole("button", {
        name: "Leave without saving"
      })
    );
    await expect(await canvas.findByText("My Trips list page")).toBeVisible();
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

const PREPARE_ATTRACTIONS = Array.from({ length: 450 }, (_, index) => ({
  ...LOCATION_ATTRACTION,
  attractionId: index + 1001,
  attractionName: `Prepared landmark ${index + 1}`,
  cityName: "Monaco"
}));

const servePrepareAttractions = (
  attractions: GetSearchAttractionResponse[]
): void => {
  server.get(
    "http://localhost:8080/search/country/:id/attractions",
    (_schema, request) => {
      const anchor = attractions.findIndex(
        (attraction) =>
          String(attraction.attractionId) === request.queryParams.attractionId
      );
      return attractions.slice(anchor + 1, anchor + 201);
    },
    { timing: 0 }
  );
};

export const ResumesOnlyTheRemainingPrepareChanges: Story = {
  parameters: {
    savedAttractions: PREPARE_ATTRACTIONS.slice(0, 447).map((attraction) => ({
      ...attraction,
      attractionGroup: "PRIMARY",
      status: "PLANNED"
    }))
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const saves: AddAttractionUnderTripRequest[] = [];
    const responses = [
      new MirageResponse(204),
      new MirageResponse(204),
      new MirageResponse(400, {}, { errorMessage: "Review this attraction." }),
      new MirageResponse(204)
    ];
    servePrepareAttractions(PREPARE_ATTRACTIONS);
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        saves.push(JSON.parse(request.requestBody));
        return responses.shift() ?? new MirageResponse(500);
      },
      { timing: 0 }
    );

    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");
    await user.click(
      await canvas.findByRole("button", { name: "Save to trip (3)" })
    );
    await waitFor(() => expect(saves).toHaveLength(3), {
      timeout: 15000
    });
    await canvas.findAllByText(
      /2 of 3 changes saved\. Review this attraction\./,
      {},
      { timeout: 8000 }
    );
    const retry = await canvas.findByRole("button", {
      name: "Save to trip (1)"
    });
    await expect(retry).toBeEnabled();
    await expect(saves).toHaveLength(3);
    await expect(saves.slice(0, 2).map((body) => body.attractionId)).toEqual(
      PREPARE_ATTRACTIONS.slice(447, 449).map((item) => item.attractionId)
    );

    await user.click(retry);
    await canvas.findByText("1 change saved", {}, { timeout: 8000 });
    await expect(saves).toHaveLength(4);
    await expect(saves[3]).toEqual(saves[2]);
    await expect(saves.slice(3).map((body) => body.attractionId)).toEqual(
      PREPARE_ATTRACTIONS.slice(449).map((item) => item.attractionId)
    );
    await expect(
      canvas.queryByRole("button", { name: /Save to trip/ })
    ).not.toBeInTheDocument();
  }
};

export const InspectsAnUnconfirmedAdditionBeforeSavingTheRemaining50: Story = {
  parameters: {
    savedAttractions: PREPARE_ATTRACTIONS.slice(0, 398).map((attraction) => ({
      ...attraction,
      attractionGroup: "PRIMARY",
      status: "PLANNED"
    }))
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    const saves: AddAttractionUnderTripRequest[] = [];
    const responses = [
      new MirageResponse(204),
      new MirageResponse(500, {}, { errorMessage: "Reply lost." }),
      ...Array.from({ length: 50 }, () => new MirageResponse(204))
    ];
    servePrepareAttractions(PREPARE_ATTRACTIONS);
    server.post(
      "http://localhost:8080/trips/1/attractions",
      (_schema, request) => {
        saves.push(JSON.parse(request.requestBody));
        return responses.shift() ?? new MirageResponse(500);
      },
      { timing: 0 }
    );

    await user.click(await canvas.findByRole("button", { name: "Prepare" }));
    await searchAndAddCountry(canvasElement, user, "Mon", "Monaco");
    server.get(
      "http://localhost:8080/trips/1/attractions",
      () =>
        PREPARE_ATTRACTIONS.slice(0, 400).map((attraction) => ({
          ...attraction,
          attractionGroup: "PRIMARY",
          status: "PLANNED"
        })),
      { timing: 0 }
    );
    await user.click(
      await canvas.findByRole("button", { name: "Save to trip (52)" })
    );
    await waitFor(() => expect(saves).toHaveLength(2), {
      timeout: 15000
    });
    await canvas.findAllByText(/Reply lost\./, {}, { timeout: 8000 });
    await expect(
      await canvas.findByRole(
        "button",
        { name: "Save to trip (51)" },
        { timeout: 8000 }
      )
    ).toBeDisabled();
    await expect(saves).toHaveLength(2);

    await user.click(
      canvas.getAllByRole("button", { name: "Reload saved planning" })[0]
    );
    const inspection = within(
      await overlay(canvasElement).findByRole("dialog", {
        name: "Inspect saved trip"
      })
    );
    await inspection.findByText("Prepared landmark 400", {}, { timeout: 8000 });
    await user.click(
      await inspection.findByRole("button", { name: "Keep draft" })
    );
    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("dialog", {
          name: "Inspect saved trip"
        })
      ).not.toBeInTheDocument()
    );
    await expect(saves).toHaveLength(2);
    const save = await canvas.findByRole(
      "button",
      { name: "Save to trip (50)" },
      { timeout: 8000 }
    );
    await expect(save).toBeEnabled();

    await user.click(save);
    await waitFor(() => expect(saves).toHaveLength(52), { timeout: 8000 });
    await canvas.findByText("50 changes saved", {}, { timeout: 8000 });
    await expect(saves.slice(2).map((body) => body.attractionId)).toEqual(
      PREPARE_ATTRACTIONS.slice(400).map((item) => item.attractionId)
    );
  }
};

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
    await user.click(canvas.getByRole("button", { name: "Prepare" }));
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
    await switchModeWithShortcut(canvasElement, user, "3", /Itinerary/);
    await switchModeWithShortcut(canvasElement, user, "4", /Plan/);
    await switchModeWithShortcut(canvasElement, user, "5", /Review/);
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
