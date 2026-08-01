import { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, waitFor } from "@storybook/test";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import AddAttraction from "./AddAttraction";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddAttraction> = {
  component: AddAttraction,
  decorators: [
    (Story) => (
      <>
        <MemoryRouter initialEntries={["/"]}>
          <Story />
        </MemoryRouter>
        <style>{styleOverrides}</style>
      </>
    )
  ]
};

export default meta;

type Story = StoryObj<typeof AddAttraction>;

type User = ReturnType<typeof userEvent.setup>;

let server: ReturnType<typeof makeServer> | undefined;

// Fluent callouts/options animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Typing instantly (delay: null)
// avoids re-rendering (e.g. the date calendar) on every keystroke.
const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// A fresh Mirage server per story, so the save-error variants can request a
// specific HTTP status without leaking into the others. react/display-name is
// disabled because this renders a Storybook decorator, not a UI component.
/* eslint-disable react/display-name */
const withServer =
  (options?: { saveAttractionStatus?: number }): Decorator =>
  (Story) => {
    server?.shutdown();
    server = makeServer(options);
    return <Story />;
  };
/* eslint-enable react/display-name */

const getSaveButton = (): HTMLElement =>
  screen.getByRole("button", { name: "Save" });

const expectSaveDisabled = (): Promise<void> =>
  waitFor(() => expect(getSaveButton()).toBeDisabled());

const expectSaveEnabled = (): Promise<void> =>
  waitFor(() => expect(getSaveButton()).toBeEnabled());

const selectCountry = async (
  user: User,
  name = "Monaco",
  query = "Mon"
): Promise<void> => {
  await user.type(screen.getByLabelText("Select a country"), query);
  await user.click(
    await screen.findByRole("menuitem", { name }, { timeout: 5000 })
  );
};

const selectCity = async (
  user: User,
  name = "Monaco, Monaco, Monaco",
  query = "Mon"
): Promise<void> => {
  await user.type(screen.getByLabelText("Select a city"), query);
  await user.click(
    await screen.findByRole("menuitem", { name }, { timeout: 5000 })
  );
};

const enableRegionLevel = (user: User): Promise<void> =>
  user.click(screen.getByLabelText("Attraction is region level"));

const selectRegion = async (
  user: User,
  name = "Monaco",
  query = "Mon"
): Promise<void> => {
  await user.type(screen.getByLabelText("Select a region"), query);
  await user.click(
    await screen.findByRole("menuitem", { name }, { timeout: 5000 })
  );
};

const typeAttractionName = (
  user: User,
  value = "Casino Square"
): Promise<void> => user.type(screen.getByLabelText("Attraction name"), value);

const selectCategory = async (
  user: User,
  name = "ART_MUSEUM"
): Promise<void> => {
  await user.click(
    screen.getByRole("combobox", { name: "Attraction category" })
  );
  await user.click(await screen.findByRole("option", { name }));
};

const selectSource = async (
  user: User,
  name = "Lonely Planet",
  query = "Lonely"
): Promise<void> => {
  await user.type(screen.getByLabelText("Where information comes from"), query);
  await user.click(
    await screen.findByRole("menuitem", { name }, { timeout: 5000 })
  );
};

const pickRecordedDateToday = async (user: User): Promise<void> => {
  // Typing does not commit the Fluent date picker via user-event, so open the
  // calendar and click today's button (always enabled and within maxDate). The
  // day <button> carries the accessible name; its <td> intercepts pointer
  // events, which the pointerEventsCheck override lets us bypass.
  await user.click(
    screen.getByRole("combobox", { name: /Date of information recording/ })
  );
  const now = new Date();
  const today = `${now.getDate()}, ${now.toLocaleString("en-US", {
    month: "long"
  })}, ${now.getFullYear()}`;
  await user.click(await screen.findByRole("button", { name: today }));
};

// Pastes a value (instead of typing) so multi-thousand-character inputs do not
// fire a state update per character, then blurs to trigger Fluent's
// validateOnFocusOut validation.
const enterAndBlur = async (
  user: User,
  field: HTMLElement,
  value: string
): Promise<void> => {
  await user.click(field);
  await user.paste(value);
  await user.tab();
};

// Fills every required field with a valid attraction, without submitting. Type
// defaults to STABLE, so it is left as-is.
const completeRequiredFields = async (user: User): Promise<void> => {
  await selectCountry(user);
  await selectCity(user);
  await typeAttractionName(user);
  await selectCategory(user);
  await selectSource(user);
  await pickRecordedDateToday(user);
};

export const ShowsInlineNameConflictErrorWhenAttractionAlreadyExists: Story = {
  decorators: [withServer({ saveAttractionStatus: 409 })],
  play: async () => {
    const user = setupUser();
    await completeRequiredFields(user);
    await user.click(getSaveButton());

    await expect(
      await screen.findByText(/already exists/i, {}, { timeout: 5000 })
    ).toBeInTheDocument();
  }
};

