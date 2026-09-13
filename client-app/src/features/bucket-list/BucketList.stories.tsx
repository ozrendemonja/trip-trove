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

const findDialog = async (
  canvasElement: HTMLElement,
  heading: string
): Promise<HTMLElement> => {
  const title = await within(canvasElement.ownerDocument.body).findByRole(
    "heading",
    { name: heading }
  );
  const dialog = title.closest('[role="dialog"]');
  if (!dialog) throw new Error(`${heading} dialog was not found`);
  return dialog as HTMLElement;
};

const completeParaglidingToday = async (
  canvasElement: HTMLElement,
  wouldRepeat = false
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
  const repeatCheckbox = dialog.getByRole("checkbox", {
    name: "Would do again"
  });
  await expect(repeatCheckbox).not.toBeChecked();
  if (wouldRepeat) {
    await user.click(repeatCheckbox);
  }
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
    await expect(
      canvas.getByRole("columnheader", { name: "Name" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("columnheader", { name: "Location" })
    ).toBeVisible();
    const paraglidingRow = canvas.getByText("Paragliding").closest("tr");
    if (!paraglidingRow) throw new Error("Paragliding row was not found");
    const cells = within(paraglidingRow).getAllByRole("cell");
    await expect(cells).toHaveLength(6);
    await expect(cells[0]).toHaveTextContent(/^Paragliding$/);
    await expect(within(cells[1]).getByText("Dzūkija")).toBeVisible();
    await expect(within(cells[1]).getByText("Region")).toBeVisible();
    await expect(
      within(paraglidingRow).queryByText(/Would.*do again|Repeat: not answered/)
    ).not.toBeInTheDocument();
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
      expect(row.getByText("Would not do again")).toBeVisible();
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
    expect(savedItem?.wouldRepeat).toBe(false);
  }
};

export const CanCompleteItemAndChooseToRepeat: Story = {
  play: async ({ canvasElement }) => {
    const { paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      true
    );

    await expect(
      within(paraglidingRow()).getByText("Would do again")
    ).toBeVisible();
  }
};

export const CanCompleteItemAndChooseNotToRepeat: Story = {
  play: async ({ canvasElement }) => {
    const { paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      false
    );

    await expect(
      within(paraglidingRow()).getByText("Would not do again")
    ).toBeVisible();
  }
};

export const CanCompleteItemOnTripDateAndResetIt: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      true
    );
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
    await expect(
      within(paraglidingRow()).queryByText(
        /Would.*do again|Repeat: not answered/
      )
    ).not.toBeInTheDocument();

    const resetItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(resetItem?.completedOn).toBeNull();
    expect(resetItem?.tripId).toBeNull();
    expect(resetItem?.tripName).toBeNull();
    expect(resetItem?.wouldRepeat).toBeNull();
  }
};

export const CanEditCompletionDetails: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow, todayIso } = await completeParaglidingToday(
      canvasElement,
      true
    );
    const overlay = within(canvasElement.ownerDocument.body);

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Change completion details for Paragliding"
      })
    );

    const dialogElement = await findDialog(
      canvasElement,
      "Edit completion for Paragliding"
    );
    const dialog = within(dialogElement);
    await waitFor(
      () =>
        expect(dialog.queryByText("Finding trip...")).not.toBeInTheDocument(),
      { timeout: 3000 }
    );
    await expect(dialog.getByText("Italy")).toBeVisible();
    await expect(
      dialog.getByRole("checkbox", { name: "Would do again" })
    ).toBeChecked();
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(
        overlay.queryByRole("heading", {
          name: "Edit completion for Paragliding"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(within(paraglidingRow()).getByText("Completed")).toBeVisible();

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.completedOn).toBe(todayIso);
    expect(savedItem?.tripId).toBe(1);
    expect(savedItem?.wouldRepeat).toBe(true);
  }
};

