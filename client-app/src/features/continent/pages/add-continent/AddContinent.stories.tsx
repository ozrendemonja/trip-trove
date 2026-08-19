import { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import AddContinent from "./AddContinent";

import { SOLID_STORY_BACKGROUND_STYLES as styleOverrides } from "../../../../shared/storybook/StoryStyles";

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

let server: ReturnType<typeof makeServer> | undefined;

/* eslint-disable react/display-name */
const withServer =
  (saveContinentStatus: number): Decorator =>
  (Story) => {
    server?.shutdown();
    server = makeServer({ saveContinentStatus });
    return <Story />;
  };
/* eslint-enable react/display-name */

// Fluent's TextField validates on a short debounce and only surfaces an error
// once the field has been touched, so type instantly (delay: null) and blur the
// field to trigger validateOnFocusOut before asserting.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

const nameField = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByLabelText(/^Continent name/);

const saveButton = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByRole("button", { name: "Save" });

const findError = (
  canvasElement: HTMLElement,
  message: string
): Promise<HTMLElement> =>
  within(canvasElement).findByText(message, {}, { timeout: 5000 });

export const Primary: Story = {};

export const ShowsInlineNameConflictWhenContinentAlreadyExists: Story = {
  decorators: [withServer(409)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const field = nameField(canvasElement);

    await user.type(field, "Asia");
    await user.click(saveButton(canvasElement));

    expect(
      await canvas.findByText("A continent with this name already exists.")
    ).toBeInTheDocument();
    await waitFor(() => expect(field).toHaveFocus());

    await user.type(field, " updated");
    await waitFor(() =>
      expect(
        canvas.queryByText("A continent with this name already exists.")
      ).not.toBeInTheDocument()
    );
  }
};

export const SaveDisabledWhenNameEmpty: Story = {
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getAllByText("*")).toHaveLength(1);
    expect(nameField(canvasElement)).toBeRequired();
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

export const ShowsProgressWhileSaving: Story = {
  decorators: [withServer(200)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await user.type(nameField(canvasElement), "New continent");
    await user.click(saveButton(canvasElement));

    const savingButton = await canvas.findByRole("button", {
      name: "Saving..."
    });
    expect(savingButton).toBeDisabled();
    expect(savingButton).toHaveAttribute("aria-busy", "true");
    expect(within(savingButton).getByRole("progressbar")).toBeInTheDocument();
    expect(canvas.getByRole("button", { name: "Cancel" })).toBeDisabled();
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
