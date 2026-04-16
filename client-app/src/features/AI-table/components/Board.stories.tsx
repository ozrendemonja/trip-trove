import { Meta, StoryObj } from "@storybook/react";
import { within, userEvent } from "@storybook/test";
import Board from "./Board";
import type { TouristDestination } from "./Board.types";
import { initialCities } from "../data/initialCities";
import makeServer from "../../../ServerSetup";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof Board> = {
  component: Board,
  decorators: [
    (Story) => (
      <>
        <Story />
        <style>{styleOverrides}</style>
      </>
    )
  ]
};

export default meta;

type Story = StoryObj<typeof Board>;

/** Step 1 – Edit mode: add info, drag-and-drop, toggle must-visit, edit notes/hours */
export const EditMode: Story = {
  args: {
    initialCities
  }
};

/** Step 2 – Plan mode: read-only with itinerary checkboxes */
export const PlanMode: Story = {
  args: {
    initialCities
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const planBtn = canvas.getByRole("button", { name: /Plan/i });
    await userEvent.click(planBtn);
  }
};

/** Step 3 – Review mode: rate visited attractions, add notes, attach/detach from trip */
export const ReviewMode: Story = {
  args: {
    initialCities,
    tripId: 1
  },
  decorators: [
    (Story) => {
      makeServer();
      return <Story />;
    }
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reviewBtn = canvas.getByRole("button", { name: /Review/i });
    await userEvent.click(reviewBtn);
  }
};

/** Board with no attractions loaded yet */
export const Empty: Story = {
  args: {
    initialCities: []
  }
};

/** Single city board */
export const SingleCity: Story = {
  args: {
    initialCities: [initialCities[0]]
  }
};

/** Board with itinerary selections pre-set (Plan mode data) */
const citiesWithItinerary: TouristDestination[] = initialCities.map(
  (city) => ({
    ...city,
    columns: city.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((t) => ({
        ...t,
        inItinerary: t.mustVisit
      }))
    }))
  })
);

export const PlanModeWithSelections: Story = {
  args: {
    initialCities: citiesWithItinerary
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const planBtn = canvas.getByRole("button", { name: /Plan/i });
    await userEvent.click(planBtn);
  }
};
