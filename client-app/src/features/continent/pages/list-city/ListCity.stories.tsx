import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import CityList from "./ListCity";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

let server: ReturnType<typeof makeServer>;

const meta: Meta<typeof CityList> = {
  component: CityList,
  decorators: [
    (Story) => {
      // Tear down the previous story's Mirage server before starting a new one;
      // otherwise multiple Pretender instances stack up and corrupt paginated
      // reloads (sort/delete) when the runner plays stories back to back.
      server?.shutdown();
      server = makeServer();
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

type Story = StoryObj<typeof CityList>;
type User = ReturnType<typeof userEvent.setup>;

// Fluent modals/callouts animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Clicking instantly (delay: null)
// avoids racing the debounced reload effect that fires on every change.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// Fluent modals, sort-dropdown options, autocomplete suggestions and delete
// confirmation dialogs portal into a layer appended to <body>, outside the story
// canvas, so their contents are queried through the document, not the canvas.
const overlay = (canvasElement: HTMLElement): ReturnType<typeof within> =>
  within(canvasElement.ownerDocument.body);

const waitForCitiesToLoad = (
  canvasElement: HTMLElement
): Promise<HTMLElement> =>
  within(canvasElement).findByRole(
    "button",
    { name: "Change city name for Kaunas" },
    { timeout: 5000 }
  );

const waitForAllCitiesToLoad = (
  canvasElement: HTMLElement
): Promise<HTMLElement> =>
  within(canvasElement).findByRole(
    "button",
    { name: "Change city name for Monaco" },
    { timeout: 5000 }
  );

const searchFor = async (
  canvasElement: HTMLElement,
  user: User,
  text: string
): Promise<void> => {
  const box = within(canvasElement).getByRole("searchbox");
  await user.clear(box);
  await user.type(box, text);
};

const openCityNameEditor = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", {
      name: `Change city name for ${name}`
    })
  );
  await overlay(canvasElement).findByRole("heading", {
    name: `Modifying ${name}`
  });
};

const openCityRegionEditor = async (
  canvasElement: HTMLElement,
  user: User,
  region: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", {
      name: `Change region name from ${region}`
    })
  );
  await overlay(canvasElement).findByRole("heading", {
    name: `Modifying ${region}`
  });
};

const selectCityRow = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<HTMLElement> => {
  const row = within(canvasElement)
    .getByRole("button", { name: `Change city name for ${name}` })
    .closest('div[role="row"]') as HTMLElement;
  await user.click(within(row).getByRole("radio", { name: "select row" }));
  return row;
};

const openCityDeleteDialog = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await selectCityRow(canvasElement, user, name);
  await user.click(
    await within(canvasElement).findByRole(
      "menuitem",
      { name: "Delete city" },
      { timeout: 1000 }
    )
  );
  await overlay(canvasElement).findByRole(
    "button",
    { name: "Delete" },
    { timeout: 500 }
  );
  await overlay(canvasElement).findByRole("button", { name: "Delete" });
};

export const Primary: Story = {};

export const SearchIgnoresShortInput: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);

    await searchFor(canvasElement, user, "Vi");

    expect(
      within(canvasElement).queryByRole("menuitem", {
        name: "Vilnius , Dzūkija, Lithuania"
      })
    ).not.toBeInTheDocument();
  }
};

export const SearchShowsSubstringMatches: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);

    await searchFor(canvasElement, user, "Viln");

    const suggestions = await within(canvasElement).findAllByRole("menuitem", {
      name: "Vilnius , Dzūkija, Lithuania"
    });
    expect(suggestions).toHaveLength(1);
  }
};

export const ClearsSearchInputAndSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);

    await searchFor(canvasElement, user, "Viln");
    await within(canvasElement).findByRole("menuitem", {
      name: "Vilnius , Dzūkija, Lithuania"
    });
    await user.click(
      within(canvasElement).getByRole("button", { name: "Clear text" })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("menuitem", {
          name: "Vilnius , Dzūkija, Lithuania"
        })
      ).not.toBeInTheDocument()
    );
    expect(within(canvasElement).getByRole("searchbox")).toHaveValue("");
  }
};

export const SelectsSuggestionFromDropdown: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);

    await searchFor(canvasElement, user, "Viln");
    await user.click(
      await within(canvasElement).findByRole("menuitem", {
        name: "Vilnius , Dzūkija, Lithuania"
      })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("menuitem", {
          name: "Vilnius , Dzūkija, Lithuania"
        })
      ).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("button", {
          name: "Change city name for Kaunas"
        })
      ).not.toBeInTheDocument()
    );
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change city name for Vilnius"
      })
    ).toBeInTheDocument();
    expect(
      within(canvasElement).getAllByRole("button", {
        name: /Change city name for/
      })
    ).toHaveLength(1);
  }
};

export const EditCityNameShowsErrorWhenEmpty: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityNameEditor(canvasElement, user, "Kaunas");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Alytus");
    await user.clear(field);
    await user.tab();

    await overlay(canvasElement).findByText(
      "City name may not be null or empty"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const EditCityNameShowsErrorWhenTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityNameEditor(canvasElement, user, "Kaunas");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.click(field);
    await user.paste("a".repeat(257));
    await user.tab();

    await overlay(canvasElement).findByText(
      "City name may not be longer then 256 characters"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const KeepsCityNameWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityNameEditor(canvasElement, user, "Kaunas");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Kaunas"
        })
      ).not.toBeInTheDocument()
    );
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change city name for Kaunas"
      })
    ).toBeInTheDocument();
    expect(
      within(canvasElement).queryByRole("button", {
        name: "Change city name for Test"
      })
    ).not.toBeInTheDocument();
  }
};

