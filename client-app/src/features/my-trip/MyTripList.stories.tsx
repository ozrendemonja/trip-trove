import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, fireEvent, userEvent, waitFor, within } from "@storybook/test";
import makeServer from "../../ServerSetup";
import { GetTripResponse } from "../../clients/manager";
import MyTripList from "./MyTripList";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

// A trip's tab (active / past / archived) is derived from its end date relative
// to the real clock (TripApi.computeStatus), so fixtures pin the status with a
// far-future end date (active), a far-past one (past) or the archived flag. This
// keeps every play story deterministic regardless of when the test runs.
const activeTrip = (
  tripId: number,
  tripName: string,
  fromDate = "2099-06-10",
  toDate = "2099-06-24"
): GetTripResponse => ({
  tripId,
  tripName,
  fromDate,
  toDate,
  changedOn: "2026-03-01T10:00:00.0000000"
});

const pastTrip = (tripId: number, tripName: string): GetTripResponse => ({
  tripId,
  tripName,
  fromDate: "2000-01-01",
  toDate: "2000-01-15",
  changedOn: "2000-02-01T10:00:00.0000000"
});

const archivedTrip = (tripId: number, tripName: string): GetTripResponse => ({
  tripId,
  tripName,
  fromDate: "2024-05-01",
  toDate: "2024-05-15",
  archived: true,
  changedOn: "2024-06-01T10:00:00.0000000"
});

const TWO_ACTIVE_TRIPS: GetTripResponse[] = [
  activeTrip(1, "Italy"),
  activeTrip(2, "Japan Adventure")
];

const MIXED_STATUS_TRIPS: GetTripResponse[] = [
  activeTrip(1, "Italy"),
  activeTrip(2, "Japan Adventure"),
  pastTrip(3, "Road Trip USA"),
  pastTrip(4, "Autumn Getaway"),
  archivedTrip(5, "Old Europe Tour"),
  archivedTrip(6, "College Backpacking")
];

// Kept across renders so a previous story's Mirage instance is torn down before
// the next one starts; stacked Pretender instances corrupt subsequent requests.
let server: ReturnType<typeof makeServer> | undefined;

const meta: Meta<typeof MyTripList> = {
  component: MyTripList,
  decorators: [
    (Story, context) => {
      server?.shutdown();
      server = makeServer();
      // A story can replace the default seeds with its own deterministic trips;
      // the real Mirage routes then serve/mutate them for create/edit/delete.
      const trips = context.parameters.trips as GetTripResponse[] | undefined;
      if (trips) {
        server.db.trips.remove();
        server.db.trips.insert(trips);
      }
      return (
        <>
          <MemoryRouter initialEntries={["/my-trips"]}>
            <Routes>
              <Route path="/my-trips" element={<Story />} />
              <Route
                path="/my-trips/:tripId"
                element={
                  <div style={{ padding: 40 }}>Trip Planner (navigated)</div>
                }
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

type Story = StoryObj<typeof MyTripList>;

type User = ReturnType<typeof userEvent.setup>;

// Fluent modals/callouts briefly set pointer-events: none while animating, so
// disable user-event's interactability guard and click instantly.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// Fluent's Modal/Dialog portal their content into a Layer appended to
// document.body, outside the story canvas, so query them through the document.
const overlay = (canvasElement: HTMLElement): ReturnType<typeof within> =>
  within(canvasElement.ownerDocument.body);

// Trips load through two paginated GET /trips requests (600ms each), so the
// cards only appear after ~1.2s — wait past the loading spinner.
const findTripCard = (
  canvasElement: HTMLElement,
  tripName: string,
  timeout = 3000
): Promise<HTMLElement> =>
  within(canvasElement).findByRole(
    "button",
    { name: `Open trip: ${tripName}` },
    { timeout }
  );

// Fluent TextField type="date" inputs don't accept per-character typing, so set
// their value in one change event (mirrors Playwright's .fill()).
const setDateField = (field: HTMLElement, value: string): void => {
  fireEvent.change(field, { target: { value } });
};

const openCreateDialog = async (
  canvasElement: HTMLElement,
  user: User
): Promise<HTMLElement> => {
  await user.click(
    await within(canvasElement).findByRole(
      "button",
      { name: "New Trip" },
      { timeout: 3000 }
    )
  );
  const heading = await overlay(canvasElement).findByRole("heading", {
    name: "Create new Trip"
  });
  return heading.closest(".ms-Modal") as HTMLElement;
};

const openEditDialog = async (
  canvasElement: HTMLElement,
  user: User,
  tripName: string
): Promise<HTMLElement> => {
  const card = await findTripCard(canvasElement, tripName);
  await user.click(within(card).getByRole("button", { name: "Edit trip" }));
  const heading = await overlay(canvasElement).findByRole("heading", {
    name: `Edit ${tripName}`
  });
  return heading.closest(".ms-Modal") as HTMLElement;
};

const openDeleteDialog = async (
  canvasElement: HTMLElement,
  user: User,
  tripName: string
): Promise<void> => {
  const card = await findTripCard(canvasElement, tripName);
  await user.click(within(card).getByRole("button", { name: "Delete trip" }));
  await overlay(canvasElement).findByText(
    `Are you sure you want to delete ${tripName}?`
  );
};

export const Empty: Story = {};

export const WithTrips: Story = {};

export const OpensTripPlannerWhenCardClicked: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await user.click(await findTripCard(canvasElement, "Italy"));

    await expect(
      await within(canvasElement).findByText("Trip Planner (navigated)")
    ).toBeInTheDocument();
  }
};

export const OpensCreateTripDialogFromNewTripButton: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await findTripCard(canvasElement, "Italy");

    const modal = within(await openCreateDialog(canvasElement, user));

    await expect(modal.getByLabelText("Trip name")).toHaveValue("");
    await expect(modal.getByRole("button", { name: "Create" })).toBeDisabled();
    await expect(modal.getByRole("button", { name: "Cancel" })).toBeEnabled();
  }
};

