import { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "storybook/test";
import AttractionList from "./ListAttraction";
import {
  withFreshServer,
  setupUser,
  overlay,
  waitForAllAttractionsToLoad,
  waitForCanvasToBecomeAccessible,
  rowOf,
  selectAttractionRow,
  openAttractionDeleteDialog,
  cancelButton
} from "./ListAttraction.helpers";

type Story = StoryObj<typeof AttractionList>;

const meta: Meta<typeof AttractionList> = {
  title: "features/continent/pages/list-attraction/ListAttraction/Selection",
  component: AttractionList,
  tags: ["wide"],
  decorators: [withFreshServer]
};
export default meta;

export const SelectsAttractionViaCheckbox: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    const row = rowOf(canvasElement, "Larvotto Beach");
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  }
};

export const SelectsAttractionViaRowClick: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    const row = rowOf(canvasElement, "Larvotto Beach");
    const checkbox = within(row).getByRole("radio", { name: "select row" });
    expect(checkbox).not.toBeChecked();

    await user.click(within(row).getByText("POTENTIAL_CHANGE"));

    expect(checkbox).toBeChecked();
  }
};

export const SortsByOldest: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    const firstName = (): HTMLElement =>
      within(canvasElement).getAllByRole("button", {
        name: /Change attraction details from/
      })[0];
    expect(firstName()).toBe(
      within(canvasElement).getByRole("button", {
        name: "Change attraction details from Vilnius Old Town"
      })
    );

    const sortDropdown = within(canvasElement)
      .getAllByRole("combobox")
      .find((combobox) => !combobox.closest('[role="grid"]')) as HTMLElement;
    await user.click(sortDropdown);
    await user.click(
      await overlay(canvasElement).findByRole("option", { name: "Oldest" })
    );

    await waitFor(
      () =>
        expect(firstName()).not.toBe(
          within(canvasElement).queryByRole("button", {
            name: "Change attraction details from Vilnius Old Town"
          })
        ),
      { timeout: 5000 }
    );
  }
};

export const EnablesDeleteAttractionButtonWhenRowSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    expect(
      within(canvasElement).getByRole("menuitem", { name: "Delete attraction" })
    ).toHaveAttribute("aria-disabled", "true");

    await selectAttractionRow(canvasElement, user, "Larvotto Beach");

    await waitFor(() =>
      expect(
        within(canvasElement).getByRole("menuitem", {
          name: "Delete attraction"
        })
      ).not.toHaveAttribute("aria-disabled", "true")
    );
  }
};

export const KeepsAttractionsWhenDeleteCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDeleteDialog(canvasElement, user, "Larvotto Beach");
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("button", { name: "Delete" })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction details from Larvotto Beach"
      })
    ).toBeInTheDocument();
  }
};

export const DisablesButtonsWhileDeletingAttraction: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDeleteDialog(canvasElement, user, "Larvotto Beach");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await waitFor(() => expect(cancelButton(canvasElement)).toBeDisabled());
    await waitFor(() =>
      expect(
        overlay(canvasElement).getByRole("button", { name: "Delete" })
      ).toBeDisabled()
    );
  }
};

export const RemovesAttractionWhenDeleted: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDeleteDialog(canvasElement, user, "Larvotto Beach");
    await user.click(
      overlay(canvasElement).getByRole("button", { name: "Delete" })
    );

    await waitFor(
      () =>
        expect(
          within(canvasElement).queryByRole("button", {
            name: "Change attraction details from Larvotto Beach"
          })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
  }
};
