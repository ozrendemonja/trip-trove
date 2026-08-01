import { Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import AddCountry from "./AddCountry";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddCountry> = {
  component: AddCountry,
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

type Story = StoryObj<typeof AddCountry>;
type User = ReturnType<typeof userEvent.setup>;

// Fluent callouts/options animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Typing instantly (delay: null)
// avoids re-running validation on every keystroke.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

const selectOption = async (
  user: User,
  comboboxName: string,
  optionName: string
): Promise<void> => {
  await user.click(screen.getByRole("combobox", { name: comboboxName }));
  await user.click(
    await screen.findByRole("option", { name: optionName }, { timeout: 5000 })
  );
};

const countryNameField = (): HTMLElement =>
  screen.getByLabelText("Country name");

const saveButton = (): HTMLElement =>
  screen.getByRole("button", { name: "Save" });

export const Primary: Story = {};

export const ShowsFormWithSaveInitiallyDisabled: Story = {
  play: async () => {
    expect(
      screen.getByRole("heading", { name: "Add Country" })
    ).toBeInTheDocument();
    expect(countryNameField()).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Select a continent" })
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  }
};

export const KeepsSaveDisabledWithOnlyContinent: Story = {
  play: async () => {
    const user = setupUser();

    await selectOption(user, "Select a continent", "Australia");

    expect(saveButton()).toBeDisabled();
  }
};

export const KeepsSaveDisabledWithOnlyCountryName: Story = {
  play: async () => {
    const user = setupUser();

    await user.type(countryNameField(), "Italy");

    expect(saveButton()).toBeDisabled();
  }
};

export const EnablesSaveWhenNameContinentAndIsoCodeAreValid: Story = {
  play: async () => {
    const user = setupUser();

    await user.type(countryNameField(), "Italy");
    await selectOption(user, "Select a continent", "Australia");
    await selectOption(user, "ISO code", "Italy (IT)");

    await waitFor(() => expect(saveButton()).toBeEnabled());
  }
};

export const ShowsErrorWhenCountryNameIsCleared: Story = {
  play: async () => {
    const user = setupUser();

    await user.type(countryNameField(), "Italy");
    await user.clear(countryNameField());
    await user.tab();

    expect(
      await screen.findByText("Country name may not be null or empty")
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  }
};

export const ShowsErrorWhenCountryNameIsTooLong: Story = {
  play: async () => {
    const user = setupUser();

    await user.click(countryNameField());
    await user.paste("A".repeat(265));
    await user.tab();

    expect(
      await screen.findByText(
        "Country name may not be longer then 256 characters"
      )
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  }
};
