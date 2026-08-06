import { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "storybook/test";
import AttractionList from "./ListAttraction";
import {
  withFreshServer,
  setupUser,
  overlay,
  waitForCanvasToBecomeAccessible,
  searchFor,
  openAttractionNameEditor,
  waitForAllAttractionsToLoad,
  expectSuggestionBelowInput,
  updateButton,
  cancelButton,
  rowOf
} from "./ListAttraction.helpers";

type Story = StoryObj<typeof AttractionList>;

const meta: Meta<typeof AttractionList> = {
  component: AttractionList,
  tags: ["wide"],
  decorators: [withFreshServer]
};
export default meta;

export const Primary: Story = {};

export const PermanentlyClosedStatusIsVisible: Story = {
  tags: ["closure-status"],
  parameters: { permanentlyClosedAttractionId: 3 },
  play: async ({ canvasElement }) => {
    await waitForAllAttractionsToLoad(canvasElement);
    const row = rowOf(canvasElement, "Vilnius Old Town");

    expect(
      within(row).getByRole("button", {
        name: /Vilnius Old Town is permanently closed/
      })
    ).toHaveClass("permanently-closed-status", "is-closed");
    expect(
      within(row).getByText("Vilnius Old Town", { selector: "div" })
    ).toHaveClass("permanently-closed-list-name");
    expect(within(row).getByText(/^Permanently closed since .+/)).toHaveClass(
      "permanently-closed-since"
    );
  }
};

export const CanMarkAttractionPermanentlyClosed: Story = {
  tags: ["closure-status", "closure-admin-edit"],
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    const row = rowOf(canvasElement, "Vilnius Old Town");

    await user.click(
      within(row).getByRole("button", {
        name: "Mark Vilnius Old Town as permanently closed"
      })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", {
        name: "Mark permanently closed"
      })
    );

    await waitFor(
      () =>
        expect(
          within(rowOf(canvasElement, "Vilnius Old Town")).getByRole("button", {
            name: /Vilnius Old Town is permanently closed/
          })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );
    expect(
      within(rowOf(canvasElement, "Vilnius Old Town")).getByText(
        /^Permanently closed since /
      )
    ).toBeInTheDocument();
  }
};

export const CanReopenPermanentlyClosedAttraction: Story = {
  tags: ["closure-status", "closure-admin-reopen"],
  parameters: { permanentlyClosedAttractionId: 3 },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    const row = rowOf(canvasElement, "Vilnius Old Town");

    await user.click(
      within(row).getByRole("button", {
        name: /Vilnius Old Town is permanently closed/
      })
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", {
        name: "Reopen attraction"
      })
    );

    await waitFor(
      () =>
        expect(
          within(rowOf(canvasElement, "Vilnius Old Town")).getByRole("button", {
            name: "Mark Vilnius Old Town as permanently closed"
          })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );
  }
};

export const SearchIgnoresShortInput: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    await searchFor(canvasElement, user, "Ca");

    expect(
      within(canvasElement).queryByRole("menuitem", { name: "Casino Square" })
    ).not.toBeInTheDocument();
  }
};

export const SearchShowsSubstringMatches: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    await searchFor(canvasElement, user, "Cas");

    expect(
      await within(canvasElement).findByRole("menuitem", {
        name: "Casino of Monte-Carlo"
      })
    ).toBeInTheDocument();
    expect(
      within(canvasElement).getByRole("menuitem", { name: "Casino Square" })
    ).toBeInTheDocument();
  }
};

export const ClearsSearchInputAndSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    await searchFor(canvasElement, user, "Cas");
    await within(canvasElement).findByRole("menuitem", {
      name: "Casino Square"
    });
    await user.click(
      within(canvasElement).getByRole("button", { name: "Clear text" })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("menuitem", { name: "Casino Square" })
      ).not.toBeInTheDocument()
    );
    expect(within(canvasElement).getByRole("searchbox")).toHaveValue("");
  }
};

export const SelectsSuggestionFromDropdown: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    await searchFor(canvasElement, user, "Cas");
    await user.click(
      await within(canvasElement).findByRole("menuitem", {
        name: "Casino Square"
      })
    );

    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole("menuitem", { name: "Casino Square" })
      ).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        within(canvasElement).getAllByRole("button", {
          name: /Change attraction details from/
        })
      ).toHaveLength(1)
    );
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction details from Casino Square"
      })
    ).toBeInTheDocument();
    expect(within(canvasElement).getByRole("searchbox")).toHaveValue("");
  }
};

