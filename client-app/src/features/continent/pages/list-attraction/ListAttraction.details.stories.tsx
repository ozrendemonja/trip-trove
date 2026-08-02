import { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "storybook/test";
import AttractionList from "./ListAttraction";
import {
  User,
  withFreshServer,
  setupUser,
  overlay,
  waitForAllAttractionsToLoad,
  waitForCanvasToBecomeAccessible,
  rowOf,
  openEditDialog,
  pickSuggestion,
  updateButton,
  cancelButton
} from "./ListAttraction.helpers";

type Story = StoryObj<typeof AttractionList>;

const meta: Meta<typeof AttractionList> = {
  title: "features/continent/pages/list-attraction/ListAttraction/Details",
  component: AttractionList,
  tags: ["wide"],
  decorators: [withFreshServer]
};
export default meta;

const openAttractionMustVisitEditor = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await openEditDialog(
    canvasElement,
    user,
    "Change attraction visit preferences for Larvotto Beach to must visit"
  );
  await overlay(canvasElement).findByRole("heading", {
    name: "Modifying to must visit"
  });
};

export const KeepsAttractionMustVisitWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionMustVisitEditor(canvasElement, user);
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying to must visit"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction visit preferences for Larvotto Beach to must visit"
      })
    ).toBeInTheDocument();
  }
};

export const UpdatesAttractionMustVisit: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionMustVisitEditor(canvasElement, user);
    await user.click(updateButton(canvasElement));

    await waitFor(
      () =>
        expect(
          overlay(canvasElement).queryByRole("heading", {
            name: "Modifying to must visit"
          })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await waitFor(
      () =>
        expect(
          within(canvasElement).getByRole("button", {
            name: "Change attraction visit preferences for Larvotto Beach to optional visit"
          })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );
  }
};

const openAttractionTraditionalEditor = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await openEditDialog(
    canvasElement,
    user,
    "Change attraction traditional preferences for Vilnius Old Town to non traditional"
  );
  await overlay(canvasElement).findByRole("heading", {
    name: "Modifying to non traditional"
  });
};

export const EnablesUpdateWhenTraditionalEditorOpens: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTraditionalEditor(canvasElement, user);

    expect(updateButton(canvasElement)).toBeEnabled();
  }
};

export const KeepsAttractionTraditionalWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTraditionalEditor(canvasElement, user);
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying to non traditional"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction traditional preferences for Vilnius Old Town to non traditional"
      })
    ).toBeInTheDocument();
  }
};

export const UpdatesAttractionTraditional: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTraditionalEditor(canvasElement, user);
    await user.click(updateButton(canvasElement));

    await waitFor(
      () =>
        expect(
          overlay(canvasElement).queryByRole("heading", {
            name: "Modifying to non traditional"
          })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
    await waitFor(
      () =>
        expect(
          within(canvasElement).getByRole("button", {
            name: "Change attraction traditional preferences for Vilnius Old Town to traditional"
          })
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );
  }
};

const openAttractionInfoEditor = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await openEditDialog(
    canvasElement,
    user,
    "Change attraction info from Google reviews"
  );
  await overlay(canvasElement).findByLabelText("Where information comes from");
};

const infoSourceTextbox = (canvasElement: HTMLElement): HTMLElement =>
  overlay(canvasElement).getByLabelText("Where information comes from");

export const OpensAttractionInfoEditor: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionInfoEditor(canvasElement, user);

    expect(infoSourceTextbox(canvasElement)).toBeInTheDocument();
  }
};

export const InfoDisablesUpdateWhenSourceEmpty: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionInfoEditor(canvasElement, user);

    await user.type(infoSourceTextbox(canvasElement), "Lonely");
    await pickSuggestion(canvasElement, user, "Lonely Planet");
    await user.clear(infoSourceTextbox(canvasElement));

    await overlay(canvasElement).findByText(
      "Info from may not be null or empty",
      {},
      { timeout: 5000 }
    );
    expect(updateButton(canvasElement)).toBeDisabled();
  }
};

export const InfoDisablesUpdateWhenSourceTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionInfoEditor(canvasElement, user);

    const field = infoSourceTextbox(canvasElement);
    await user.click(field);
    await user.paste("a".repeat(513));

    await overlay(canvasElement).findByText(
      "Info from may not be longer then 512 characters"
    );
    expect(updateButton(canvasElement)).toBeDisabled();
  }
};

export const InfoDisablesUpdateWhenNoDate: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionInfoEditor(canvasElement, user);

    await user.type(infoSourceTextbox(canvasElement), "Test record");

    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const ShowsNewSourceAfterUpdatingAttractionInfo: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionInfoEditor(canvasElement, user);

    await user.type(infoSourceTextbox(canvasElement), "Test record");
    await user.click(
      overlay(canvasElement).getByRole("combobox", {
        name: /Date of information recording/
      })
    );
    const now = new Date();
    const today = `${now.getDate()}, ${now.toLocaleString("en-US", {
      month: "long"
    })}, ${now.getFullYear()}`;
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: today })
    );

    await waitFor(() => expect(updateButton(canvasElement)).toBeEnabled());
    await user.click(updateButton(canvasElement));

    await within(canvasElement).findByText(
      "Test record",
      {},
      { timeout: 5000 }
    );
  }
};

