import { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import Board from "./Board";
import type { TouristDestination } from "./Board.types";
import {
  findAttractionCard,
  makeAttraction,
  reviewBoard,
  setupUser,
  styleDecorator,
  withServer
} from "./Board.helpers";

const meta: Meta<typeof Board> = {
  title: "features/AI-table/components/Board/ReviewEdge",
  component: Board,
  decorators: [styleDecorator, withServer]
};
export default meta;

type Story = StoryObj<typeof Board>;

export const ReviewModeSavesNoteWithSurroundingSpaces: Story = {
  args: {
    initialCities: reviewBoard([makeAttraction(1, "Casino Square")]),
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "Average" }));
    await user.type(
      item.getByPlaceholderText(/Trip note/),
      "  Windy but worth it  "
    );
    await user.click(item.getByRole("button", { name: "+ Add to trip" }));

    // The review is saved and the note is shown alongside the rating.
    await item.findByRole("button", { name: "Remove from trip" });
    await item.findByText("Windy but worth it");
  }
};

export const ReviewModeCapsNoteAt512Chars: Story = {
  args: {
    initialCities: reviewBoard([makeAttraction(1, "Casino Square")]),
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    const field = item.getByPlaceholderText(/Trip note/);
    await user.click(field);
    await user.paste("a".repeat(600));

    await expect(field).toHaveValue("a".repeat(512));
  }
};

const excludedReviewBoard: TouristDestination[] = [
  {
    name: "Monaco",
    columns: [
      {
        id: "monaco_top",
        title: "Top Attractions",
        tasks: [makeAttraction(1, "Casino Square")]
      },
      { id: "monaco_secondary", title: "Secondary Spots", tasks: [] },
      {
        id: "monaco_excluded",
        title: "Excluded Attractions",
        tasks: [makeAttraction(2, "Skip This Place")]
      }
    ]
  }
];

export const ReviewModeHidesFormForExcludedAttraction: Story = {
  args: {
    initialCities: excludedReviewBoard,
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(findAttractionCard(canvasElement, "Skip This Place")).queryByRole(
        "button",
        { name: "+ Add to trip" }
      )
    ).not.toBeInTheDocument();
    await expect(
      within(findAttractionCard(canvasElement, "Casino Square")).getByRole(
        "button",
        { name: "+ Add to trip" }
      )
    ).toBeInTheDocument();
  }
};

export const ReviewModeDefaultsToWouldVisitAgainPromptAfterAdding: Story = {
  args: {
    initialCities: reviewBoard([makeAttraction(1, "Casino Square")]),
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "Average" }));
    await user.click(item.getByRole("button", { name: "+ Add to trip" }));

    await expect(
      await item.findByRole("button", { name: "Would visit again?" })
    ).toBeInTheDocument();
    await expect(
      item.queryByText("\uD83D\uDD01 Would visit again")
    ).not.toBeInTheDocument();
  }
};

export const ReviewModeFlagsAttractionAsWouldVisitAgain: Story = {
  args: {
    initialCities: reviewBoard([makeAttraction(1, "Casino Square")]),
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "Average" }));
    await user.click(item.getByRole("button", { name: "+ Add to trip" }));

    const toggle = await item.findByRole("button", {
      name: "Would visit again?"
    });
    await user.click(toggle);

    await expect(
      await item.findByText("\uD83D\uDD01 Would visit again")
    ).toBeInTheDocument();
  }
};

export const ReviewModeRemovingReviewResetsFormToDefaults: Story = {
  args: {
    initialCities: reviewBoard([makeAttraction(1, "Casino Square")]),
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "Excellent" }));
    await user.type(item.getByPlaceholderText(/Trip note/), "Unforgettable");
    await user.click(item.getByRole("button", { name: "+ Add to trip" }));
    await item.findByText("\uD83E\uDD29 Excellent");

    await user.click(item.getByRole("button", { name: "Remove from trip" }));

    const field = await item.findByPlaceholderText(/Trip note/);
    await expect(field).toHaveValue("");
    await expect(item.queryByText("Unforgettable")).not.toBeInTheDocument();
  }
};
