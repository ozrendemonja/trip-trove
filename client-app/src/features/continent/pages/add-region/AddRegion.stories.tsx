import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import AddRegion from "./AddRegion";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddRegion> = {
  component: AddRegion,
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

type Story = StoryObj<typeof AddRegion>;
type User = ReturnType<typeof userEvent.setup>;

// Fluent callouts/options animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Typing instantly (delay: null)
// avoids re-running the debounced suggestion effect on every keystroke.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

const regionNameField = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByLabelText("Region name");

const countryField = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByLabelText("Select a country");

const saveButton = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByRole("button", { name: "Save" });

const findSuggestion = (
  canvasElement: HTMLElement,
  name: string
): Promise<HTMLElement> =>
  within(canvasElement).findByRole("menuitem", { name }, { timeout: 5000 });

const selectCountry = async (
  canvasElement: HTMLElement,
  user: User,
  query: string,
  name: string
): Promise<void> => {
  await user.type(countryField(canvasElement), query);
  await user.click(await findSuggestion(canvasElement, name));
};

const blurField = (user: User): Promise<void> => user.tab();

export const Primary: Story = {};

export const DisablesSaveByDefault: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(
      canvas.getByRole("heading", { name: "Add Region" })
    ).toBeInTheDocument();
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};

export const SuggestsMatchingCountries: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await user.type(countryField(canvasElement), "Lith");

    await findSuggestion(canvasElement, "Lithuania");
    expect(countryField(canvasElement)).toHaveValue("Lith");
  }
};

export const DisablesSaveWhenOnlyCountrySelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await selectCountry(canvasElement, user, "Lith", "Lithuania");

    expect(countryField(canvasElement)).toHaveValue("Lithuania");
    await waitFor(() => expect(saveButton(canvasElement)).toBeDisabled());
  }
};

export const DisablesSaveWhenOnlyNameEntered: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await user.type(regionNameField(canvasElement), "Dz\u016bkija");

    await waitFor(() => expect(saveButton(canvasElement)).toBeDisabled());
  }
};

export const DisablesSaveWhenSelectedCountryIsEdited: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await user.type(regionNameField(canvasElement), "Dz\u016bkija");
    await selectCountry(canvasElement, user, "Lith", "Lithuania");

    await user.clear(countryField(canvasElement));
    await user.type(countryField(canvasElement), "Invalid");

    expect(countryField(canvasElement)).toHaveValue("Invalid");
    await waitFor(() => expect(saveButton(canvasElement)).toBeDisabled());
  }
};

export const EnablesSaveWhenFormIsValid: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await user.type(regionNameField(canvasElement), "Dz\u016bkija");
    await selectCountry(canvasElement, user, "Lith", "Lithuania");

    expect(countryField(canvasElement)).toHaveValue("Lithuania");
    await waitFor(() => expect(saveButton(canvasElement)).toBeEnabled());
  }
};

export const ShowsErrorWhenNameIsEmpty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectCountry(canvasElement, user, "Lith", "Lithuania");
    await user.type(regionNameField(canvasElement), "Dz\u016bkija");
    await user.clear(regionNameField(canvasElement));
    await blurField(user);

    expect(
      await canvas.findByText("Region name may not be null or empty")
    ).toBeInTheDocument();
    await waitFor(() => expect(saveButton(canvasElement)).toBeDisabled());
  }
};

export const ShowsErrorWhenNameIsTooLong: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectCountry(canvasElement, user, "Lith", "Lithuania");
    await user.type(regionNameField(canvasElement), "a".repeat(265));
    await blurField(user);

    expect(
      await canvas.findByText(
        "Region name may not be longer then 256 characters"
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(saveButton(canvasElement)).toBeDisabled());
  }
};