export const EditAttractionNameShowsErrorWhenEmpty: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionNameEditor(canvasElement, user, "Vilnius Old Town");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.click(field);
    await user.type(field, "A");
    await user.clear(field);
    await user.tab();

    await overlay(canvasElement).findByText(
      "Attraction name may not be null or empty"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const EditAttractionNameShowsErrorWhenTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionNameEditor(canvasElement, user, "Vilnius Old Town");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.click(field);
    await user.clear(field);
    await user.paste("a".repeat(2049));
    await user.tab();

    await overlay(canvasElement).findByText(
      "Attraction name may not be longer then 2048 characters"
    );
    expect(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    ).toBeDisabled();
  }
};

export const KeepsAttractionNameWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionNameEditor(canvasElement, user, "Vilnius Old Town");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.click(field);
    await user.type(field, "Test");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Cancel" })
    );

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Vilnius Old Town"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction details from Vilnius Old Town"
      })
    ).toBeInTheDocument();
    expect(
      within(canvasElement).queryByRole("button", {
        name: "Change attraction details from Test"
      })
    ).not.toBeInTheDocument();
  }
};

export const UpdatesAttractionName: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionNameEditor(canvasElement, user, "Vilnius Old Town");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.click(field);
    await user.clear(field);
    await user.type(field, "Vilnius Old Town new");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Update" })
    );

    await within(canvasElement).findByRole(
      "button",
      { name: "Change attraction details from Vilnius Old Town new" },
      { timeout: 5000 }
    );
    expect(
      within(canvasElement).queryByRole("button", {
        name: "Change attraction details from Vilnius Old Town"
      })
    ).not.toBeInTheDocument();
  }
};

export const ShowsConflictWhenUpdatedAttractionNameAlreadyExists: Story = {
  parameters: { updateAttractionStatus: 409 },
  play: async ({ canvasElement }) => {
    const modal = overlay(canvasElement);
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionNameEditor(canvasElement, user, "Casino Square");

    const field = modal.getByLabelText("Attraction name");
    await user.type(field, "Casino of Monte-Carlo");
    await user.click(modal.getByRole("button", { name: "Update" }));

    expect(
      await modal.findByText(
        "An attraction with this name already exists at this destination."
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveValue("Casino of Monte-Carlo");
    expect(modal.getByRole("button", { name: "Update" })).toBeEnabled();
    expect(modal.getByRole("button", { name: "Cancel" })).toBeEnabled();

    await user.type(field, " updated");
    await waitFor(() =>
      expect(
        modal.queryByText(
          "An attraction with this name already exists at this destination."
        )
      ).not.toBeInTheDocument()
    );
  }
};

export const DisablesUpdateWhenAttractionNameEmptyOnOpen: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionNameEditor(canvasElement, user, "Vilnius Old Town");

    expect(updateButton(canvasElement)).toBeDisabled();
  }
};

export const DisablesAttractionNameButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionNameEditor(canvasElement, user, "Vilnius Old Town");

    const field = overlay(canvasElement).getByRole("textbox");
    await user.type(field, "Vilnius Old Town new");
    await user.click(updateButton(canvasElement));

    await waitFor(() => expect(cancelButton(canvasElement)).toBeDisabled());
    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const ShowsPartOfLabelWhenLinkedToMainAttraction: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionNameEditor(canvasElement, user, "Vilnius Old Town");

    await user.type(
      overlay(canvasElement).getByLabelText("Attraction name"),
      "Vilnius Old Town new"
    );
    await user.click(
      overlay(canvasElement).getByLabelText("Part of attraction")
    );
    const mainAttractionInput = overlay(canvasElement).getByLabelText(
      "Select main attraction name"
    );
    await user.type(mainAttractionInput, "Cas");
    const suggestion = await overlay(canvasElement).findByRole("menuitem", {
      name: "Casino of Monte-Carlo"
    });
    expectSuggestionBelowInput(mainAttractionInput, suggestion);
    await user.click(suggestion);
    await user.click(updateButton(canvasElement));

    await within(canvasElement).findByText(
      /part of Casino of Monte-Carlo/,
      {},
      { timeout: 8000 }
    );
  }
};
