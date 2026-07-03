import { Meta, StoryObj } from "@storybook/react";
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

/** Fills the form with a valid attraction and clicks Save. */
const fillAttractionForm = async (): Promise<void> => {
  // Fluent callouts/options animate in and briefly set pointer-events: none,
  // so disable user-event's interactability guard. Typing instantly avoids the
  // date calendar re-rendering on every keystroke.
  const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });

  // Country
  await user.type(screen.getByLabelText("Select a country"), "Mon");
  await user.click(
    await screen.findByRole("menuitem", { name: "Monaco" }, { timeout: 5000 })
  );

  // City
  await user.type(screen.getByLabelText("Select a city"), "Mon");
  await user.click(
    await screen.findByRole(
      "menuitem",
      { name: "Monaco, Monaco, Monaco" },
      { timeout: 5000 }
    )
  );

  // Attraction name
  await user.type(screen.getByLabelText("Attraction name"), "Casino Square");

  // Category (Type defaults to STABLE, so it is left as-is)
  await user.click(
    screen.getByRole("combobox", { name: "Attraction category" })
  );
  await user.click(await screen.findByRole("option", { name: "ART_MUSEUM" }));

  // Where the information comes from — pick the suggestion so its dropdown
  // closes and does not overlap the Save button.
  await user.type(screen.getByLabelText("Where information comes from"), "Lonely");
  await user.click(
    await screen.findByRole(
      "menuitem",
      { name: "Lonely Planet" },
      { timeout: 5000 }
    )
  );

  // Date of information recording — typing does not commit the Fluent date
  // picker via user-event, so open the calendar and click today's button
  // (always enabled). The day <button> carries the accessible name; its <td>
  // intercepts pointer events, which the disabled guard above lets us bypass.
  await user.click(
    screen.getByRole("combobox", { name: /Date of information recording/ })
  );
  const now = new Date();
  const today = `${now.getDate()}, ${now.toLocaleString("en-US", {
    month: "long"
  })}, ${now.getFullYear()}`;
  await user.click(await screen.findByRole("button", { name: today }));

  // Submit
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
  );
  await user.click(screen.getByRole("button", { name: "Save" }));
};

export const Primary: Story = {
  decorators: [
    (Story) => {
      makeServer();
      return <Story />;
    }
  ]
};

/**
 * Saving fails with a name conflict (HTTP 409, errorCode NAME_CONFLICT). The
 * conflict is shown inline under the attraction name and all entered data is
 * preserved, so the name can be corrected and retried.
 */
export const SaveConflict: Story = {
  decorators: [
    (Story) => {
      makeServer({ saveAttractionStatus: 409 });
      return <Story />;
    }
  ],
  play: async () => {
    await fillAttractionForm();
    await expect(
      await screen.findByText(/already exists/i, {}, { timeout: 5000 })
    ).toBeInTheDocument();
  }
};

/**
 * Saving fails with a generic server error (HTTP 500). A message bar is shown
 * above the actions and all entered data is preserved.
 */
export const SaveServerError: Story = {
  decorators: [
    (Story) => {
      makeServer({ saveAttractionStatus: 500 });
      return <Story />;
    }
  ],
  play: async () => {
    await fillAttractionForm();
    await expect(
      await screen.findByText(/wasn't saved/i, {}, { timeout: 5000 })
    ).toBeInTheDocument();
  }
};
