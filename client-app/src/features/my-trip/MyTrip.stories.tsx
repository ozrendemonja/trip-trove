import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import makeServer from "../../ServerSetup";
import { MyTrip } from "./MyTrip";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

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
let server: ReturnType<typeof makeServer> | undefined;

const meta: Meta<typeof MyTrip> = {
  component: MyTrip,
  decorators: [
    (Story, context) => {
      server?.shutdown();
      server = makeServer();
      // A story can pre-seed the trip's saved attractions; MyTrip fetches these
      // on mount and lands the Board in "edit" mode when any exist.
      const saved = context.parameters.savedAttractions;
      if (saved) {
        server.get("http://localhost:8080/trips/:id/attractions", () => saved);
      }
      const initialTripId = context.parameters.initialTripId ?? TRIP_ID;
      return (
        <>
          <MemoryRouter initialEntries={[`/my-trips/${initialTripId}`]}>
            <Routes>
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

// Fluent's Modal portals its content into a Layer appended to document.body,
// outside the story canvas, so modal content is queried through the document.
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
  return heading.closest(".ms-Modal") as HTMLElement;
};

const waitForPrepareMode = (canvasElement: HTMLElement): Promise<void> =>
  waitFor(
    () => {
      expect(
        within(canvasElement).getByRole("button", { name: /Prepare/ })
      ).toHaveClass("mode-btn-active");
    },
    { timeout: 3000 }
  );

export const Primary: Story = {};

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

export const LandsInEditModeWhenTripHasSavedAttractions: Story = {
  parameters: { savedAttractions: SAVED_ATTRACTIONS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole(
      "button",
      { name: "Remove Casino of Monte-Carlo from trip" },
      { timeout: 5000 }
    );

    await expect(canvas.getByRole("button", { name: /Edit/ })).toHaveClass(
      "mode-btn-active"
    );
    await expect(
      canvas.getByRole("button", { name: /Prepare/ })
    ).not.toHaveClass("mode-btn-active");
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

    await expect(canvas.getByRole("button", { name: /Edit/ })).toHaveClass(
      "mode-btn-active"
    );
    await expect(
      canvas.queryByRole("button", { name: /Save to trip/ })
    ).not.toBeInTheDocument();
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
    await expect(modal.getByRole("button", { name: "Update" })).toBeDisabled();
  }
};

export const ShowsDefaultNameWhenTripNotFound: Story = {
  parameters: { initialTripId: "999" },
  play: async ({ canvasElement }) => {
    await waitForPrepareMode(canvasElement);
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { name: "Trip Planner" })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("heading", { name: "Italy" })
    ).not.toBeInTheDocument();
  }
};

export const SwitchingSearchOptionMovesSelectedHighlight: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modalElement = await openSearchForAttraction(canvasElement, user);
    const modal = within(modalElement);

    /* eslint-disable jest-dom/prefer-to-have-class -- Fluent generates hashed
       class names, so assert on the class-name substring instead. */
    // Country is selected by default.
    await expect(
      modal.getByRole("button", { name: "Country" }).className
    ).toContain("selectedSearchOption");
    await user.click(modal.getByRole("button", { name: "Region" }));
    await waitFor(() =>
      expect(modal.getByRole("button", { name: "Region" }).className).toContain(
        "selectedSearchOption"
      )
    );
    await expect(
      modal.getByRole("button", { name: "Country" }).className
    ).toContain("notSelectedSearchOption");
    /* eslint-enable jest-dom/prefer-to-have-class */
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

// Presses Alt+<digit> and waits for the matching mode button to become active.
// The Board's keydown handler lives on window, so no element needs focus first.
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
    ).toHaveClass("mode-btn-active")
  );
};

export const SwitchesBoardModesWithAltNumberShortcuts: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForPrepareMode(canvasElement);

    await switchModeWithShortcut(canvasElement, user, "2", /Edit/);
    await switchModeWithShortcut(canvasElement, user, "3", /Plan/);
    await switchModeWithShortcut(canvasElement, user, "4", /Review/);
    await switchModeWithShortcut(canvasElement, user, "1", /Prepare/);

    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /Edit/ })).not.toHaveClass(
      "mode-btn-active"
    );
    await expect(canvas.getByRole("button", { name: /Plan/ })).not.toHaveClass(
      "mode-btn-active"
    );
    await expect(
      canvas.getByRole("button", { name: /Review/ })
    ).not.toHaveClass("mode-btn-active");
  }
};
