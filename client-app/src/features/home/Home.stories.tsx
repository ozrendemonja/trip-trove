import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { MemoryRouter } from "react-router";
import Home from "./Home";
import makeServer from "../../ServerSetup";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof Home> = {
  component: Home,
  decorators: [
    (Story) => {
      makeServer();
      return (
        <>
          <MemoryRouter initialEntries={["/"]}>
            <Story />
          </MemoryRouter>
          <style>{styleOverrides}</style>
        </>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof Home>;
type User = ReturnType<typeof userEvent.setup>;

// Fluent callouts/options animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Typing instantly (delay: null)
// avoids re-running the debounced suggestion effect on every keystroke.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

const selectSearchCategory = (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => user.click(within(canvasElement).getByText(name));

const search = (
  canvasElement: HTMLElement,
  user: User,
  query: string
): Promise<void> =>
  user.type(within(canvasElement).getByPlaceholderText("Search"), query);

const findSuggestion = (
  canvasElement: HTMLElement,
  name: string
): Promise<HTMLElement> =>
  within(canvasElement).findByRole("menuitem", { name }, { timeout: 5000 });

const expectSuggestionGone = (
  canvasElement: HTMLElement,
  name: string
): Promise<void> =>
  waitFor(() =>
    expect(
      within(canvasElement).queryByRole("menuitem", { name })
    ).not.toBeInTheDocument()
  );

export const Primary: Story = {};

export const ShowsHomeOverviewAndExpandsDashboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    // App title.
    expect(
      canvas.getByRole("heading", { name: "Trip Trove" })
    ).toBeInTheDocument();

    // Countries-visited gauge and the map shortcut.
    expect(canvas.getByText("Countries visited")).toBeInTheDocument();
    expect(
      canvas.getByRole("button", { name: "Open countries visited map" })
    ).toBeInTheDocument();

    // Every search category is offered. Checked before expanding Dashboard,
    // whose sub-links would otherwise duplicate these names.
    ["Continent", "Country", "Region", "City", "Main attraction"].forEach(
      (category) => {
        expect(canvas.getByText(category)).toBeInTheDocument();
      }
    );

    // Expanding "Dashboard" reveals its sub-links.
    await user.click(canvas.getByRole("button", { name: "Dashboard" }));
    expect(
      await canvas.findByRole("link", { name: "Attractions" })
    ).toBeInTheDocument();
  }
};

export const SearchingSuggestsMatchingContinents: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await search(canvasElement, user, "Abc");

    await findSuggestion(canvasElement, "Europe");
    expect(
      canvas.getAllByRole("menuitem").map((item) => item.textContent)
    ).toEqual(["Asia", "Europe", "Australia"]);
  }
};

export const SelectsSuggestedContinent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await search(canvasElement, user, "Abc");
    await user.click(await findSuggestion(canvasElement, "Europe"));

    expect(canvas.getByPlaceholderText("Search")).toHaveValue("Europe");
    await expectSuggestionGone(canvasElement, "Europe");
  }
};

export const SearchingSuggestsMatchingCountries: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectSearchCategory(canvasElement, user, "Country");
    await search(canvasElement, user, "Mon");

    await findSuggestion(canvasElement, "Monaco");
    expect(
      canvas.getAllByRole("menuitem").map((item) => item.textContent)
    ).toEqual(["Monaco"]);
  }
};

export const SelectsSuggestedCountry: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectSearchCategory(canvasElement, user, "Country");
    await search(canvasElement, user, "Mon");
    await user.click(await findSuggestion(canvasElement, "Monaco"));

    expect(canvas.getByPlaceholderText("Search")).toHaveValue("Monaco");
    await expectSuggestionGone(canvasElement, "Monaco");
  }
};

export const SearchingSuggestsMatchingRegions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectSearchCategory(canvasElement, user, "Region");
    await search(canvasElement, user, "Mon");

    await findSuggestion(canvasElement, "Monaco");
    expect(
      canvas.getAllByRole("menuitem").map((item) => item.textContent)
    ).toEqual(["Monaco"]);
  }
};

export const SelectsSuggestedRegion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectSearchCategory(canvasElement, user, "Region");
    await search(canvasElement, user, "Mon");
    await user.click(await findSuggestion(canvasElement, "Monaco"));

    expect(canvas.getByPlaceholderText("Search")).toHaveValue("Monaco");
    await expectSuggestionGone(canvasElement, "Monaco");
  }
};

export const SearchingSuggestsMatchingCities: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectSearchCategory(canvasElement, user, "City");
    await search(canvasElement, user, "Mon");

    await findSuggestion(canvasElement, "Monaco, Monaco, Monaco");
    expect(
      canvas.getAllByRole("menuitem").map((item) => item.textContent)
    ).toEqual(["Monaco, Monaco, Monaco"]);
  }
};

export const SelectsSuggestedCity: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectSearchCategory(canvasElement, user, "City");
    await search(canvasElement, user, "Mon");
    await user.click(
      await findSuggestion(canvasElement, "Monaco, Monaco, Monaco")
    );

    expect(canvas.getByPlaceholderText("Search")).toHaveValue(
      "Monaco, Monaco, Monaco"
    );
    await expectSuggestionGone(canvasElement, "Monaco, Monaco, Monaco");
  }
};

export const SearchingSuggestsMatchingMainAttractions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectSearchCategory(canvasElement, user, "Main attraction");
    await search(canvasElement, user, "Cas");

    await findSuggestion(canvasElement, "Casino Square");
    expect(
      canvas.getAllByRole("menuitem").map((item) => item.textContent)
    ).toEqual(["Casino Square"]);
  }
};

export const SelectsSuggestedMainAttraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectSearchCategory(canvasElement, user, "Main attraction");
    await search(canvasElement, user, "Cas");
    await user.click(await findSuggestion(canvasElement, "Casino Square"));

    expect(canvas.getByPlaceholderText("Search")).toHaveValue("Casino Square");
    await expectSuggestionGone(canvasElement, "Casino Square");
  }
};
