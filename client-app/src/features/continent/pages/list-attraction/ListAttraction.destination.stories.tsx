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
  destinationTextbox,
  pickSuggestion,
  updateButton,
  cancelButton
} from "./ListAttraction.helpers";

type Story = StoryObj<typeof AttractionList>;

const meta: Meta<typeof AttractionList> = {
  title: "features/continent/pages/list-attraction/ListAttraction/Destination",
  component: AttractionList,
  tags: ["wide"],
  decorators: [withFreshServer]
};
export default meta;

const openAttractionDestinationEditor = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await openEditDialog(
    canvasElement,
    user,
    "Change attraction destination from Lithuania"
  );
  await overlay(canvasElement).findByRole("heading", {
    name: "Modifying Lithuania"
  });
};

const typeCountry = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await user.type(
    destinationTextbox(canvasElement, "Select a country"),
    "Lith"
  );
  await pickSuggestion(canvasElement, user, "Lithuania");
};

const typeRegion = async (
  canvasElement: HTMLElement,
  user: User
): Promise<void> => {
  await user.type(destinationTextbox(canvasElement, "Select a region"), "Mon");
  await pickSuggestion(canvasElement, user, "Monaco");
};

export const OpensAttractionDestinationEditorWithUpdateDisabled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    expect(updateButton(canvasElement)).toBeDisabled();
  }
};

export const DestinationDisablesUpdateWhenRegionNotSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await user.click(
      overlay(canvasElement).getByLabelText("Nationally Recognized Attraction")
    );
    await typeCountry(canvasElement, user);

    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const DestinationDisablesUpdateWhenCountryNotSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await typeRegion(canvasElement, user);

    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const DestinationDisablesUpdateWhenRegionDeselected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await typeCountry(canvasElement, user);
    await typeRegion(canvasElement, user);
    await waitFor(() => expect(updateButton(canvasElement)).toBeEnabled());

    const region = destinationTextbox(canvasElement, "Select a region");
    await user.clear(region);
    await user.type(region, "Monac");

    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const DestinationDisablesUpdateWhenCountryDeselected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await typeCountry(canvasElement, user);
    const country = destinationTextbox(canvasElement, "Select a country");
    await user.clear(country);
    await user.type(country, "Lithuan");
    await typeRegion(canvasElement, user);

    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const DestinationDisablesUpdateWhenCityNotSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await typeCountry(canvasElement, user);
    await user.click(
      overlay(canvasElement).getByLabelText("Attraction is region level")
    );

    await waitFor(() => expect(updateButton(canvasElement)).toBeDisabled());
  }
};

export const DestinationEnablesUpdateWhenCountryAndCitySelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await typeCountry(canvasElement, user);
    await user.click(
      overlay(canvasElement).getByLabelText("Attraction is region level")
    );
    await user.type(destinationTextbox(canvasElement, "Select a city"), "Mon");
    await pickSuggestion(canvasElement, user, "Monaco, Monaco, Monaco");

    await waitFor(() => expect(updateButton(canvasElement)).toBeEnabled());
  }
};

export const DestinationEnablesUpdateWhenCountryAndRegionSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await typeCountry(canvasElement, user);
    await typeRegion(canvasElement, user);

    await waitFor(() => expect(updateButton(canvasElement)).toBeEnabled());
  }
};

export const KeepsAttractionDestinationWhenCancelled: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await user.type(
      destinationTextbox(canvasElement, "Select a country"),
      "Mon"
    );
    await pickSuggestion(canvasElement, user, "Monaco");
    await typeRegion(canvasElement, user);
    await user.click(cancelButton(canvasElement));

    await waitFor(() =>
      expect(
        overlay(canvasElement).queryByRole("heading", {
          name: "Modifying Lithuania"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    expect(
      within(canvasElement).getByRole("button", {
        name: "Change attraction destination from Lithuania"
      })
    ).toBeInTheDocument();
  }
};

export const DisablesAttractionDestinationButtonsWhileUpdating: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await typeCountry(canvasElement, user);
    await typeRegion(canvasElement, user);
    await user.click(updateButton(canvasElement));

    await waitFor(() => expect(cancelButton(canvasElement)).toBeDisabled());
    await waitFor(() =>
      expect(updateButton(canvasElement, true)).toBeDisabled()
    );
  }
};

export const UpdatesAttractionDestination: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await user.type(
      destinationTextbox(canvasElement, "Select a country"),
      "Mon"
    );
    await pickSuggestion(canvasElement, user, "Monaco");
    await typeRegion(canvasElement, user);
    await user.click(updateButton(canvasElement));

    await waitFor(
      () =>
        expect(
          within(canvasElement).queryByRole("button", {
            name: "Change attraction destination from Lithuania"
          })
        ).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
    await waitFor(
      () =>
        expect(
          within(rowOf(canvasElement, "Vilnius Old Town")).queryAllByRole(
            "button",
            { name: "Change attraction destination from Monaco" }
          )
        ).toHaveLength(1),
      { timeout: 8000 }
    );
  }
};

export const ShowsConflictWhenAttractionAlreadyExistsAtSelectedDestination: Story =
  {
    parameters: { updateAttractionStatus: 409 },
    play: async ({ canvasElement }) => {
      const modal = overlay(canvasElement);
      const user = setupUser();
      await waitForAllAttractionsToLoad(canvasElement);
      await openAttractionDestinationEditor(canvasElement, user);

      const country = destinationTextbox(canvasElement, "Select a country");
      await user.type(country, "Mon");
      await pickSuggestion(canvasElement, user, "Monaco");
      await typeRegion(canvasElement, user);
      await user.click(updateButton(canvasElement));

      expect(
        await modal.findByText(
          "An attraction with this name already exists at the selected destination."
        )
      ).toBeInTheDocument();
      await waitFor(() => expect(country).toHaveFocus());
      expect(country).toHaveValue("Monaco");
      expect(updateButton(canvasElement)).toBeEnabled();
      expect(cancelButton(canvasElement)).toBeEnabled();

      await user.type(country, " updated");
      await waitFor(() =>
        expect(
          modal.queryByText(
            "An attraction with this name already exists at the selected destination."
          )
        ).not.toBeInTheDocument()
      );
    }
  };

export const UpdatesAttractionDestinationWithCity: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    await waitForAllAttractionsToLoad(canvasElement);
    await openAttractionDestinationEditor(canvasElement, user);

    await typeCountry(canvasElement, user);
    await user.click(
      overlay(canvasElement).getByLabelText("Attraction is region level")
    );
    await user.type(destinationTextbox(canvasElement, "Select a city"), "Mon");
    await pickSuggestion(canvasElement, user, "Monaco, Monaco, Monaco");
    await user.click(updateButton(canvasElement));

    await within(canvasElement).findByText(
      "Monaco, Monaco, Monaco",
      {},
      { timeout: 5000 }
    );
  }
};
