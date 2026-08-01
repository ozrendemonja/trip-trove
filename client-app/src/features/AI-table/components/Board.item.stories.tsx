import { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "@storybook/test";
import Board from "./Board";
import {
  findAttractionCard,
  oneAttractionBoard,
  setupUser,
  styleDecorator,
  tripBoard,
  withServer
} from "./Board.helpers";

const meta: Meta<typeof Board> = {
  title: "features/AI-table/components/Board/Item",
  component: Board,
  decorators: [styleDecorator, withServer]
};
export default meta;

type Story = StoryObj<typeof Board>;

export const CopyButtonWritesAttractionNameToClipboard: Story = {
  args: { initialCities: tripBoard },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const copied: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          copied.push(text);
          return Promise.resolve();
        }
      }
    });

    await user.click(
      within(findAttractionCard(canvasElement, "Casino Square")).getByRole(
        "button",
        { name: "Copy attraction name" }
      )
    );
    await waitFor(() => expect(copied).toContain("Casino Square"));
    delete (navigator as unknown as { clipboard?: unknown }).clipboard;
  }
};

export const AttractionNameLinksToLocationScopedGoogleSearch: Story = {
  args: { initialCities: tripBoard },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", {
      name: "Casino Square"
    });

    await expect(link).toHaveAttribute(
      "href",
      `https://www.google.com/search?q=${encodeURIComponent(
        "Casino Square Monaco"
      )}`
    );
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
};

export const AddedWorkingHoursPersistAfterLeavingEditMode: Story = {
  args: { initialCities: oneAttractionBoard() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "+ hours" }));
    await user.type(item.getByPlaceholderText("Working hours"), "09:00-17:00");
    await user.click(item.getByRole("button", { name: "Save" }));

    await item.findByText("09:00-17:00");

    await user.click(canvas.getByRole("button", { name: /Plan/i }));
    await expect(
      within(findAttractionCard(canvasElement, "Casino Square")).getByText(
        "09:00-17:00"
      )
    ).toBeInTheDocument();
  }
};

export const AddedVisitTimePersistsAfterLeavingEditMode: Story = {
  args: { initialCities: oneAttractionBoard() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "+ visit" }));
    await user.type(item.getByPlaceholderText("Visit time"), "2h");
    await user.click(item.getByRole("button", { name: "Save" }));

    await item.findByText("2h");

    await user.click(canvas.getByRole("button", { name: /Plan/i }));
    await expect(
      within(findAttractionCard(canvasElement, "Casino Square")).getByText("2h")
    ).toBeInTheDocument();
  }
};

export const NoteAddedToEmptyCardPersistsAfterLeavingEditMode: Story = {
  args: { initialCities: oneAttractionBoard() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "+ Add note" }));
    await user.type(item.getByRole("textbox"), "Arrive before the crowds");
    await user.click(item.getByRole("button", { name: "Save" }));

    await item.findByText("Arrive before the crowds");

    await user.click(canvas.getByRole("button", { name: /Plan/i }));
    await expect(
      within(findAttractionCard(canvasElement, "Casino Square")).getByText(
        "Arrive before the crowds"
      )
    ).toBeInTheDocument();
  }
};

export const EditingNoteReplacesPreviousTextInsteadOfAppending: Story = {
  args: { initialCities: oneAttractionBoard({ note: "Original note" }) },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByTitle("Edit note"));
    const textbox = item.getByRole("textbox");
    await expect(textbox).toHaveValue("Original note");

    await user.clear(textbox);
    await user.type(textbox, "Replaced note");
    await user.click(item.getByRole("button", { name: "Save" }));

    await item.findByText("Replaced note");
    await expect(item.queryByText("Original note")).not.toBeInTheDocument();
  }
};

export const TogglingMustVisitMarksAttractionAndPersistsToPlanMode: Story = {
  args: { initialCities: oneAttractionBoard() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await expect(
      item.getByRole("link", { name: "Casino Square" })
    ).not.toHaveClass("must-visit");

    await user.click(item.getByTitle("Mark must visit"));

    await expect(item.getByTitle("Unmark must visit")).toBeInTheDocument();
    await expect(item.getByRole("link", { name: "Casino Square" })).toHaveClass(
      "must-visit"
    );

    await user.click(canvas.getByRole("button", { name: /Plan/i }));
    await expect(
      within(findAttractionCard(canvasElement, "Casino Square")).getByRole(
        "link",
        { name: "Casino Square" }
      )
    ).toHaveClass("must-visit");
  }
};

