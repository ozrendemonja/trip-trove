import { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import Board from "./Board";
import {
  findAttractionCard,
  makeAttraction,
  reviewBoard,
  setupUser,
  styleDecorator,
  withServer
} from "./Board.helpers";

const meta: Meta<typeof Board> = {
  title: "features/AI-table/components/Board/Review",
  component: Board,
  decorators: [styleDecorator, withServer]
};
export default meta;

type Story = StoryObj<typeof Board>;

export const ReviewModeSavesRatingWithNote: Story = {
  args: {
    initialCities: reviewBoard([makeAttraction(1, "Casino Square")]),
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "Very Good" }));
    await user.type(
      item.getByPlaceholderText(/Trip note/),
      "Loved the harbour views"
    );
    await user.click(item.getByRole("button", { name: "+ Add to trip" }));

    await item.findByText("\uD83D\uDE0A Very Good");
    await expect(item.getByText("Loved the harbour views")).toBeInTheDocument();
    await expect(
      item.getByRole("button", { name: "Remove from trip" })
    ).toBeInTheDocument();
  }
};

export const ReviewModeSavesRatingWithoutNote: Story = {
  args: {
    initialCities: reviewBoard([makeAttraction(1, "Casino Square")]),
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "Excellent" }));
    await user.click(item.getByRole("button", { name: "+ Add to trip" }));

    await item.findByText("\uD83E\uDD29 Excellent");
    await expect(
      item.getByRole("button", { name: "Remove from trip" })
    ).toBeInTheDocument();
  }
};

export const ReviewModeClearResetsRatingAndNote: Story = {
  args: {
    initialCities: reviewBoard([makeAttraction(1, "Casino Square")]),
    tripId: 1,
    initialMode: "review"
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const item = within(findAttractionCard(canvasElement, "Casino Square"));

    await user.click(item.getByRole("button", { name: "Excellent" }));
    await user.type(
      item.getByPlaceholderText(/Trip note/),
      "Loved the harbour views"
    );

    await user.click(item.getByRole("button", { name: "Clear" }));

    await expect(item.getByPlaceholderText(/Trip note/)).toHaveValue("");
    await expect(item.queryByText(/Excellent/)).not.toBeInTheDocument();
    await expect(
      item.queryByText("Loved the harbour views")
    ).not.toBeInTheDocument();
  }
};