const openAttractionVisitPeriodEditor = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await openEditDialog(
    canvasElement,
    user,
    "Change attraction visit period for Larvotto Beach"
  );
  await overlay(canvasElement).findByRole("heading", {
    name: "Modifying Visit period"
  });
};

export const EnablesUpdateWhenVisitPeriodEditorOpens: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionVisitPeriodEditor(canvasElement, user);

    expect(updateButton(canvasElement)).toBeEnabled();
  }
};

export const KeepsAttractionVisitPeriodWhenClosed: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    const periodPickerCount = within(
      rowOf(canvasElement, "Larvotto Beach")
    ).getAllByRole("combobox").length;
    expect(periodPickerCount).toBeGreaterThan(0);

    await openAttractionVisitPeriodEditor(canvasElement, user);
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Visit period"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(rowOf(canvasElement, "Larvotto Beach")).getAllByRole("combobox")
    ).toHaveLength(periodPickerCount);
  }
};

export const UpdatesAttractionVisitPeriod: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    expect(
      within(rowOf(canvasElement, "Larvotto Beach")).getAllByRole("combobox")
        .length
    ).toBeGreaterThan(0);

    await openAttractionVisitPeriodEditor(canvasElement, user);

    const now = new Date();
    const dayButton = `${now.getDate()}, ${now.toLocaleString("en-US", {
      month: "long"
    })}, ${now.getFullYear()}`;
    await user.click(
      overlay(canvasElement).getAllByRole("combobox", {
        name: "Select a visit period date"
      })[0]
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: dayButton })
    );
    await user.click(
      overlay(canvasElement).getAllByRole("combobox", {
        name: "Select a visit period date"
      })[1]
    );
    await user.click(
      await overlay(canvasElement).findByRole("button", { name: dayButton })
    );
    await user.click(updateButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Visit period"
        })
      ).not.toBeInTheDocument()
    );

    const newPeriodDate = `${now.getDate()} ${now.toLocaleString("default", {
      month: "short"
    })}`;
    await waitFor(
      () =>
        expect(
          within(rowOf(canvasElement, "Larvotto Beach")).getAllByRole(
            "combobox"
          )[0]
        ).toHaveValue(newPeriodDate),
      { timeout: 5000 }
    );
    expect(
      within(rowOf(canvasElement, "Larvotto Beach")).getAllByRole("combobox")[1]
    ).toHaveValue(newPeriodDate);
  }
};

const openAttractionTipEditor = async (
  canvasElement: HTMLElement,
  user: User,
  attractionName = "Casino Square"
): Promise<void> => {
  await openEditDialog(
    canvasElement,
    user,
    `Change attraction tip for ${attractionName}`
  );
  await overlay(canvasElement).findByRole("heading", {
    name: "Modifying Attraction tip"
  });
};

const tipTextbox = (canvasElement: HTMLElement): HTMLElement =>
  overlay(canvasElement).getByLabelText("Tip");

export const ShowsTipFieldWhenTipEditorOpens: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTipEditor(canvasElement, user);

    expect(tipTextbox(canvasElement)).toBeInTheDocument();
  }
};

export const KeepsAttractionTipWhenClosed: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTipEditor(canvasElement, user, "Vilnius Old Town");

    await user.type(tipTextbox(canvasElement), "Test test test");
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Attraction tip"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    const row = rowOf(canvasElement, "Vilnius Old Town");
    expect(
      within(row).getByText(/There are no hard rules for tipping/)
    ).toBeInTheDocument();
    expect(within(row).queryByText("Test test test")).not.toBeInTheDocument();
  }
};

export const TipDisablesUpdateWhenTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTipEditor(canvasElement, user);

    const field = tipTextbox(canvasElement);
    await user.click(field);
    await user.paste("a".repeat(2049));
    await user.tab();

    await overlay(canvasElement).findByText(
      "Tip may not be longer then 2048 characters"
    );
    expect(updateButton(canvasElement)).toBeDisabled();
  }
};

export const DisablesAttractionTipButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTipEditor(canvasElement, user);

    await user.type(tipTextbox(canvasElement), "Test test test");
    await user.click(updateButton(canvasElement));

    await waitFor(() => expect(cancelButton(canvasElement)).toBeDisabled());
    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const ShowsNewTipAfterUpdatingAttractionTip: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTipEditor(canvasElement, user);

    await user.type(tipTextbox(canvasElement), "Test test test");
    await user.click(updateButton(canvasElement));

    await within(canvasElement).findByText(
      "Test test test",
      {},
      { timeout: 5000 }
    );
  }
};
