import { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
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

let server: ReturnType<typeof makeServer> | undefined;

/* eslint-disable react/display-name */
const withServer =
  (saveCountryStatus?: number): Decorator =>
  (Story) => {
    server?.shutdown();
    server = makeServer({ saveCountryStatus });
    return <Story />;
  };
/* eslint-enable react/display-name */

if (Array.isArray(meta.decorators)) {
  meta.decorators.push(withServer());
}

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
  screen.getByLabelText(/^Country name/);

const saveButton = (): HTMLElement =>
  screen.getByRole("button", { name: "Save" });

export const Primary: Story = {};

export const ShowsInlineNameConflictWhenCountryAlreadyExists: Story = {
  decorators: [withServer(409)],
  play: async () => {
    const user = setupUser();
    const field = countryNameField();

    await user.type(field, "Monaco");
    await selectOption(user, "Select a continent", "Europe");
    await selectOption(user, "ISO code", "Monaco (MC)");
    await user.click(saveButton());

    expect(
      await screen.findByText("A country with this name already exists.")
    ).toBeInTheDocument();
    await waitFor(() => expect(field).toHaveFocus());
    expect(
      screen.getByRole("combobox", { name: "Select a continent" })
    ).toHaveTextContent("Europe");
    expect(screen.getByRole("combobox", { name: "ISO code" })).toHaveValue(
      "Monaco (MC)"
    );

    await user.type(field, " updated");
    await waitFor(() =>
      expect(
        screen.queryByText("A country with this name already exists.")
      ).not.toBeInTheDocument()
    );
  }
};

export const ShowsFormWithSaveInitiallyDisabled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(
      screen.getByRole("heading", { name: "Add Country" })
    ).toBeInTheDocument();
    expect(canvas.getAllByText("*")).toHaveLength(3);
    expect(countryNameField()).toBeInTheDocument();
    expect(countryNameField()).toBeRequired();
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
