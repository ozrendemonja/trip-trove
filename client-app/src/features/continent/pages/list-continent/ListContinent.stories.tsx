import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import makeServer from "../../../../ServerSetup";
import ContinentList from "./ListContinent";
import { MemoryRouter } from "react-router";

import { SOLID_STORY_BACKGROUND_STYLES as styleOverrides } from "../../../../shared/storybook/StoryStyles";

let server: ReturnType<typeof makeServer>;

const meta: Meta<typeof ContinentList> = {
  component: ContinentList,
  decorators: [
    (Story, context) => {
      // Tear down the previous story's Mirage server before starting a new
      // one; otherwise stacked Pretender instances corrupt the paginated
      // reloads that fire after a delete or update.
      server?.shutdown();
      server = makeServer({
        updateContinentStatus: context.parameters.updateContinentStatus as
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

type Story = StoryObj<typeof ContinentList>;
type User = ReturnType<typeof userEvent.setup>;

// Fluent modals/callouts animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Clicking instantly (delay: null)
// avoids racing the debounced reload effect that fires on every change.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// The Fluent edit Modal portals into a layer appended to <body>, outside the
// story canvas, so its contents are queried through the document.
const overlay = (canvasElement: HTMLElement): ReturnType<typeof within> =>
  within(canvasElement.ownerDocument.body);

const waitForCanvasToBecomeAccessible = async (
  canvasElement: HTMLElement
): Promise<void> => {
  await waitFor(() => expect(canvasElement).not.toHaveAttribute("aria-hidden"));
};

const waitForContinentsToLoad = (
  canvasElement: HTMLElement
): Promise<HTMLElement> =>
  within(canvasElement).findByRole(
    "button",
    { name: "Change value for Asia" },
    { timeout: 5000 }
  );

const openContinentNameEditor = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", {
      name: `Change value for ${name}`
    })
  );
  await overlay(canvasElement).findByRole("heading", {
    name: `Modifying ${name}`
  });
};

const selectContinentRow = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<HTMLElement> => {
  const row = within(canvasElement)
    .getByRole("button", { name: `Change value for ${name}` })
    .closest('[role="row"]') as HTMLElement;
  await user.click(within(row).getByRole("radio", { name: "select row" }));
  return row;
};

const openContinentDeleteDialog = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await selectContinentRow(canvasElement, user, name);
  await user.click(
    await within(canvasElement).findByRole(
      "menuitem",
      { name: "Delete continent" },
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

const sortByName = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", { name: "Operations for name" })
  );
};

const continentOrder = (canvasElement: HTMLElement): string[] =>
  within(canvasElement)
    .getAllByRole("button", { name: /^Change value for / })
    .map((button) =>
      button.getAttribute("aria-label")!.replace("Change value for ", "")
    );

export const Primary: Story = {};

export const SearchIgnoresShortInput: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);

    await user.type(within(canvasElement).getByRole("searchbox"), "Eu");

    expect(
      within(canvasElement).queryByRole("menuitem", { name: "Europe" })
    ).not.toBeInTheDocument();
  }
};

export const SearchShowsSubstringMatches: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);

    await user.type(within(canvasElement).getByRole("searchbox"), "rop");

    const suggestions = await within(canvasElement).findAllByRole("menuitem", {
      name: "Europe"
    });
    expect(suggestions).toHaveLength(1);
  }
};

export const ClearsSearchInputAndSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);

    await user.type(within(canvasElement).getByRole("searchbox"), "rop");
    await within(canvasElement).findByRole("menuitem", { name: "Europe" });
    await user.click(
      within(canvasElement).getByRole("button", { name: "Clear text" })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("menuitem", { name: "Europe" })
      ).not.toBeInTheDocument()
    );
    expect(within(canvasElement).getByRole("searchbox")).toHaveValue("");
  }
};

export const SelectsSuggestionFromDropdown: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);

    await user.type(within(canvasElement).getByRole("searchbox"), "ustr");
    await user.click(
      await within(canvasElement).findByRole("menuitem", { name: "Australia" })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("button", {
          name: "Change value for Europe"
        })
      ).not.toBeInTheDocument()
    );
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change value for Australia"
      })
    ).toBeInTheDocument();
    expect(
      within(canvasElement).getAllByRole("button", {
        name: /Change value for/
      })
    ).toHaveLength(1);
  }
};

