import { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import AddCity from "./AddCity";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddCity> = {
  component: AddCity,
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

type Story = StoryObj<typeof AddCity>;
type User = ReturnType<typeof userEvent.setup>;

let server: ReturnType<typeof makeServer> | undefined;

/* eslint-disable react/display-name */
const withServer =
  (saveCityStatus?: number): Decorator =>
  (Story) => {
    server?.shutdown();
    server = makeServer({ saveCityStatus });
    return <Story />;
  };
/* eslint-enable react/display-name */

meta.decorators?.push(withServer());

// Fluent callouts/options animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Typing instantly (delay: null)
// avoids re-running the debounced suggestion effect on every keystroke.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

const cityNameField = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByLabelText("City name");

const regionField = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByLabelText("Select a region");

const saveButton = (canvasElement: HTMLElement): HTMLElement =>
  within(canvasElement).getByRole("button", { name: "Save" });

const fillCityName = (
  canvasElement: HTMLElement,
  user: User,
  value: string
): Promise<void> => user.type(cityNameField(canvasElement), value);

const findRegionSuggestion = (
  canvasElement: HTMLElement,
  name: string
): Promise<HTMLElement> =>
  within(canvasElement).findByRole("menuitem", { name }, { timeout: 5000 });

const selectRegion = async (
  canvasElement: HTMLElement,
  user: User,
  query: string,
  name: string
): Promise<void> => {
  await user.type(regionField(canvasElement), query);
  await user.click(await findRegionSuggestion(canvasElement, name));
};

const blur = (user: User): Promise<void> => user.tab();

export const Primary: Story = {};

export const ShowsInlineNameConflictWhenCityAlreadyExists: Story = {
  decorators: [withServer(409)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const field = cityNameField(canvasElement);

    await fillCityName(canvasElement, user, "Telšiai");
    await selectRegion(canvasElement, user, "Sam", "Samogitia");
    await user.click(saveButton(canvasElement));

    expect(
      await canvas.findByText("A city with this name already exists.")
    ).toBeInTheDocument();
    await waitFor(() => expect(field).toHaveFocus());
    expect(regionField(canvasElement)).toHaveValue("Samogitia");

    await user.type(field, " updated");
    await waitFor(() =>
      expect(
        canvas.queryByText("A city with this name already exists.")
      ).not.toBeInTheDocument()
    );
  }
};

export const ShowsEmptyFormWithSaveDisabled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(
      canvas.getByRole("heading", { name: "Add City" })
    ).toBeInTheDocument();
    expect(cityNameField(canvasElement)).toHaveValue("");
    expect(regionField(canvasElement)).toHaveValue("");
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};

export const KeepsSaveDisabledWithOnlyRegionSelected: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await selectRegion(canvasElement, user, "Sam", "Samogitia");

    expect(regionField(canvasElement)).toHaveValue("Samogitia");
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};

export const KeepsSaveDisabledWithOnlyCityName: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await fillCityName(canvasElement, user, "Telšiai");

    expect(cityNameField(canvasElement)).toHaveValue("Telšiai");
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};

export const KeepsSaveDisabledWhenRegionChangedAfterSelection: Story = {
  play: async ({ canvasElement }) => {
    const user = setupUser();

    await fillCityName(canvasElement, user, "Telšiai");
    await selectRegion(canvasElement, user, "Sam", "Samogitia");

    // Editing the region after selecting clears the chosen id, so the form is
    // invalid again even though the field still holds text.
    await user.clear(regionField(canvasElement));
    await user.type(regionField(canvasElement), "Invalid");

    expect(regionField(canvasElement)).toHaveValue("Invalid");
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};

export const SuggestsMatchingRegions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await user.type(regionField(canvasElement), "Samo");

    expect(regionField(canvasElement)).toHaveValue("Samo");
    await findRegionSuggestion(canvasElement, "Samogitia");
    expect(
      canvas.getAllByRole("menuitem").map((item) => item.textContent)
    ).toEqual(["Samogitia"]);
  }
};

export const EnablesSaveWithValidCityAndRegion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await fillCityName(canvasElement, user, "Telšiai");
    await selectRegion(canvasElement, user, "Sam", "Samogitia");

    expect(canvas.queryByRole("menuitem")).not.toBeInTheDocument();
    await waitFor(() => expect(saveButton(canvasElement)).toBeEnabled());
  }
};

export const ShowsErrorWhenCityNameTooShort: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectRegion(canvasElement, user, "Sam", "Samogitia");
    await fillCityName(canvasElement, user, "Telšiai");
    await user.clear(cityNameField(canvasElement));
    await blur(user);

    expect(
      await canvas.findByText("City name may not be null or empty")
    ).toBeInTheDocument();
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};

export const ShowsErrorWhenCityNameTooLong: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();

    await selectRegion(canvasElement, user, "Sam", "Samogitia");
    await fillCityName(canvasElement, user, "a".repeat(265));
    await blur(user);

    expect(
      await canvas.findByText("City name may not be longer then 256 characters")
    ).toBeInTheDocument();
    expect(saveButton(canvasElement)).toBeDisabled();
  }
};