export const CreatesTripAndShowsNewCard: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await findTripCard(canvasElement, "Italy");
    const modal = within(await openCreateDialog(canvasElement, user));

    await user.type(modal.getByLabelText("Trip name"), "Greek Islands");
    setDateField(modal.getByLabelText("Start date"), "2099-09-01");
    setDateField(modal.getByLabelText("End date"), "2099-09-10");

    const createBtn = modal.getByRole("button", { name: "Create" });
    await waitFor(() => expect(createBtn).toBeEnabled());
    await user.click(createBtn);

    const newCard = await findTripCard(canvasElement, "Greek Islands", 8000);
    await expect(
      within(newCard).getByText("Greek Islands")
    ).toBeInTheDocument();
    await expect(within(newCard).getByText(/2099/)).toBeInTheDocument();
    await expect(within(newCard).getByText("Active")).toBeInTheDocument();
  }
};

export const UpdatesTripNameFromEditDialog: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modal = within(await openEditDialog(canvasElement, user, "Italy"));

    // The editor opens prepopulated with the current trip name.
    const nameField = modal.getByLabelText("Trip name");
    await expect(nameField).toHaveValue("Italy");

    await user.clear(nameField);
    await user.type(nameField, "Italy 2099");
    await user.click(modal.getByRole("button", { name: "Update" }));

    // The renamed card appears and the old name is gone.
    await findTripCard(canvasElement, "Italy 2099", 8000);
    await expect(
      within(canvasElement).queryByRole("button", { name: "Open trip: Italy" })
    ).not.toBeInTheDocument();
  }
};

export const RemovesTripWhenDeleteConfirmed: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await openDeleteDialog(canvasElement, user, "Italy");

    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await expect(
      await findTripCard(canvasElement, "Japan Adventure", 8000)
    ).toBeInTheDocument();
    await expect(
      within(canvasElement).queryByRole("button", { name: "Open trip: Italy" })
    ).not.toBeInTheDocument();
  }
};