export const EditContinentNameShowsErrorWhenEmpty: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentNameEditor(canvasElement, user, "Australia");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Asia");
    await user.clear(field);
    await user.tab();

    await overlay(canvasElement).findByText(
      "Continent name may not be null or empty"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const EditContinentNameShowsErrorWhenTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentNameEditor(canvasElement, user, "Australia");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.click(field);
    await user.paste("a".repeat(65));
    await user.tab();

    await overlay(canvasElement).findByText(
      "Continent name may not be longer then 64 characters"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const KeepsContinentNameWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentNameEditor(canvasElement, user, "Australia");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Australia"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change value for Australia"
      })
    ).toBeInTheDocument();
    expect(
      within(canvasElement).queryByRole("button", {
        name: "Change value for Test"
      })
    ).not.toBeInTheDocument();
  }
};

export const UpdatesContinentName: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentNameEditor(canvasElement, user, "Australia");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Australia update test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await within(canvasElement).findByRole(
      "button",
      { name: "Change value for Australia update test" },
      { timeout: 5000 }
    );
  }
};

export const ShowsConflictWhenUpdatedContinentNameAlreadyExists: Story = {
  parameters: { updateContinentStatus: 409 },
  play: async ({ canvasElement }) => {
    const modal = overlay(canvasElement);
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentNameEditor(canvasElement, user, "Australia");

    const field = modal.getByRole("textbox");
    await user.type(field, "Asia");
    await user.click(modal.getByRole("button", { name: "Update" }));

    expect(
      await modal.findByText("A continent with this name already exists.")
    ).toBeInTheDocument();
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveValue("Asia");
    expect(modal.getByRole("button", { name: "Update" })).toBeEnabled();
    expect(modal.getByRole("button", { name: "Cancel" })).toBeEnabled();

    await user.type(field, " updated");
    await waitFor(() =>
      expect(
        modal.queryByText("A continent with this name already exists.")
      ).not.toBeInTheDocument()
    );
  }
};

export const SavesContinentNameWithCtrlS: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentNameEditor(canvasElement, user, "Australia");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Australia ctrl s test");
    await user.keyboard("{Control>}s{/Control}");

    await within(canvasElement).findByRole(
      "button",
      { name: "Change value for Australia ctrl s test" },
      { timeout: 5000 }
    );
  }
};

export const SelectsContinentViaCheckbox: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);

    const row = within(canvasElement)
      .getByRole("button", { name: "Change value for Australia" })
      .closest('[role="row"]') as HTMLElement;
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  }
};

export const SelectsContinentViaRowClick: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);

    const row = within(canvasElement)
      .getByRole("button", { name: "Change value for Asia" })
      .closest('[role="row"]') as HTMLElement;
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    const cell = within(canvasElement)
      .getByRole("link", { name: "Asia" })
      .closest('[role="gridcell"]') as HTMLElement;
    await user.click(cell);

    expect(checkbox).toBeChecked();
  }
};

export const SortsContinentsAscending: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);

    await sortByName(canvasElement, user);

    expect(continentOrder(canvasElement)).toEqual([
      "Asia",
      "Australia",
      "Europe"
    ]);
  }
};

export const SortsContinentsDescending: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);

    await sortByName(canvasElement, user);
    await sortByName(canvasElement, user);

    expect(continentOrder(canvasElement)).toEqual([
      "Europe",
      "Australia",
      "Asia"
    ]);
  }
};

export const EnablesDeleteMenuWhenRowSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentDeleteDialog(canvasElement, user, "Australia");

    expect(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    ).toBeEnabled();
    expect(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    ).toBeEnabled();
  }
};

export const KeepsContinentsWhenDeleteCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentDeleteDialog(canvasElement, user, "Australia");
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
    ["Australia", "Europe", "Asia"].forEach((name) =>
      expect(
        within(canvasElement).getByRole("button", {
          name: `Change value for ${name}`
        })
      ).toBeInTheDocument()
    );
  }
};

export const DisablesDeleteButtonsWhileDeleting: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentDeleteDialog(canvasElement, user, "Australia");
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

export const RemovesContinentWhenDeleted: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentDeleteDialog(canvasElement, user, "Australia");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).queryByRole("button", {
            name: "Change value for Australia"
          })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
    await within(canvasElement).findByRole(
      "button",
      { name: "Change value for Asia" },
      { timeout: 5000 }
    );
  }
};

export const OpensContinentNameEditorPrepopulated: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentNameEditor(canvasElement, user, "Australia");

    expect(overlay(canvasElement).getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Australia"
    );
  }
};

export const DisablesContinentNameButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForContinentsToLoad(canvasElement);
    await openContinentNameEditor(canvasElement, user, "Australia");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Australia update test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    const updatingButton = await overlay(canvasElement).findByRole("button", {
      name: "Updating..."
    });
    expect(updatingButton).toBeDisabled();
    expect(within(updatingButton).getByRole("progressbar")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Cancel" })
      ).toBeDisabled()
    );
  }
};
