import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import RegionList from "./ListRegion";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

let server: ReturnType<typeof makeServer>;

const meta: Meta<typeof RegionList> = {
  component: RegionList,
  decorators: [
    (Story, context) => {
      // Tear down the previous story's Mirage server before starting a new one;
      // otherwise multiple Pretender instances stack up and corrupt paginated
      // reloads (sort/delete) when the runner plays stories back to back.
      server?.shutdown();
      server = makeServer({
        updateRegionStatus: context.parameters.updateRegionStatus as
          number | undefined
      });
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

type Story = StoryObj<typeof RegionList>;
type User = ReturnType<typeof userEvent.setup>;

// Fluent modals/callouts animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Clicking instantly (delay: null)
// avoids racing the debounced reload effect that fires on every change.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// Fluent modals, sort-dropdown options and delete confirmation dialogs portal
// into a layer appended to <body>, outside the story canvas, so their contents
// are queried through the document, not the story canvas.
const overlay = (canvasElement: HTMLElement): ReturnType<typeof within> =>
  within(canvasElement.ownerDocument.body);

const expectSuggestionBelowInput = (
  input: HTMLElement,
  suggestion: HTMLElement
): void => {
  const inputRect =
    input
      .closest<HTMLElement>(".fui-Input, .fui-Textarea")
      ?.getBoundingClientRect() ?? input.getBoundingClientRect();
  const suggestionRect = suggestion.getBoundingClientRect();

  expect(Math.abs(suggestionRect.left - inputRect.left)).toBeLessThan(1);
  expect(Math.abs(suggestionRect.right - inputRect.right)).toBeLessThan(1);
  expect(Math.abs(suggestionRect.top - inputRect.bottom)).toBeLessThan(1);
};

const waitForCanvasToBecomeAccessible = async (
  canvasElement: HTMLElement
): Promise<void> => {
  await waitFor(() => expect(canvasElement).not.toHaveAttribute("aria-hidden"));
};

const waitForRegionsToLoad = (
  canvasElement: HTMLElement
): Promise<HTMLElement> =>
  within(canvasElement).findByRole(
    "button",
    { name: "Change region name from Monaco" },
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

const openRegionNameEditor = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", {
      name: `Change region name from ${name}`
    })
  );
  await overlay(canvasElement).findByRole("heading", {
    name: `Modifying ${name}`
  });
};

const openRegionCountryEditor = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  const buttons = within(canvasElement).getAllByRole("button", {
    name: "Change country name from Lithuania"
  });
  await user.click(buttons[0]);
  await overlay(canvasElement).findByRole("heading", {
    name: "Modifying Lithuania"
  });
};

const selectRegionRow = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<HTMLElement> => {
  const row = within(canvasElement)
    .getByRole("button", { name: `Change region name from ${name}` })
    .closest('div[role="row"]') as HTMLElement;
  await user.click(within(row).getByRole("radio", { name: "select row" }));
  return row;
};

const openRegionDeleteDialog = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await selectRegionRow(canvasElement, user, name);
  await user.click(
    await within(canvasElement).findByRole(
      "menuitem",
      { name: "Delete region" },
      { timeout: 5000 }
    )
  );
  await overlay(canvasElement).findByRole(
    "button",
    { name: "Delete" },
    { timeout: 1000 }
  );
  await overlay(canvasElement).findByRole("button", { name: "Delete" });
};

export const Primary: Story = {};

export const ShowsAllRegions: Story = {
  play: async ({ canvasElement }) => {
    await waitForRegionsToLoad(canvasElement);

    ["Dzūkija", "Aukštaitija", "Samogitia", "Monaco"].forEach((name) =>
      expect(
        within(canvasElement).getByRole("button", {
          name: `Change region name from ${name}`
        })
      ).toBeInTheDocument()
    );
  }
};

export const SearchIgnoresShortInput: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);

    await searchFor(canvasElement, user, "Sa");

    expect(
      within(canvasElement).queryByRole("menuitem", { name: "Samogitia" })
    ).not.toBeInTheDocument();
  }
};

export const SearchShowsSubstringMatches: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);

    await searchFor(canvasElement, user, "Sam");

    const suggestions = await within(canvasElement).findAllByRole("menuitem", {
      name: "Samogitia"
    });
    expect(suggestions).toHaveLength(1);
  }
};

