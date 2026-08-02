import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import CountryList from "./ListCountry";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

let server: ReturnType<typeof makeServer>;

const meta: Meta<typeof CountryList> = {
  component: CountryList,
  decorators: [
    (Story, context) => {
      // Tear down the previous story's Mirage server before starting a new one;
      // otherwise multiple Pretender instances stack up and corrupt paginated
      // reloads (sort/delete) when the runner plays stories back to back.
      server?.shutdown();
      server = makeServer({
        updateCountryStatus: context.parameters.updateCountryStatus as
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

type Story = StoryObj<typeof CountryList>;
type User = ReturnType<typeof userEvent.setup>;

// Fluent modals/callouts animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Clicking instantly (delay: null)
// avoids racing the debounced reload effect that fires on every change.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// Fluent modals, sort/continent dropdown options and delete confirmation dialogs
// portal into a layer appended to <body>, outside the story canvas, so their
// contents are queried through the document, not the story canvas.
const overlay = (canvasElement: HTMLElement): ReturnType<typeof within> =>
  within(canvasElement.ownerDocument.body);

const waitForCanvasToBecomeAccessible = (
  canvasElement: HTMLElement
): Promise<void> =>
  waitFor(() => expect(canvasElement).not.toHaveAttribute("aria-hidden"));

const waitForCountriesToLoad = (
  canvasElement: HTMLElement
): Promise<HTMLElement> =>
  within(canvasElement).findByRole(
    "button",
    { name: "Change country name for Monaco" },
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

const openCountryNameEditor = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", {
      name: `Change country name for ${name}`
    })
  );
  await overlay(canvasElement).findByRole("heading", {
    name: `Modifying ${name}`
  });
};

const openCountryContinentEditor = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", {
      name: `Change continent name from ${name}`
    })
  );
  await overlay(canvasElement).findByRole("heading", {
    name: `Modifying ${name}`
  });
};

const openCountryIsoCodeEditor = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", {
      name: `Change ISO code for ${name}`
    })
  );
  await overlay(canvasElement).findByRole("heading", {
    name: `Modifying ${name}`
  });
};

const selectContinent = async (
  canvasElement: HTMLElement,
  user: User,
  continent: string
): Promise<void> => {
  await user.click(
    overlay(canvasElement).getByRole("combobox", { name: "Select a continent" })
  );
  await user.click(
    await overlay(canvasElement).findByRole("option", { name: continent })
  );
};

const selectIsoCode = async (
  canvasElement: HTMLElement,
  user: User,
  optionName: string
): Promise<void> => {
  await user.click(
    overlay(canvasElement).getByRole("combobox", { name: "ISO code" })
  );
  await user.click(
    await overlay(canvasElement).findByRole(
      "option",
      { name: optionName },
      { timeout: 5000 }
    )
  );
};

const selectCountryRow = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<HTMLElement> => {
  const row = within(canvasElement)
    .getByRole("button", { name: `Change country name for ${name}` })
    .closest('div[role="row"]') as HTMLElement;
  await user.click(within(row).getByRole("radio", { name: "select row" }));
  return row;
};

const openCountryDeleteDialog = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await selectCountryRow(canvasElement, user, name);
  await user.click(
    await within(canvasElement).findByRole(
      "menuitem",
      { name: "Delete country" },
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

export const SearchIgnoresShortInput: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);

    await searchFor(canvasElement, user, "Li");

    // Fewer than 3 characters never triggers a lookup, so no suggestion shows.
    expect(
      within(canvasElement).queryByRole("menuitem", { name: "Lithuania" })
    ).not.toBeInTheDocument();
  }
};

export const SearchShowsSubstringMatches: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);

    await searchFor(canvasElement, user, "Lit");

    const suggestions = await within(canvasElement).findAllByRole("menuitem", {
      name: "Lithuania"
    });
    expect(suggestions).toHaveLength(1);
  }
};

export const ClearsSearchInputAndSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);

    await searchFor(canvasElement, user, "Lit");
    await within(canvasElement).findByRole("menuitem", { name: "Lithuania" });
    await user.click(
      within(canvasElement).getByRole("button", { name: "Clear text" })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("menuitem", { name: "Lithuania" })
      ).not.toBeInTheDocument()
    );
    expect(within(canvasElement).getByRole("searchbox")).toHaveValue("");
  }
};

