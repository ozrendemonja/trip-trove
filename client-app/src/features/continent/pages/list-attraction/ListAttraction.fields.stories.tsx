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
  openEditDialog,
  updateButton,
  cancelButton,
  modalDropdown
} from "./ListAttraction.helpers";

type Story = StoryObj<typeof AttractionList>;

const meta: Meta<typeof AttractionList> = {
  title: "features/continent/pages/list-attraction/ListAttraction/Fields",
  component: AttractionList,
  tags: ["wide"],
  decorators: [withFreshServer]
};
export default meta;

const openAttractionAddressEditor = async (
  canvasElement: HTMLElement,
  user: User,
  triggerName = "Change attraction address from not provide"
): Promise<void> => {
  await openEditDialog(canvasElement, user, triggerName);
  await overlay(canvasElement).findByLabelText("Attraction address");
};

const addressTextbox = (canvasElement: HTMLElement): HTMLElement =>
  overlay(canvasElement).getByLabelText("Attraction address");

const geoLocationTextbox = (canvasElement: HTMLElement): HTMLElement =>
  overlay(canvasElement).getByLabelText("Geo location");

export const AddressDisablesUpdateWhenAddressTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionAddressEditor(canvasElement, user);

    const field = addressTextbox(canvasElement);
    await user.click(field);
    await user.paste("a".repeat(513));
    await user.tab();

    await overlay(canvasElement).findByText(
      "Attraction address may not be longer then 512 characters"
    );
    expect(updateButton(canvasElement)).toBeDisabled();
  }
};

export const AddressDisablesUpdateWhenGeoLocationInvalid: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionAddressEditor(canvasElement, user);

    const field = geoLocationTextbox(canvasElement);
    await user.click(field);
    await user.type(field, "11.223432");
    await user.tab();

    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const KeepsAttractionAddressWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionAddressEditor(canvasElement, user);

    await user.type(addressTextbox(canvasElement), "Test address 123");
    await user.type(geoLocationTextbox(canvasElement), "11.223432, -12.32342");
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByLabelText("Attraction address")
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction address from not provide"
      })
    ).toBeInTheDocument();
  }
};

export const DisablesAttractionAddressButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionAddressEditor(canvasElement, user);

    await user.type(addressTextbox(canvasElement), "Test address 123");
    await user.type(geoLocationTextbox(canvasElement), "11.223432, -12.32342");
    await user.click(updateButton(canvasElement));

    await waitFor(() => expect(cancelButton(canvasElement)).toBeDisabled());
    await waitFor(() =>
      expect(updateButton(canvasElement, true)).toBeDisabled()
    );
  }
};

export const UpdatesAttractionAddress: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionAddressEditor(canvasElement, user);

    await user.type(addressTextbox(canvasElement), "Test address 123");
    await user.type(geoLocationTextbox(canvasElement), "11.223432, -12.32342");
    await user.click(updateButton(canvasElement));

    await within(canvasElement).findByText(
      "Test address 123",
      {},
      { timeout: 5000 }
    );
    await within(canvasElement).findByText(
      /11\.223432 -12\.32342/,
      {},
      { timeout: 5000 }
    );
  }
};

export const ClearsAttractionAddressWhenEmptied: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);

    const addressButtons = within(canvasElement).getAllByRole("button", {
      name: "Change attraction address from Pl. du Casino, 98000 Monaco"
    });
    expect(addressButtons).toHaveLength(2);

    await user.click(addressButtons[1]);
    await overlay(canvasElement).findByLabelText("Attraction address");
    await user.click(updateButton(canvasElement));

    // One of the two shared addresses is cleared, leaving a single row with it.
    await waitFor(
      () =>
        expect(
          within(canvasElement).queryAllByRole("button", {
            name: "Change attraction address from Pl. du Casino, 98000 Monaco"
          })
        ).toHaveLength(1),
      { timeout: 8000 }
    );
  }
};

const openAttractionCategoryEditor = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await openEditDialog(
    canvasElement,
    user,
    "Change attraction category from HISTORIC_SITE"
  );
  await overlay(canvasElement).findByRole("heading", {
    name: "Modifying HISTORIC_SITE"
  });
};

export const OpensAttractionCategoryEditorWithUpdateDisabled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionCategoryEditor(canvasElement, user);

    expect(updateButton(canvasElement)).toBeDisabled();
  }
};

export const KeepsAttractionCategoryWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionCategoryEditor(canvasElement, user);
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying HISTORIC_SITE"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction category from HISTORIC_SITE"
      })
    ).toBeInTheDocument();
  }
};

export const UpdatesAttractionCategory: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionCategoryEditor(canvasElement, user);

    await user.click(modalDropdown(canvasElement, "Modifying HISTORIC_SITE"));
    await user.click(
      await overlay(canvasElement).findByRole("option", {
        name: "OTHER_LANDMARK"
      })
    );
    await user.click(updateButton(canvasElement));

    await within(canvasElement).findByText(
      "OTHER_LANDMARK",
      {},
      { timeout: 5000 }
    );
  }
};

const openAttractionTypeEditor = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await openEditDialog(
    canvasElement,
    user,
    "Change attraction type from POTENTIAL_CHANGE"
  );
  await overlay(canvasElement).findByRole("heading", {
    name: "Modifying POTENTIAL_CHANGE"
  });
};

export const OpensAttractionTypeEditorWithUpdateDisabled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTypeEditor(canvasElement, user);

    expect(updateButton(canvasElement)).toBeDisabled();
  }
};

export const KeepsAttractionTypeWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTypeEditor(canvasElement, user);
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying POTENTIAL_CHANGE"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction type from POTENTIAL_CHANGE"
      })
    ).toBeInTheDocument();
  }
};

export const UpdatesAttractionType: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionTypeEditor(canvasElement, user);

    await user.click(
      modalDropdown(canvasElement, "Modifying POTENTIAL_CHANGE")
    );
    await user.click(
      await overlay(canvasElement).findByRole("option", {
        name: "IMMINENT_CHANGE"
      })
    );
    await user.click(updateButton(canvasElement));

    await within(canvasElement).findByText(
      "IMMINENT_CHANGE",
      {},
      { timeout: 5000 }
    );
  }
};
