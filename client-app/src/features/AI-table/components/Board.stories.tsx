import { Meta, StoryObj } from "@storybook/react";
import { within, userEvent } from "@storybook/test";
import Board from "./Board";
import type { TouristDestination } from "./Board.types";
import { initialCities } from "../data/initialCities";
import makeServer from "../../../ServerSetup";
import type { VisitHistoryMap } from "../utils/Mapper";

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
const citiesWithItinerary: TouristDestination[] = initialCities.map((city) => ({
  ...city,
  columns: city.columns.map((col) => ({
    ...col,
    tasks: col.tasks.map((t) => ({
      ...t,
      inItinerary: t.mustVisit
    }))
  }))
}));

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