export const ShowsOnlyPickedCountryAfterChoosingSuggestion: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);

    await searchFor(canvasElement, user, "Lit");
    await user.click(
      await within(canvasElement).findByRole("menuitem", { name: "Lithuania" })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("button", {
          name: "Change country name for Monaco"
        })
      ).not.toBeInTheDocument()
    );
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change country name for Lithuania"
      })
    ).toBeInTheDocument();
    ["Monaco", "San Marino", "Liechtenstein"].forEach((name) =>
      expect(
        within(canvasElement).queryByRole("button", {
          name: `Change country name for ${name}`
        })
      ).not.toBeInTheDocument()
    );
  }
};

export const EditCountryNameShowsErrorWhenEmpty: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryNameEditor(canvasElement, user, "Liechtenstein");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Andorra");
    await user.clear(field);
    await user.tab();

    await overlay(canvasElement).findByText(
      "Country name may not be null or empty"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const EditCountryNameShowsErrorWhenTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryNameEditor(canvasElement, user, "Liechtenstein");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.click(field);
    await user.paste("a".repeat(257));
    await user.tab();

    await overlay(canvasElement).findByText(
      "Country name may not be longer then 256 characters"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const KeepsCountryNameWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryNameEditor(canvasElement, user, "Liechtenstein");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );
    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Liechtenstein"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    expect(
      within(canvasElement).getByRole("button", {
        name: "Change country name for Liechtenstein"
      })
    ).toBeInTheDocument();
    expect(
      within(canvasElement).queryByRole("button", {
        name: "Change country name for Test"
      })
    ).not.toBeInTheDocument();
  }
};

export const UpdatesCountryName: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryNameEditor(canvasElement, user, "Liechtenstein");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Liechtenstein update test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await within(canvasElement).findByRole(
      "button",
      { name: "Change country name for Liechtenstein update test" },
      { timeout: 5000 }
    );
    expect(
      within(canvasElement).queryByRole("button", {
        name: "Change country name for Liechtenstein"
      })
    ).not.toBeInTheDocument();
  }
};

export const ShowsConflictWhenUpdatedCountryNameAlreadyExists: Story = {
  parameters: { updateCountryStatus: 409 },
  play: async ({ canvasElement }) => {
    const modal = overlay(canvasElement);
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryNameEditor(canvasElement, user, "Liechtenstein");

    const field = modal.getByRole("textbox");
    await user.type(field, "Monaco");
    await user.click(modal.getByRole("button", { name: "Update" }));

    expect(
      await modal.findByText(
        "A country with this name already exists in this continent."
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
          "A country with this name already exists in this continent."
        )
      ).not.toBeInTheDocument()
    );
  }
};

export const UpdatesCountryContinent: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryContinentEditor(canvasElement, user, "Liechtenstein");

    await selectContinent(canvasElement, user, "Australia");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await within(canvasElement).findByRole(
      "gridcell",
      { name: /Australia/ },
      { timeout: 5000 }
    );

    const row = within(canvasElement)
      .getByRole("button", {
        name: "Change country name for Liechtenstein"
      })
      .closest('div[role="row"]') as HTMLElement;
    expect(within(row).getByText("Australia")).toBeInTheDocument();
    const liechtensteinRow = within(canvasElement)
      .getByRole("button", { name: "Change country name for Liechtenstein" })
      .closest('div[role="row"]') as HTMLElement;
    expect(
      within(liechtensteinRow).queryByText("Europe")
    ).not.toBeInTheDocument();
  }
};

export const ShowsConflictWhenCountryAlreadyExistsInSelectedContinent: Story = {
  parameters: { updateCountryStatus: 409 },
  play: async ({ canvasElement }) => {
    const modal = overlay(canvasElement);
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryContinentEditor(canvasElement, user, "Liechtenstein");

    await selectContinent(canvasElement, user, "Australia");
    await user.click(modal.getByRole("button", { name: "Update" }));

    expect(
      await modal.findByText(
        "A country with this name already exists in the selected continent."
      )
    ).toBeInTheDocument();
    const field = modal.getByRole("combobox", { name: "Select a continent" });
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveTextContent("Australia");
    expect(modal.getByRole("button", { name: "Update" })).toBeEnabled();
    expect(modal.getByRole("button", { name: "Cancel" })).toBeEnabled();
  }
};

