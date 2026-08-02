import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MemoryRouter } from "react-router";
import AddContinent from "./AddContinent";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddContinent> = {
  component: AddContinent,
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

type Story = StoryObj<typeof AddContinent>;
type User = ReturnType<typeof userEvent.setup>;

// Fluent's TextField validates on a short debounce and only surfaces an error
// once the field has been touched, so type instantly (delay: null) and blur the
// field to trigger validateOnFocusOut before asserting.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

const nameField = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByLabelText("Continent name");

const saveButton = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByRole("button", { name: "Save" });

const findError = (
  canvasElement: HTMLElement,
  message: string
): Promise<HTMLElement> =>
  within(canvasElement).findByText(message, {}, { timeout: 5000 });

export const Primary: Story = {};

export const SaveDisabledWhenNameEmpty: Story = {
  play: async ({ canvasElement }) => {
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};

export const SaveEnabledWhenNameValid: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await user.type(nameField(canvasElement), "Asia");

    await waitFor(() => expect(saveButton(canvasElement)).toBeEnabled());
  }
};

export const ShowsRequiredErrorWhenNameCleared: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const field = nameField(canvasElement);

    await user.type(field, "Asia");
    await user.clear(field);
    await user.tab();

    expect(
      await findError(canvasElement, "Continent name may not be null or empty")
    ).toBeInTheDocument();
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};

export const ShowsMaxLengthErrorWhenNameTooLong: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await user.type(nameField(canvasElement), "A".repeat(65));
    await user.tab();

    expect(
      await findError(
        canvasElement,
        "Continent name may not be longer then 64 characters"
      )
    ).toBeInTheDocument();
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};