export const ShowsGenericErrorBarWhenSaveFailsOnServer: Story = {
  decorators: [withServer({ saveAttractionStatus: 500 })],
  play: async () => {
    const user = setupUser();
    await completeRequiredFields(user);
    await user.click(getSaveButton());

    await expect(
      await screen.findByText(/wasn't saved/i, {}, { timeout: 5000 })
    ).toBeInTheDocument();
  }
};

export const SavesWithCtrlS: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();
    await user.click(screen.getByLabelText("add one attraction"));
    await completeRequiredFields(user);

    await expectSaveEnabled();

    await user.keyboard("{Control>}s{/Control}");

    await waitFor(() =>
      expect(screen.getByLabelText("Attraction name")).toHaveValue("")
    );
  }
};

export const SaveDisabledOnEmptyForm: Story = {
  decorators: [withServer()],
  play: async () => {
    await expectSaveDisabled();
  }
};

export const SaveDisabledWithOnlyCountry: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await selectCountry(user);

    await expectSaveDisabled();
  }
};

export const SaveDisabledWithCountryAndCity: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await selectCountry(user);
    await selectCity(user);

    await expectSaveDisabled();
  }
};

export const SaveDisabledWithCountryAndRegion: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await selectCountry(user);
    await enableRegionLevel(user);
    await selectRegion(user);

    await expectSaveDisabled();
  }
};

export const SaveDisabledUntilInformationRecordedIsSet: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await selectCountry(user);
    await selectCity(user);
    await typeAttractionName(user);
    await selectCategory(user);
    await selectSource(user);

    await expectSaveDisabled();
  }
};

export const SaveEnabledWithAllRequiredFields: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await completeRequiredFields(user);

    await expectSaveEnabled();
  }
};

export const ShowsErrorWhenCountryDeselected: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await selectCountry(user);
    // Typing over the chosen country clears the selection.
    await user.clear(screen.getByLabelText("Select a country"));
    await user.type(screen.getByLabelText("Select a country"), "Wrong");

    await expect(
      await screen.findByText("Country must be selected", {}, { timeout: 5000 })
    ).toBeInTheDocument();
    await expectSaveDisabled();
  }
};

export const ShowsErrorWhenCityDeselected: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await selectCountry(user);
    await selectCity(user);
    await user.clear(screen.getByLabelText("Select a city"));
    await user.type(screen.getByLabelText("Select a city"), "Wrong");

    await expect(
      await screen.findByText("City must be selected", {}, { timeout: 5000 })
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenRegionDeselected: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await selectCountry(user);
    await enableRegionLevel(user);
    await selectRegion(user);
    await user.clear(screen.getByLabelText("Select a region"));
    await user.type(screen.getByLabelText("Select a region"), "Wrong");

    await expect(
      await screen.findByText("Region must be selected", {}, { timeout: 5000 })
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenNameCleared: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await typeAttractionName(user);
    await user.clear(screen.getByLabelText("Attraction name"));
    await user.tab();

    await expect(
      await screen.findByText(
        "Attraction name may not be null or empty",
        {},
        { timeout: 5000 }
      )
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenNameTooLong: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await enterAndBlur(
      user,
      screen.getByLabelText("Attraction name"),
      "a".repeat(2049)
    );

    await expect(
      await screen.findByText(
        "Attraction name may not be longer then 2048 characters",
        {},
        { timeout: 5000 }
      )
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenAddressTooLong: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await enterAndBlur(
      user,
      screen.getByLabelText("Attraction address"),
      "a".repeat(513)
    );

    await expect(
      await screen.findByText(
        "Attraction address may not be longer then 512 characters",
        {},
        { timeout: 5000 }
      )
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenTipTooLong: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await enterAndBlur(user, screen.getByLabelText("Tip"), "a".repeat(2049));

    await expect(
      await screen.findByText(
        "Tip may not be longer then 2048 characters",
        {},
        { timeout: 5000 }
      )
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenSourceCleared: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await selectSource(user);
    await user.clear(screen.getByLabelText("Where information comes from"));
    await user.tab();

    await expect(
      await screen.findByText(
        "Info from may not be null or empty",
        {},
        { timeout: 5000 }
      )
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenSourceTooLong: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await enterAndBlur(
      user,
      screen.getByLabelText("Where information comes from"),
      "a".repeat(513)
    );

    await expect(
      await screen.findByText(
        "Info from may not be longer then 512 characters",
        {},
        { timeout: 5000 }
      )
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenGeoLocationLatitudeInvalid: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await enterAndBlur(
      user,
      screen.getByLabelText("Geo location"),
      "90.000001,-7.4247538"
    );

    await expect(
      await screen.findByText("Invalid latitude", {}, { timeout: 5000 })
    ).toBeInTheDocument();
  }
};

export const ShowsErrorWhenGeoLocationLongitudeInvalid: Story = {
  decorators: [withServer()],
  play: async () => {
    const user = setupUser();

    await enterAndBlur(
      user,
      screen.getByLabelText("Geo location"),
      "43.7397097,-180.00001"
    );

    await expect(
      await screen.findByText("Invalid longitude", {}, { timeout: 5000 })
    ).toBeInTheDocument();
  }
};