export const KeepsCountryContinentWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryContinentEditor(canvasElement, user, "Liechtenstein");

    await selectContinent(canvasElement, user, "Australia");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Liechtenstein"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    expect(
      within(canvasElement).queryByRole("gridcell", { name: /Australia/ })
    ).not.toBeInTheDocument();
    const row = within(canvasElement)
      .getByRole("button", {
        name: "Change country name for Liechtenstein"
      })
      .closest('div[role="row"]') as HTMLElement;
    expect(within(row).getByText("Europe")).toBeInTheDocument();
  }
};

export const EnablesUpdateWhenIsoCodeSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryIsoCodeEditor(canvasElement, user, "Monaco");

    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();

    await selectIsoCode(canvasElement, user, "Monaco (MC)");

    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Update" })
      ).toBeEnabled()
    );
  }
};

export const UpdatesCountryIsoCode: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryIsoCodeEditor(canvasElement, user, "Monaco");

    await selectIsoCode(canvasElement, user, "Monaco (MC)");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await within(canvasElement).findByRole(
      "gridcell",
      { name: "MC" },
      { timeout: 5000 }
    );
  }
};

export const KeepsCountryIsoCodeWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryIsoCodeEditor(canvasElement, user, "Monaco");

    await selectIsoCode(canvasElement, user, "Andorra (AD)");
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

    expect(
      within(canvasElement).queryByRole("gridcell", { name: "MC" })
    ).not.toBeInTheDocument();
  }
};

export const SelectsCountryViaCheckbox: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);

    const row = within(canvasElement)
      .getByRole("button", { name: "Change country name for Monaco" })
      .closest('div[role="row"]') as HTMLElement;
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  }
};

export const SelectsCountryViaRowClick: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);

    const row = within(canvasElement)
      .getByRole("button", { name: "Change country name for San Marino" })
      .closest('div[role="row"]') as HTMLElement;
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    await user.click(within(row).getByText("Europe"));

    expect(checkbox).toBeChecked();
  }
};

export const SortsByOldest: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);

    const lithuania = within(canvasElement).getByRole("button", {
      name: "Change country name for Lithuania"
    });
    expect(
      within(canvasElement).getAllByRole("button", {
        name: /Change country name for/
      })[0]
    ).toBe(lithuania);

    await user.click(within(canvasElement).getByRole("combobox"));
    await user.click(
      await overlay(canvasElement).findByRole("option", { name: "Oldest" })
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).getAllByRole("button", {
            name: /Change country name for/
          })[0]
        ).not.toBe(
          within(canvasElement).queryByRole("button", {
            name: "Change country name for Lithuania"
          })
        ),
      { timeout: 5000 }
    );
  }
};

export const EnablesDeleteMenuWhenRowSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryDeleteDialog(canvasElement, user, "Monaco");

    expect(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    ).toBeEnabled();
    expect(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    ).toBeEnabled();
  }
};

export const KeepsCountriesWhenDeleteCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryDeleteDialog(canvasElement, user, "Monaco");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("button", { name: "Delete" })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    ["Monaco", "San Marino", "Liechtenstein", "Lithuania"].forEach((name) =>
      expect(
        within(canvasElement).getByRole("button", {
          name: `Change country name for ${name}`
        })
      ).toBeInTheDocument()
    );
  }
};

export const DisablesDeleteButtonsWhileDeleting: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryDeleteDialog(canvasElement, user, "Monaco");
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

export const RemovesCountryWhenDeleted: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryDeleteDialog(canvasElement, user, "Monaco");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).queryByRole("button", {
            name: "Change country name for Monaco"
          })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
    await within(canvasElement).findByRole("button", {
      name: "Change country name for San Marino"
    });
  }
};

export const OpensCountryNameEditorPrepopulated: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryNameEditor(canvasElement, user, "Liechtenstein");

    expect(overlay(canvasElement).getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Liechtenstein"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    ).toBeEnabled();
  }
};

export const DisablesUpdateAndCancelButtonsWhileUpdatingCountryName: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryNameEditor(canvasElement, user, "Liechtenstein");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Liechtenstein update test");
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

export const OpensCountryContinentEditor: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryContinentEditor(canvasElement, user, "Liechtenstein");

    expect(
      overlay(canvasElement).getByRole("combobox", {
        name: "Select a continent"
      })
    ).toBeInTheDocument();
    expect(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    ).toBeEnabled();
  }
};

export const DisablesCountryContinentButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForCountriesToLoad(canvasElement);
    await openCountryContinentEditor(canvasElement, user, "Liechtenstein");

    await selectContinent(canvasElement, user, "Australia");
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