export const ClearsSearchInputAndSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);

    await searchFor(canvasElement, user, "Sam");
    await within(canvasElement).findByRole("menuitem", { name: "Samogitia" });
    await user.click(
      within(canvasElement).getByRole("button", { name: "Clear text" })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("menuitem", { name: "Samogitia" })
      ).not.toBeInTheDocument()
    );
    expect(within(canvasElement).getByRole("searchbox")).toHaveValue("");
  }
};

export const SelectsSuggestionFromDropdown: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);

    await searchFor(canvasElement, user, "Sam");
    await user.click(
      await within(canvasElement).findByRole("menuitem", { name: "Samogitia" })
    );

    // Choosing a suggestion pins the table to that single region, so every
    // other region drops off and only Samogitia stays on screen.
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("button", {
          name: "Change region name from Monaco"
        })
      ).not.toBeInTheDocument()
    );
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change region name from Samogitia"
      })
    ).toBeInTheDocument();
    ["Monaco", "Aukštaitija", "Dzūkija"].forEach((name) =>
      expect(
        within(canvasElement).queryByRole("button", {
          name: `Change region name from ${name}`
        })
      ).not.toBeInTheDocument()
    );
  }
};

export const EditRegionNameShowsErrorWhenEmpty: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionNameEditor(canvasElement, user, "Monaco");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Aukštaitija");
    await user.clear(field);
    await user.tab();

    await overlay(canvasElement).findByText(
      "Region name may not be null or empty"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const EditRegionNameShowsErrorWhenTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionNameEditor(canvasElement, user, "Monaco");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.click(field);
    await user.paste("a".repeat(257));
    await user.tab();

    await overlay(canvasElement).findByText(
      "Region name may not be longer then 256 characters"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const KeepsRegionNameWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionNameEditor(canvasElement, user, "Monaco");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Monaco"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change region name from Monaco"
      })
    ).toBeInTheDocument();
    expect(
      within(canvasElement).queryByRole("button", {
        name: "Change region name from Test"
      })
    ).not.toBeInTheDocument();
  }
};

export const UpdatesRegionName: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionNameEditor(canvasElement, user, "Monaco");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Monaco update test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await within(canvasElement).findByRole(
      "button",
      { name: "Change region name from Monaco update test" },
      { timeout: 5000 }
    );
  }
};

export const ShowsConflictWhenUpdatedRegionNameAlreadyExists: Story = {
  parameters: { updateRegionStatus: 409 },
  play: async ({ canvasElement }) => {
    const modal = overlay(canvasElement);
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionNameEditor(canvasElement, user, "Aukštaitija");

    const field = modal.getByRole("textbox");
    await user.type(field, "Dzūkija");
    await user.click(modal.getByRole("button", { name: "Update" }));

    expect(
      await modal.findByText(
        "A region with this name already exists in this country."
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveValue("Dzūkija");
    expect(modal.getByRole("button", { name: "Update" })).toBeEnabled();
    expect(modal.getByRole("button", { name: "Cancel" })).toBeEnabled();

    await user.type(field, " updated");
    await waitFor(() =>
      expect(
        modal.queryByText(
          "A region with this name already exists in this country."
        )
      ).not.toBeInTheDocument()
    );
  }
};

export const DisablesUpdateAfterEditingSelectedCountry: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionCountryEditor(canvasElement, user);

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Mon");
    const suggestion = await overlay(canvasElement).findByRole("menuitem", {
      name: "Monaco"
    });
    expectSuggestionBelowInput(field, suggestion);
    await user.click(suggestion);
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Update" })
      ).toBeEnabled()
    );

    // Editing the value after a pick clears the selection and blocks updating.
    await user.click(field);
    await user.type(field, "a");
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Update" })
      ).toBeDisabled()
    );
  }
};

export const UpdatesRegionCountry: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionCountryEditor(canvasElement, user);

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Mon");
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", { name: "Monaco" })
    );
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).getAllByRole("gridcell", { name: /Monaco/ })
        ).toHaveLength(3),
      { timeout: 5000 }
    );
  }
};

