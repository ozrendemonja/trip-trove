import { Meta, StoryObj } from "@storybook/react";
import { expect, fireEvent, within } from "storybook/test";
import Board from "./Board";
import type { Attraction } from "./AttractionList.types";
import type { TouristDestination } from "./Board.types";
import { makeAttraction, setupUser, styleDecorator } from "./Board.helpers";

const meta: Meta<typeof Board> = {
  title: "features/AI-table/components/Board/Filters",
  component: Board,
  decorators: [styleDecorator]
};
export default meta;

type Story = StoryObj<typeof Board>;

const positiveAttractionName = "Grand Museum";
const negativeAttractionName = "Corner Diner";
const attractionMatchingPositiveFilters: Attraction = {
  ...makeAttraction(1, positiveAttractionName),
  isCountrywide: true,
  mustVisit: true,
  isTraditional: true,
  stable: true,
  category: "ART_MUSEUM"
};

const attractionMatchingNegativeFilters: Attraction = {
  ...makeAttraction(2, negativeAttractionName),
  isCountrywide: false,
  mustVisit: false,
  isTraditional: false,
  stable: false,
  category: "FOOD"
};

const boardWithOpposedAttractions: TouristDestination[] = [
  {
    name: "Monaco",
    columns: [
      {
        id: "monaco_top",
        title: "Top Attractions",
        tasks: [
          attractionMatchingPositiveFilters,
          attractionMatchingNegativeFilters
        ]
      },
      { id: "monaco_secondary", title: "Secondary Spots", tasks: [] },
      { id: "monaco_excluded", title: "Excluded Attractions", tasks: [] }
    ]
  }
];

// Aliases for each filter <select>'s option values, named after the labels the
// options show in the UI, so the play steps read in domain terms instead of
// raw "true"/"false"/"any" strings.
const Any = "any"; // shared "Any" option on every filter
const Countrywide = "true"; // Countrywide filter
const Local = "false";
const MustVisit = "true"; // Must Visit filter
const SkipWorthy = "false";
const Traditional = "true"; // Traditional filter
const Modern = "false";
const Stable = "true"; // Stability filter
const PotentialChange = "false";
const ArtMuseum = "ART_MUSEUM"; // Category filter
const Food = "FOOD";

export const FiltersByCountrywide: Story = {
  args: { initialCities: boardWithOpposedAttractions },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const select = canvas.getByRole("combobox", { name: /Countrywide/ });

    await user.selectOptions(select, Countrywide);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: negativeAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, Local);
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: positiveAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, Any);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
  }
};

export const FiltersByMustVisit: Story = {
  args: { initialCities: boardWithOpposedAttractions },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const select = canvas.getByRole("combobox", { name: /Must Visit/ });

    await user.selectOptions(select, MustVisit);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: negativeAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, SkipWorthy);
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: positiveAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, Any);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
  }
};

export const ReordersVisibleAttractionWithoutMovingFilteredCards: Story = {
  args: {
    initialCities: [
      {
        name: "Monaco",
        columns: [
          {
            id: "monaco_top",
            title: "Top Attractions",
            tasks: [
              attractionMatchingNegativeFilters,
              attractionMatchingPositiveFilters,
              { ...attractionMatchingPositiveFilters, id: 3, name: "Old Town" }
            ]
          },
          { id: "monaco_secondary", title: "Secondary Spots", tasks: [] },
          { id: "monaco_excluded", title: "Excluded Attractions", tasks: [] }
        ]
      }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const mustVisitFilter = canvas.getByRole("combobox", {
      name: /Must Visit/
    });
    await user.selectOptions(mustVisitFilter, MustVisit);

    const topColumn = canvas
      .getByRole("heading", { name: "Top Attractions" })
      .closest(".attraction-board-column") as HTMLElement;
    const oldTownCard = topColumn.querySelector(
      'li.attraction[data-id="3"]'
    ) as HTMLElement;
    const dataTransfer = new DataTransfer();
    fireEvent.dragStart(oldTownCard, { dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.dragOver(topColumn, { clientY: -1, dataTransfer });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.drop(topColumn, { dataTransfer });

    await user.selectOptions(mustVisitFilter, Any);
    const attractionIds = Array.from(
      topColumn.querySelectorAll("li.attraction")
    ).map((element) => element.getAttribute("data-id"));
    await expect(attractionIds).toEqual(["2", "3", "1"]);
  }
};

export const FiltersByTraditional: Story = {
  args: { initialCities: boardWithOpposedAttractions },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const select = canvas.getByRole("combobox", { name: /Traditional/ });

    await user.selectOptions(select, Traditional);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: negativeAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, Modern);
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: positiveAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, Any);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
  }
};

export const FiltersByStability: Story = {
  args: { initialCities: boardWithOpposedAttractions },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const select = canvas.getByRole("combobox", { name: /Stability/ });

    await user.selectOptions(select, Stable);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: negativeAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, PotentialChange);
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: positiveAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, Any);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
  }
};

export const FiltersByCategory: Story = {
  args: { initialCities: boardWithOpposedAttractions },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const select = canvas.getByRole("combobox", { name: /Category/ });

    await user.selectOptions(select, ArtMuseum);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: negativeAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, Food);
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: positiveAttractionName })
    ).not.toBeInTheDocument();

    await user.selectOptions(select, Any);
    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
  }
};

export const ResetFiltersRestoresAllAttractions: Story = {
  args: { initialCities: boardWithOpposedAttractions },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await user.selectOptions(
      canvas.getByRole("combobox", { name: /Countrywide/ }),
      Countrywide
    );
    await user.selectOptions(
      canvas.getByRole("combobox", { name: /Category/ }),
      ArtMuseum
    );
    await expect(
      canvas.queryByRole("link", { name: negativeAttractionName })
    ).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "Reset Filters" }));

    await expect(
      canvas.getByRole("link", { name: positiveAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: negativeAttractionName })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("combobox", { name: /Countrywide/ })
    ).toHaveValue(Any);
    await expect(
      canvas.getByRole("combobox", { name: /Category/ })
    ).toHaveValue(Any);
  }
};