export const CanCancelChangingRepeatPreference: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      true
    );
    const overlay = within(canvasElement.ownerDocument.body);

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Change completion details for Paragliding"
      })
    );
    const dialog = within(
      await findDialog(canvasElement, "Edit completion for Paragliding")
    );
    const repeatCheckbox = dialog.getByRole("checkbox", {
      name: "Would do again"
    });
    await expect(repeatCheckbox).toBeChecked();
    await user.click(repeatCheckbox);
    await user.click(dialog.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        overlay.queryByRole("heading", {
          name: "Edit completion for Paragliding"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(
      within(paraglidingRow()).getByText("Would do again")
    ).toBeVisible();
  }
};

export const CanChangeRepeatPreferenceToNo: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      true
    );
    const overlay = within(canvasElement.ownerDocument.body);

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Change completion details for Paragliding"
      })
    );
    const dialog = within(
      await findDialog(canvasElement, "Edit completion for Paragliding")
    );
    const repeatCheckbox = dialog.getByRole("checkbox", {
      name: "Would do again"
    });
    await expect(repeatCheckbox).toBeChecked();
    await user.click(repeatCheckbox);
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "Save" })).toBeEnabled()
    );
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(
        overlay.queryByRole("heading", {
          name: "Edit completion for Paragliding"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(
      within(paraglidingRow()).getByText("Would not do again")
    ).toBeVisible();
  }
};

export const CanChangeRepeatPreferenceToYes: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow } =
      await completeParaglidingToday(canvasElement);
    const overlay = within(canvasElement.ownerDocument.body);

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Change completion details for Paragliding"
      })
    );
    const dialog = within(
      await findDialog(canvasElement, "Edit completion for Paragliding")
    );
    const repeatCheckbox = dialog.getByRole("checkbox", {
      name: "Would do again"
    });
    await expect(repeatCheckbox).not.toBeChecked();
    await user.click(repeatCheckbox);
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "Save" })).toBeEnabled()
    );
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(
        overlay.queryByRole("heading", {
          name: "Edit completion for Paragliding"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(
      within(paraglidingRow()).getByText("Would do again")
    ).toBeVisible();
  }
};

export const CanEditItemName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    const row = canvas.getByText("Paragliding").closest("tr");
    if (!row) throw new Error("Paragliding row was not found");

    await user.click(
      within(row).getByRole("button", {
        name: "Change bucket list item name from Paragliding"
      })
    );
    const nameDialog = within(
      await findDialog(canvasElement, "Modifying Paragliding")
    );
    const nameInput = nameDialog.getByRole("textbox", { name: "Name" });
    await user.clear(nameInput);
    await user.type(nameInput, "Hang gliding");
    await user.click(nameDialog.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(canvas.getByText("Hang gliding")).toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.name).toBe("Hang gliding");
  }
};

export const CanEditItemLocation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    const itemName = await canvas.findByText("Paragliding");
    const row = itemName.closest("tr");
    if (!row) throw new Error("Paragliding row was not found");

    await user.click(
      within(row).getByRole("button", {
        name: "Change bucket list item location from Dzūkija"
      })
    );
    const locationDialog = within(
      await findDialog(canvasElement, "Modifying Dzūkija")
    );
    await user.click(locationDialog.getByRole("radio", { name: "Anywhere" }));
    await user.click(locationDialog.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(within(row).getByText("Anywhere")).toBeVisible()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    const locationCell = within(row).getAllByRole("cell")[1];
    await expect(within(locationCell).getByText("Anywhere")).toBeVisible();
    await expect(
      within(locationCell).queryByText(/^(City|Region)$/)
    ).not.toBeInTheDocument();

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.cityId).toBeNull();
    expect(savedItem?.regionId).toBeNull();
  }
};

export const CanEditItemDescription: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    const itemName = await canvas.findByText("Paragliding");
    const row = itemName.closest("tr");
    if (!row) throw new Error("Paragliding row was not found");

    await user.click(
      within(row).getByRole("button", {
        name: "Change description for Paragliding"
      })
    );
    const descriptionDialog = within(
      await findDialog(canvasElement, "Modifying Paragliding description")
    );
    const descriptionInput = descriptionDialog.getByRole("textbox", {
      name: "Description"
    });
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Best at sunset.");
    await user.click(descriptionDialog.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(canvas.getByText("Best at sunset.")).toBeVisible()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.description).toBe("Best at sunset.");
  }
};

export const CanSortByExperienceAndStatus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    const nameHeader = canvas.getByRole("columnheader", {
      name: "Name"
    });
    const statusHeader = canvas.getByRole("columnheader", { name: "Status" });
    const firstDataRow = (): HTMLElement => canvas.getAllByRole("row")[1];

    await user.click(canvas.getByRole("button", { name: "Name" }));
    await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    await expect(firstDataRow()).toHaveTextContent("Paragliding");

    await user.click(canvas.getByRole("button", { name: "Name" }));
    await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
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
