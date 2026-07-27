import { Meta, StoryObj } from "@storybook/react";
import { expect, fireEvent, waitFor, within } from "@storybook/test";
import Board from "./Board";
import type { TouristDestination } from "./Board.types";
import {
  findAttractionCard,
  makeAttraction,
  oneAttractionBoard,
  setupUser,
  styleDecorator,
  tripBoard
} from "./Board.helpers";

const meta: Meta<typeof Board> = {
  title: "features/AI-table/components/Board/Manage",
  component: Board,
  decorators: [styleDecorator]
};
export default meta;

type Story = StoryObj<typeof Board>;

export const DeletesSingleAttraction: Story = {
  args: { initialCities: tripBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await user.click(
      await canvas.findByRole("button", {
        name: "Remove Casino Square from trip"
      })
    );

    await waitFor(() =>
      expect(
        canvas.queryByRole("button", {
          name: "Remove Casino Square from trip"
        })
      ).not.toBeInTheDocument()
    );
    await expect(
      canvas.getByRole("button", {
        name: "Remove Oceanographic Museum from trip"
      })
    ).toBeInTheDocument();
  }
};

export const DeletesAllAttractionsInCity: Story = {
  args: { initialCities: tripBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = setupUser();

    await user.click(
      await canvas.findByRole("button", {
        name: "Remove all attractions from Monaco"
      })
    );
    await user.click(await body.findByRole("button", { name: "Delete" }));

    await canvas.findByRole("button", {
      name: "Remove all attractions from Bavaria"
    });
    await expect(
      canvas.queryByRole("button", {
        name: "Remove all attractions from Monaco"
      })
    ).not.toBeInTheDocument();
  }
};

export const DeletesAllAttractionsInRegion: Story = {
  args: { initialCities: tripBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = setupUser();

    await user.click(
      await canvas.findByRole("button", {
        name: "Remove all attractions from Bavaria"
      })
    );
    await user.click(await body.findByRole("button", { name: "Delete" }));

    await canvas.findByRole("button", {
      name: "Remove all attractions from Monaco"
    });
    await expect(
      canvas.queryByRole("button", {
        name: "Remove all attractions from Bavaria"
      })
    ).not.toBeInTheDocument();
  }
};

export const MovesAttractionBetweenColumns: Story = {
  args: { initialCities: tripBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const sourceCard = (
      await canvas.findByRole("button", {
        name: "Remove Casino Square from trip"
      })
    ).closest("li.attraction") as HTMLElement;

    // Casino Square starts in Monaco's "Top Attractions" column.
    const sourceColumn = sourceCard.closest(
      ".attraction-board-column"
    ) as HTMLElement;
    const monacoBoard = sourceCard.closest(".attraction-board") as HTMLElement;
    const targetColumn = within(monacoBoard)
      .getByRole("heading", { name: "Secondary Spots" })
      .closest(".attraction-board-column") as HTMLElement;

    // It is not in the "Secondary Spots" column yet.
    await expect(
      within(targetColumn).queryByRole("button", {
        name: "Remove Casino Square from trip"
      })
    ).not.toBeInTheDocument();

    const dataTransfer = new DataTransfer();
    fireEvent.dragStart(sourceCard, { dataTransfer });
    // Let React commit the drag state before dropping.
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.drop(targetColumn, { dataTransfer });

    // It now lives in the "Secondary Spots" column...
    await within(targetColumn).findByRole("button", {
      name: "Remove Casino Square from trip"
    });
    // ...and has left the "Top Attractions" column (moved, not copied).
    await expect(
      within(sourceColumn).queryByRole("button", {
        name: "Remove Casino Square from trip"
      })
    ).not.toBeInTheDocument();
  }
};

export const PlanModeRemembersItinerarySelectionAcrossModeSwitches: Story = {
  args: { initialCities: oneAttractionBoard() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await user.click(canvas.getByRole("button", { name: /Plan/i }));

    const checkbox = within(
      findAttractionCard(canvasElement, "Casino Square")
    ).getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    await expect(checkbox).toBeChecked();

    await user.click(canvas.getByRole("button", { name: /Edit/i }));
    await user.click(canvas.getByRole("button", { name: /Plan/i }));
    await expect(
      within(findAttractionCard(canvasElement, "Casino Square")).getByRole(
        "checkbox"
      )
    ).toBeChecked();
  }
};

/**
 * Plan mode: a collapsed city whose Top + Secondary picks are all handled is
 * highlighted (the card changes colour).
 */
const planningBoard: TouristDestination[] = [
  {
    name: "Monaco",
    columns: [
      {
        id: "monaco_top",
        title: "Top Attractions",
        tasks: [makeAttraction(1, "Casino Square")]
      },
      {
        id: "monaco_secondary",
        title: "Secondary Spots",
        tasks: [makeAttraction(2, "Larvotto Beach")]
      },
      { id: "monaco_excluded", title: "Excluded Attractions", tasks: [] }
    ]
  }
];

export const PlanModeHighlightsFullyPlannedCollapsedCity: Story = {
  args: { initialCities: planningBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await user.click(canvas.getByRole("button", { name: /Plan/i }));

    for (const name of ["Casino Square", "Larvotto Beach"]) {
      await user.click(
        within(findAttractionCard(canvasElement, name)).getByRole("checkbox")
      );
    }

    const monacoGroup = (): HTMLElement =>
      canvas
        .getByRole("heading", { name: "Monaco" })
        .closest(".city-group") as HTMLElement;
    await expect(monacoGroup()).not.toHaveClass("all-planned");
    await user.click(canvas.getByRole("button", { name: "Collapse Monaco" }));
    await expect(monacoGroup()).toHaveClass("all-planned");
  }
};
