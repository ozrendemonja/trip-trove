import { Meta, StoryObj } from "@storybook/react";
import { expect, fireEvent, waitFor, within } from "storybook/test";
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
    const body = within(canvasElement.ownerDocument.body);
    const user = setupUser();

    await user.click(
      await canvas.findByRole("button", {
        name: "Remove Casino Square from trip"
      })
    );
    await user.click(await body.findByRole("button", { name: "Delete" }));

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

export const KeepsSingleAttractionWhenDeleteCancelled: Story = {
  args: { initialCities: tripBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = setupUser();

    await user.click(
      await canvas.findByRole("button", {
        name: "Remove Casino Square from trip"
      })
    );
    await user.click(await body.findByRole("button", { name: "Cancel" }));

    await expect(
      canvas.getByRole("button", {
        name: "Remove Casino Square from trip"
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

export const PlanModeRemainsReadOnlyAcrossModeSwitches: Story = {
  args: { initialCities: oneAttractionBoard() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await user.click(canvas.getByRole("button", { name: /Plan/i }));

    const item = within(findAttractionCard(canvasElement, "Casino Square"));
    await expect(canvas.queryByRole("checkbox")).not.toBeInTheDocument();
    await expect(
      item.queryByRole("button", { name: "+ Add note" })
    ).not.toBeInTheDocument();
    await expect(
      item.queryByRole("button", { name: "Remove Casino Square from trip" })
    ).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: /Edit/i }));
    await expect(
      item.getByRole("button", { name: "+ Add note" })
    ).toBeInTheDocument();
    await expect(
      item.getByRole("button", { name: "Remove Casino Square from trip" })
    ).toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: /Plan/i }));
    await expect(canvas.queryByRole("checkbox")).not.toBeInTheDocument();
    await expect(
      item.queryByRole("button", { name: "+ Add note" })
    ).not.toBeInTheDocument();
    await expect(
      item.getByRole("link", { name: "Casino Square" })
    ).toBeInTheDocument();
  }
};

const cityBoard: TouristDestination[] = [
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

export const CollapsesAndExpandsCityAcrossModeSwitches: Story = {
  args: { initialCities: cityBoard },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await user.click(canvas.getByRole("button", { name: /Plan/i }));
    await user.click(canvas.getByRole("button", { name: "Collapse Monaco" }));

    for (const name of ["Casino Square", "Larvotto Beach"]) {
      await expect(
        canvas.queryByRole("link", { name })
      ).not.toBeInTheDocument();
    }

    await user.click(canvas.getByRole("button", { name: /Edit/i }));
    await user.click(canvas.getByRole("button", { name: "Expand Monaco" }));

    for (const name of ["Casino Square", "Larvotto Beach"]) {
      await expect(canvas.getByRole("link", { name })).toBeInTheDocument();
    }
  }
};