export const PermanentlyClosedMovesToExcludedAttractions: Story = {
  tags: ["closure-status", "closure-board-prepare"],
  args: {
    initialCities: oneAttractionBoard({ id: 1, mustVisit: true }),
    initialMode: "prepare",
    tripId: 9001
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const canvas = within(canvasElement);

    await user.click(
      canvas.getByRole("button", {
        name: "Mark Casino Square as permanently closed"
      })
    );
    const confirmClosureButton = await within(
      canvasElement.ownerDocument.body
    ).findByRole("button", { name: "Mark permanently closed" });
    await user.click(confirmClosureButton);

    await waitFor(() => {
      const card = findAttractionCard(canvasElement, "Casino Square");
      expect(card.closest(".attraction-board-column")).toHaveTextContent(
        "Excluded Attractions"
      );
    });
    const card = findAttractionCard(canvasElement, "Casino Square");
    expect(card.querySelector(".attraction-item")).toHaveClass(
      "permanently-closed"
    );
    expect(
      within(card).getByRole("button", {
        name: /Casino Square is permanently closed/
      })
    ).toBeInTheDocument();
    expect(within(card).getByText(/^Permanently closed since .+/)).toHaveClass(
      "permanently-closed-since"
    );
  }
};

export const PermanentlyClosedCannotBeSelectedInEdit: Story = {
  tags: ["closure-status", "closure-board-edit"],
  args: {
    initialCities: oneAttractionBoard({
      id: 1,
      permanentlyClosedAt: "2026-07-31T00:00:00.000Z"
    }),
    initialMode: "edit",
    tripId: 9001
  },
  play: async ({ canvasElement }) => {
    const card = findAttractionCard(canvasElement, "Casino Square");
    expect(card.querySelector(".attraction-item")).toHaveClass(
      "permanently-closed"
    );
    expect(
      within(card).queryByRole("button", {
        name: /Casino Square is permanently closed/
      })
    ).not.toBeInTheDocument();
    expect(
      within(card).getByRole("img", {
        name: /Casino Square is permanently closed/
      })
    ).toBeInTheDocument();
  }
};

export const PermanentlyClosedCannotBeSelectedInPlan: Story = {
  tags: ["closure-status", "closure-board-plan"],
  args: {
    initialCities: oneAttractionBoard({
      id: 1,
      permanentlyClosedAt: "2026-07-31T00:00:00.000Z"
    }),
    initialMode: "readOnly",
    tripId: 9001
  },
  play: async ({ canvasElement }) => {
    const card = findAttractionCard(canvasElement, "Casino Square");
    expect(card.querySelector(".attraction-item")).toHaveClass(
      "permanently-closed"
    );
    expect(
      within(card).queryByRole("button", {
        name: /Casino Square is permanently closed/
      })
    ).not.toBeInTheDocument();
    expect(
      within(card).getByRole("img", {
        name: /Casino Square is permanently closed/
      })
    ).toBeInTheDocument();
  }
};

export const PermanentlyClosedCannotBeSelectedInReview: Story = {
  tags: ["closure-status", "closure-board-review"],
  args: {
    initialCities: oneAttractionBoard({
      id: 1,
      permanentlyClosedAt: "2026-07-31T00:00:00.000Z"
    }),
    initialMode: "review",
    tripId: 9001
  },
  play: async ({ canvasElement }) => {
    const card = findAttractionCard(canvasElement, "Casino Square");
    expect(card.querySelector(".attraction-item")).toHaveClass(
      "permanently-closed"
    );
    expect(
      within(card).queryByRole("button", {
        name: /Casino Square is permanently closed/
      })
    ).not.toBeInTheDocument();
    expect(
      within(card).getByRole("img", {
        name: /Casino Square is permanently closed/
      })
    ).toBeInTheDocument();
  }
};
