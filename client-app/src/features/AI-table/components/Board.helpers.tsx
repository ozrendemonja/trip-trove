import type { Decorator } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import makeServer from "../../../ServerSetup";
import type { Attraction } from "./AttractionList";
import type { TouristDestination } from "./Board.types";

// Blue page background shared by every Board story group.
const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

export const styleDecorator: Decorator = (Story) => (
  <>
    <Story />
    <style>{styleOverrides}</style>
  </>
);

// A single Mirage instance backs the trip-aware stories (review flows). It is
// created lazily and reused so repeated re-renders don't stack interceptors.
let server: ReturnType<typeof makeServer> | undefined;
export const withServer: Decorator = (Story) => {
  if (!server) server = makeServer();
  return <Story />;
};

export const setupUser = (): ReturnType<typeof userEvent.setup> =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

export const makeAttraction = (id: number, name: string): Attraction => ({
  id,
  name,
  mustVisit: false,
  stable: true,
  isTraditional: false,
  isCountrywide: false,
  address: "",
  category: "POINT_OF_INTEREST_AND_LANDMARK",
  infoFrom: "",
  note: "",
  VisitTime: ""
});

/** Locate an attraction card (its <li>) by the attraction's visible name. */
export const findAttractionCard = (
  canvasElement: HTMLElement,
  name: string
): HTMLElement =>
  within(canvasElement)
    .getByRole("link", { name })
    .closest("li.attraction") as HTMLElement;

/** A board with one city holding a single Top-Attractions card. */
export const oneAttractionBoard = (
  overrides: Partial<Attraction> = {}
): TouristDestination[] => [
  {
    name: "Monaco",
    columns: [
      {
        id: "monaco_top",
        title: "Top Attractions",
        tasks: [{ ...makeAttraction(1, "Casino Square"), ...overrides }]
      },
      { id: "monaco_secondary", title: "Secondary Spots", tasks: [] },
      { id: "monaco_excluded", title: "Excluded Attractions", tasks: [] }
    ]
  }
];

/** A board with one city whose Top-Attractions column holds the given cards. */
export const reviewBoard = (tasks: Attraction[]): TouristDestination[] => [
  {
    name: "Monaco",
    columns: [
      { id: "monaco_top", title: "Top Attractions", tasks },
      { id: "monaco_secondary", title: "Secondary Spots", tasks: [] },
      { id: "monaco_excluded", title: "Excluded Attractions", tasks: [] }
    ]
  }
];

/** Two cities (Monaco with two Top cards + Bavaria) for delete / drag-drop. */
export const tripBoard: TouristDestination[] = [
  {
    name: "Monaco",
    columns: [
      {
        id: "monaco_top",
        title: "Top Attractions",
        tasks: [
          makeAttraction(1, "Casino Square"),
          makeAttraction(2, "Oceanographic Museum")
        ]
      },
      {
        id: "monaco_secondary",
        title: "Secondary Spots",
        tasks: [makeAttraction(3, "Larvotto Beach")]
      },
      { id: "monaco_excluded", title: "Excluded Attractions", tasks: [] }
    ]
  },
  {
    name: "Bavaria",
    columns: [
      {
        id: "bavaria_top",
        title: "Top Attractions",
        tasks: [makeAttraction(4, "Neuschwanstein Castle")]
      },
      { id: "bavaria_secondary", title: "Secondary Spots", tasks: [] },
      { id: "bavaria_excluded", title: "Excluded Attractions", tasks: [] }
    ]
  }
];