export const ShowsCountsAndFiltersTripsByStatusTab: Story = {
  parameters: { trips: MIXED_STATUS_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    await findTripCard(canvasElement, "Italy");

    // Each tab counts only the trips the server placed in that status.
    await expect(
      canvas.getByRole("tab", { name: /Active \(2\)/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("tab", { name: /Past \(2\)/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("tab", { name: /Archived \(2\)/ })
    ).toBeInTheDocument();

    // Active tab holds only the two future-dated trips.
    await expect(
      canvas.getByRole("button", { name: "Open trip: Japan Adventure" })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Open trip: Road Trip USA" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Open trip: Old Europe Tour" })
    ).not.toBeInTheDocument();

    // Past tab holds only the two expired trips.
    await user.click(canvas.getByRole("tab", { name: /Past \(2\)/ }));
    await expect(
      await findTripCard(canvasElement, "Road Trip USA")
    ).toBeInTheDocument();
    await expect(
      await findTripCard(canvasElement, "Autumn Getaway")
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Open trip: Italy" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Open trip: Old Europe Tour" })
    ).not.toBeInTheDocument();

    // Archived tab holds only the two archived trips.
    await user.click(canvas.getByRole("tab", { name: /Archived \(2\)/ }));
    await expect(
      await findTripCard(canvasElement, "Old Europe Tour")
    ).toBeInTheDocument();
    await expect(
      await findTripCard(canvasElement, "College Backpacking")
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Open trip: Road Trip USA" })
    ).not.toBeInTheDocument();
  }
};

export const RequiresNameAndDatesBeforeCreating: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await findTripCard(canvasElement, "Italy");
    const modal = within(await openCreateDialog(canvasElement, user));
    const createBtn = modal.getByRole("button", { name: "Create" });

    await expect(createBtn).toBeDisabled();

    await user.type(modal.getByLabelText("Trip name"), "Greece 2099");
    await expect(createBtn).toBeDisabled();

    setDateField(modal.getByLabelText("Start date"), "2099-09-01");
    setDateField(modal.getByLabelText("End date"), "2099-09-10");
    await waitFor(() => expect(createBtn).toBeEnabled());
  }
};

export const DisablesUpdateWhenNameCleared: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modal = within(await openEditDialog(canvasElement, user, "Italy"));

    await user.clear(modal.getByLabelText("Trip name"));

    await waitFor(() =>
      expect(modal.getByRole("button", { name: "Update" })).toBeDisabled()
    );
  }
};

export const KeepsTripWhenDeleteCancelled: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await openDeleteDialog(canvasElement, user, "Italy");

    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByText(
          "Are you sure you want to delete Italy?"
        )
      ).not.toBeInTheDocument()
    );
    await expect(
      await findTripCard(canvasElement, "Italy")
    ).toBeInTheDocument();
  }
};

export const DiscardsChangesWhenEditCancelled: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const modal = within(await openEditDialog(canvasElement, user, "Italy"));

    const nameField = modal.getByLabelText("Trip name");
    await user.clear(nameField);
    await user.type(nameField, "Changed Name");
    await user.click(modal.getByRole("button", { name: "Cancel" }));

    await expect(
      await findTripCard(canvasElement, "Italy")
    ).toBeInTheDocument();
    await expect(
      within(canvasElement).queryByRole("button", {
        name: "Open trip: Changed Name"
      })
    ).not.toBeInTheDocument();
  }
};

export const ShowsEmptyStateForTabWithoutTrips: Story = {
  parameters: { trips: [activeTrip(1, "Italy")] },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);
    await findTripCard(canvasElement, "Italy");

    await user.click(canvas.getByRole("tab", { name: /Past \(0\)/ }));

    await expect(
      await canvas.findByText("No past trips yet.")
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Create Trip" })
    ).not.toBeInTheDocument();
  }
};

export const EditButtonDoesNotOpenTripPlanner: Story = {
  parameters: { trips: TWO_ACTIVE_TRIPS },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const card = await findTripCard(canvasElement, "Italy");

    await user.click(within(card).getByRole("button", { name: "Edit trip" }));

    await expect(
      await overlay(canvasElement).findByRole("heading", { name: "Edit Italy" })
    ).toBeInTheDocument();
    await expect(
      within(canvasElement).queryByText("Trip Planner (navigated)")
    ).not.toBeInTheDocument();
  }
};
