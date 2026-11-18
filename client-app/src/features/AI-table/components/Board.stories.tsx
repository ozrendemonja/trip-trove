import { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import Board from "./Board";
import { initialCities } from "../data/initialCities";
import type { VisitHistoryMap } from "../utils/Mapper";
import {
  BoardWithHeader,
  oneAttractionBoard,
  setupUser,
  styleDecorator,
  withServer
} from "./Board.helpers";

const meta: Meta<typeof Board> = {
  component: Board,
  render: (args) => <BoardWithHeader {...args} />,
  args: { mode: "edit" },
  decorators: [styleDecorator]
};

export default meta;

type Story = StoryObj<typeof Board>;

/** Edit mode: add info, drag-and-drop, toggle must-visit, edit notes/hours */
export const EditMode: Story = {
  args: {
    initialCities
  }
};

/** Plan mode: read-only attraction details */
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

/** Review mode: rate visited attractions, add notes, attach/detach from trip */
export const ReviewMode: Story = {
  args: {
    initialCities,
    tripId: 1,
    initialSavedAttractionIds: initialCities.flatMap((city) =>
      city.columns.flatMap((column) => column.tasks.map((task) => task.id))
    )
  },
  decorators: [withServer],
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

/** Visit history badges – shows attractions previously visited in other trips,
 *  with rating-based color coding (green for VERY_GOOD/EXCELLENT, red otherwise). */
const visitHistoryDemo: VisitHistoryMap = new Map([
  [
    1, // Eiffel Tower – great experience, recent
    [
      {
        tripId: 101,
        tripName: "Paris Spring 2024",
        tripFromDate: "2024-04-10",
        tripToDate: "2024-04-17",
        rating: "EXCELLENT",
        reviewNote: "Magical at sunset, summit was worth the wait.",
        wouldVisitAgain: true
      }
    ]
  ],
  [
    2, // Louvre – multiple past visits, latest very good
    [
      {
        tripId: 102,
        tripName: "Paris Winter 2023",
        tripFromDate: "2023-12-20",
        tripToDate: "2023-12-27",
        rating: "VERY_GOOD",
        reviewNote: "Loved the Denon wing, skipped the Mona Lisa crowd.",
        wouldVisitAgain: true
      },
      {
        tripId: 90,
        tripName: "Backpacking Europe 2019",
        tripFromDate: "2019-07-01",
        tripToDate: "2019-07-05",
        rating: "AVERAGE",
        reviewNote: "Too crowded in summer.",
        wouldVisitAgain: false
      }
    ]
  ],
  [
    4, // Montmartre – disappointing last visit (renders red badge)
    [
      {
        tripId: 103,
        tripName: "Paris Quick Stop 2022",
        tripFromDate: "2022-09-02",
        tripToDate: "2022-09-04",
        rating: "BELOW_AVERAGE",
        reviewNote: "Tourist traps everywhere on Place du Tertre.",
        wouldVisitAgain: false
      }
    ]
  ],
  [
    7, // La Défense – older visit, average rating
    [
      {
        tripId: 104,
        tripName: "Business Trip Paris 2021",
        tripFromDate: "2021-05-11",
        tripToDate: "2021-05-13",
        rating: "AVERAGE",
        reviewNote: "Quick stop between meetings."
      }
    ]
  ]
]);

export const WithVisitHistoryBadges: Story = {
  args: {
    initialCities,
    visitHistory: visitHistoryDemo
  }
};