export const UpdatesCityName: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityNameEditor(canvasElement, user, "Kaunas");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Alytus");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await within(canvasElement).findByRole(
      "button",
      { name: "Change city name for Alytus" },
      { timeout: 5000 }
    );
  }
};

export const DisablesUpdateAfterEditingSelectedRegion: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityRegionEditor(canvasElement, user, "Aukštaitija");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Sam");
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", { name: "Samogitia" })
    );
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Update" })
      ).toBeEnabled()
    );

    await user.click(field);
    await user.type(field, "a");
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Update" })
      ).toBeDisabled()
    );
  }
};

export const UpdatesCityRegion: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityRegionEditor(canvasElement, user, "Aukštaitija");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Sam");
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", { name: "Samogitia" })
    );
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).getAllByRole("gridcell", { name: /Samogitia/ })
        ).toHaveLength(2),
      { timeout: 5000 }
    );
  }
};

export const KeepsCityRegionWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);

    await openCityRegionEditor(canvasElement, user, "Aukštaitija");
    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Dzūkija");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Aukštaitija"
        })
      ).not.toBeInTheDocument()
    );
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change region name from Aukštaitija"
      })
    ).toBeInTheDocument();
  }
};

export const ShowsAllCities: Story = {
  play: async ({ canvasElement }) => {
    await waitForAllCitiesToLoad(canvasElement);

    ["Vilnius", "Kaunas", "Šiauliai", "Monaco"].forEach((name) =>
      expect(
        within(canvasElement).getByRole("button", {
          name: `Change city name for ${name}`
        })
      ).toBeInTheDocument()
    );
  }
};

export const SortsByOldest: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllCitiesToLoad(canvasElement);

    const vilnius = within(canvasElement).getByRole("button", {
      name: "Change city name for Vilnius"
    });
    expect(
      within(canvasElement).getAllByRole("button", {
        name: /Change city name for/
      })[0]
    ).toBe(vilnius);

    await user.click(within(canvasElement).getByRole("combobox"));
    await user.click(
      await overlay(canvasElement).findByRole("option", { name: "Oldest" })
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).getAllByRole("button", {
            name: /Change city name for/
          })[0]
        ).not.toBe(
          within(canvasElement).queryByRole("button", {
            name: "Change city name for Vilnius"
          })
        ),
      { timeout: 5000 }
    );
  }
};

export const SelectsCityViaCheckbox: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllCitiesToLoad(canvasElement);

    const row = within(canvasElement)
      .getByRole("button", { name: "Change city name for Monaco" })
      .closest('div[role="row"]') as HTMLElement;
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  }
};

export const SelectsCityViaRowClick: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllCitiesToLoad(canvasElement);

    const row = within(canvasElement)
      .getByRole("button", { name: "Change city name for Kaunas" })
      .closest('div[role="row"]') as HTMLElement;
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    await user.click(within(row).getByText("Lithuania"));

    expect(checkbox).toBeChecked();
  }
};

export const EnablesDeleteMenuWhenRowSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllCitiesToLoad(canvasElement);
    await openCityDeleteDialog(canvasElement, user, "Monaco");

    expect(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    ).toBeEnabled();
    expect(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    ).toBeEnabled();
  }
};

export const KeepsCitiesWhenDeleteCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllCitiesToLoad(canvasElement);
    await openCityDeleteDialog(canvasElement, user, "Monaco");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("button", { name: "Delete" })
      ).not.toBeInTheDocument()
    );

    ["Vilnius", "Kaunas", "Šiauliai", "Monaco"].forEach((name) =>
      expect(
        within(canvasElement).getByRole("button", {
          name: `Change city name for ${name}`
        })
      ).toBeInTheDocument()
    );
  }
};

export const DisablesDeleteButtonsWhileDeleting: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllCitiesToLoad(canvasElement);
    await openCityDeleteDialog(canvasElement, user, "Monaco");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Cancel" })
      ).toBeDisabled()
    );
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Delete" })
      ).toBeDisabled()
    );
  }
};

export const RemovesCityWhenDeleted: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllCitiesToLoad(canvasElement);
    await openCityDeleteDialog(canvasElement, user, "Monaco");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("button", { name: "Delete" })
      ).not.toBeInTheDocument()
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).queryByRole("button", {
            name: "Change city name for Monaco"
          })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
  }
};

export const OpensCityNameEditorPrepopulated: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityNameEditor(canvasElement, user, "Kaunas");

    expect(overlay(canvasElement).getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Kaunas"
    );
  }
};

export const DisablesCityNameButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityNameEditor(canvasElement, user, "Kaunas");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Alytus");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Cancel" })
      ).toBeDisabled()
    );
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Update" })
      ).toBeDisabled()
    );
  }
};

export const OpensCityRegionEditorPrepopulated: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityRegionEditor(canvasElement, user, "Aukštaitija");

    expect(overlay(canvasElement).getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Aukštaitija"
    );
  }
};

export const DisablesCityRegionButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCitiesToLoad(canvasElement);
    await openCityRegionEditor(canvasElement, user, "Aukštaitija");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Sam");
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", { name: "Samogitia" })
    );
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Cancel" })
      ).toBeDisabled()
    );
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Update" })
      ).toBeDisabled()
    );
  }
};