export const ShowsConflictWhenRegionAlreadyExistsInSelectedCountry: Story = {
  parameters: { updateRegionStatus: 409 },
  play: async ({ canvasElement }) => {
    const modal = overlay(canvasElement);
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionCountryEditor(canvasElement, user);

    const field = modal.getByRole("textbox");
    await user.type(field, "Mon");
    await user.click(await modal.findByRole("menuitem", { name: "Monaco" }));
    await user.click(modal.getByRole("button", { name: "Update" }));

    expect(
      await modal.findByText(
        "A region with this name already exists in the selected country."
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveValue("Monaco");
    expect(modal.getByRole("button", { name: "Update" })).toBeEnabled();
    expect(modal.getByRole("button", { name: "Cancel" })).toBeEnabled();

    await user.type(field, " updated");
    await waitFor(() =>
      expect(
        modal.queryByText(
          "A region with this name already exists in the selected country."
        )
      ).not.toBeInTheDocument()
    );
  }
};

export const KeepsRegionCountryWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);

    const before = within(canvasElement).getAllByRole("button", {
      name: "Change country name from Lithuania"
    }).length;

    await openRegionCountryEditor(canvasElement, user);
    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Mon");
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", { name: "Monaco" })
    );
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Lithuania"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    // Cancelling a valid Monaco pick leaves every Lithuania region untouched.
    expect(
      within(canvasElement).getAllByRole("button", {
        name: "Change country name from Lithuania"
      })
    ).toHaveLength(before);
  }
};

export const SortsByOldest: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);

    // Newest-first (the default) lists Dzūkija on top.
    const dzukija = within(canvasElement).getByRole("button", {
      name: "Change region name from Dzūkija"
    });
    expect(
      within(canvasElement).getAllByRole("button", {
        name: /Change region name from/
      })[0]
    ).toBe(dzukija);

    await user.click(within(canvasElement).getByRole("combobox"));
    await user.click(
      await overlay(canvasElement).findByRole("option", { name: "Oldest" })
    );

    // Switching to Oldest re-queries and reorders the list, so Dzūkija is no
    // longer the first row.
    await waitFor(
      () =>
        expect(
          within(canvasElement).getAllByRole("button", {
            name: /Change region name from/
          })[0]
        ).not.toBe(
          within(canvasElement).queryByRole("button", {
            name: "Change region name from Dzūkija"
          })
        ),
      { timeout: 5000 }
    );
  }
};

export const SelectsRegionViaCheckbox: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);

    const row = within(canvasElement)
      .getByRole("button", { name: "Change region name from Monaco" })
      .closest('div[role="row"]') as HTMLElement;
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  }
};

export const SelectsRegionViaRowClick: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);

    const row = within(canvasElement)
      .getByRole("button", { name: "Change region name from Samogitia" })
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
    await waitForRegionsToLoad(canvasElement);
    await openRegionDeleteDialog(canvasElement, user, "Monaco");

    expect(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    ).toBeEnabled();
    expect(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    ).toBeEnabled();
  }
};

export const KeepsRegionsWhenDeleteCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionDeleteDialog(canvasElement, user, "Monaco");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("button", { name: "Delete" })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    // Cancelling removes nothing.
    ["Dzūkija", "Aukštaitija", "Samogitia", "Monaco"].forEach((name) =>
      expect(
        within(canvasElement).getByRole("button", {
          name: `Change region name from ${name}`
        })
      ).toBeInTheDocument()
    );
  }
};

export const DisablesDeleteButtonsWhileDeleting: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionDeleteDialog(canvasElement, user, "Monaco");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Cancel" })
      ).toBeDisabled()
    );
  }
};

export const RemovesRegionWhenDeleted: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionDeleteDialog(canvasElement, user, "Monaco");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).queryByRole("button", {
            name: "Change region name from Monaco"
          })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
  }
};

export const OpensRegionNameEditorPrepopulated: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionNameEditor(canvasElement, user, "Monaco");

    expect(overlay(canvasElement).getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Monaco"
    );
  }
};

export const DisablesRegionNameButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionNameEditor(canvasElement, user, "Monaco");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Monaco update test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Cancel" })
      ).toBeDisabled()
    );
  }
};

export const OpensRegionCountryEditorPrepopulated: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionCountryEditor(canvasElement, user);

    expect(overlay(canvasElement).getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Lithuania"
    );
  }
};

export const DisablesRegionCountryButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForRegionsToLoad(canvasElement);
    await openRegionCountryEditor(canvasElement, user);

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Mon");
    await user.click(
      await overlay(canvasElement).findByRole("menuitem", { name: "Monaco" })
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
