import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { expect, userEvent, waitFor, within } from "storybook/test";
import makeServer from "../../ServerSetup";
import { SOLID_STORY_BACKGROUND_STYLES as styleOverrides } from "../../shared/storybook/StoryStyles";
import BucketList from "./BucketList";
import type { BucketListItem } from "./BucketList.types";

let server: ReturnType<typeof makeServer> | undefined;
const completionDate = new Date();
const completionDateIso = `${completionDate.getFullYear()}-${String(
  completionDate.getMonth() + 1
).padStart(2, "0")}-${String(completionDate.getDate()).padStart(2, "0")}`;

const meta: Meta<typeof BucketList> = {
  component: BucketList,
  tags: ["wide"],
  decorators: [
    (Story) => {
      server?.shutdown();
      server = makeServer({
        tripDateOverrides: [
          {
            tripId: 1,
            fromDate: completionDateIso,
            toDate: completionDateIso
          }
        ]
      });
      return (
        <MemoryRouter initialEntries={["/bucket-list"]}>
          <Story />
          <style>{styleOverrides}</style>
        </MemoryRouter>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof BucketList>;

const waitForCanvasToBecomeAccessible = async (
  canvasElement: HTMLElement
): Promise<void> => {
  await waitFor(() =>
    expect(canvasElement.closest('[aria-hidden="true"]')).toBeNull()
  );
};

const completeParaglidingToday = async (
  canvasElement: HTMLElement
): Promise<{
  canvas: ReturnType<typeof within>;
  user: ReturnType<typeof userEvent.setup>;
  paraglidingRow: () => HTMLElement;
  todayIso: string;
}> => {
  const canvas = within(canvasElement);
  const overlay = within(canvasElement.ownerDocument.body);
  const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });

  const staleDialogTitle = overlay.queryByRole("heading", {
    name: /^Complete /i
  });
  const staleDialog = staleDialogTitle?.closest('[role="dialog"]');
  if (staleDialog) {
    await user.click(
      within(staleDialog as HTMLElement).getByRole("button", {
        name: "Cancel"
      })
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
  }

  await canvas.findByText("Paragliding");

  await user.click(
    await canvas.findByRole("button", { name: "Mark as completed" })
  );

  const dialogTitle = await overlay.findByText("Complete Paragliding");
  const dialogElement = dialogTitle.closest('[role="dialog"]');
  if (!dialogElement) throw new Error("Completion dialog was not found");
  const dialog = within(dialogElement as HTMLElement);
  await user.click(dialog.getByLabelText("Select completion date"));
  const selectedDate = `${completionDate.getDate()}, ${completionDate.toLocaleString(
    "en-US",
    {
      month: "long"
    }
  )}, ${completionDate.getFullYear()}`;
  await user.click(await overlay.findByRole("button", { name: selectedDate }));
  await overlay.findByText("Finding trip...");
  await waitFor(
    () =>
      expect(overlay.queryByText("Finding trip...")).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
  await expect(await dialog.findByText("Italy")).toBeVisible();
  await user.click(dialog.getByText("Mark completed", { selector: "button" }));

  await waitFor(() =>
    expect(
      overlay.queryByRole("heading", { name: "Complete Paragliding" })
    ).not.toBeInTheDocument()
  );
  await waitForCanvasToBecomeAccessible(canvasElement);

  const paraglidingRow = (): HTMLElement => {
    const row = canvas.getByText("Paragliding").closest("tr");
    if (!row) throw new Error("Paragliding row was not found");
    return row;
  };

  return { canvas, user, paraglidingRow, todayIso: completionDateIso };
};

export const Primary: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Paragliding")).toBeVisible();
    await expect(canvas.getByText("Zorbing")).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "To do (1)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (1)" })
    ).toBeVisible();
  }
};

export const CanCompleteItemOnTripDate: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, paraglidingRow, todayIso } =
      await completeParaglidingToday(canvasElement);
    const completedDate = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(`${todayIso}T00:00:00Z`));

    await waitFor(() => {
      const row = within(paraglidingRow());
      expect(row.getByText("Completed")).toBeVisible();
      expect(row.getByText(completedDate)).toBeVisible();
      expect(row.getByText("Italy")).toBeVisible();
      expect(
        row.getByRole("button", { name: "Move back to bucket list" })
      ).toBeEnabled();
    });
    await expect(canvas.getByRole("tab", { name: "To do (0)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (2)" })
    ).toBeVisible();

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.completedOn).toBe(todayIso);
    expect(savedItem?.tripId).toBe(1);
    expect(savedItem?.tripName).toBe("Italy");
  }
};

export const CanCompleteItemOnTripDateAndResetIt: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow } =
      await completeParaglidingToday(canvasElement);
    await waitFor(() => {
      expect(within(paraglidingRow()).getByText("Italy")).toBeVisible();
    });

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Move back to bucket list"
      })
    );
    await waitFor(() =>
      expect(
        within(paraglidingRow()).queryByText("Italy")
      ).not.toBeInTheDocument()
    );
    await expect(
      within(paraglidingRow()).getByText("Not completed")
    ).toBeVisible();

    const resetItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(resetItem?.completedOn).toBeNull();
    expect(resetItem?.tripId).toBeNull();
    expect(resetItem?.tripName).toBeNull();
  }
};

export const CanSortByExperienceAndStatus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    const experienceHeader = canvas.getByRole("columnheader", {
      name: "Experience"
    });
    const statusHeader = canvas.getByRole("columnheader", { name: "Status" });
    const firstDataRow = (): HTMLElement => canvas.getAllByRole("row")[1];

    await user.click(canvas.getByRole("button", { name: "Experience" }));
    await expect(experienceHeader).toHaveAttribute("aria-sort", "ascending");
    await expect(firstDataRow()).toHaveTextContent("Paragliding");

    await user.click(canvas.getByRole("button", { name: "Experience" }));
    await expect(experienceHeader).toHaveAttribute("aria-sort", "descending");
    await expect(firstDataRow()).toHaveTextContent("Zorbing");

    await user.click(canvas.getByRole("button", { name: "Status" }));
    await expect(statusHeader).toHaveAttribute("aria-sort", "ascending");
    await expect(firstDataRow()).toHaveTextContent("Completed");

    await user.click(canvas.getByRole("button", { name: "Status" }));
    await expect(statusHeader).toHaveAttribute("aria-sort", "descending");
    await expect(firstDataRow()).toHaveTextContent("To do");
  }
};

export const CanCreateItem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    await user.click(canvas.getByRole("button", { name: "Add item" }));
    const dialog = within(canvasElement.ownerDocument.body);
    await user.type(dialog.getByRole("textbox", { name: "Name" }), "Skydiving");
    await user.click(dialog.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(canvas.getByText("Skydiving")).toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(canvas.getByRole("tab", { name: "All (3)" })).toBeVisible();
  }
};
