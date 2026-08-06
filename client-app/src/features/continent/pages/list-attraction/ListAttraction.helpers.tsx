import { Decorator } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

let server: ReturnType<typeof makeServer>;

// Tear down the previous story's Mirage server before starting a new one;
// otherwise multiple Pretender instances stack up and corrupt paginated
// reloads (sort/delete) when the runner plays stories back to back.
export const withFreshServer: Decorator = (Story, context) => {
  const closedAttractionId = context.parameters
    .permanentlyClosedAttractionId as number | undefined;
  const updateAttractionStatus = context.parameters.updateAttractionStatus as
    number | undefined;
  server?.shutdown();
  server = makeServer({
    permanentlyClosedAttractionId: closedAttractionId,
    updateAttractionStatus
  });
  return (
    <>
      <MemoryRouter initialEntries={["/"]}>
        <Story />
      </MemoryRouter>
      <style>{styleOverrides}</style>
    </>
  );
};

export type User = ReturnType<typeof userEvent.setup>;

// Fluent modals/callouts animate in and briefly set pointer-events: none, so
// disable user-event's interactability guard. Clicking instantly (delay: null)
// avoids racing the debounced reload effect that fires on every change.
export const setupUser = (): User =>
  userEvent.setup({ pointerEventsCheck: 0, delay: null });

// The Fluent edit Modal portals into a layer appended to <body>, outside the
// story canvas, so its contents are queried through the document.
export const overlay = (
  canvasElement: HTMLElement
): ReturnType<typeof within> => within(canvasElement.ownerDocument.body);

export const waitForCanvasToBecomeAccessible = async (
  canvasElement: HTMLElement
): Promise<void> => {
  await waitFor(() => expect(canvasElement).not.toHaveAttribute("aria-hidden"));
};

export const searchFor = async (
  canvasElement: HTMLElement,
  user: User,
  text: string
): Promise<void> => {
  const box = within(canvasElement).getByRole("searchbox");
  await user.clear(box);
  await user.type(box, text);
};

export const openAttractionNameEditor = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", {
      name: `Change attraction details from ${name}`
    })
  );
  await overlay(canvasElement).findByRole("heading", {
    name: `Modifying ${name}`
  });
};

export const waitForAllAttractionsToLoad = (
  canvasElement: HTMLElement
): Promise<HTMLElement> =>
  within(canvasElement).findByRole(
    "button",
    { name: "Change attraction details from Casino of Monte-Carlo" },
    { timeout: 8000 }
  );

export const rowOf = (
  canvasElement: HTMLElement,
  attractionName: string
): HTMLElement =>
  within(canvasElement)
    .getByRole("button", {
      name: `Change attraction details from ${attractionName}`
    })
    .closest('[role="row"]') as HTMLElement;

export const selectAttractionRow = async (
  canvasElement: HTMLElement,
  user: User,
  attractionName: string
): Promise<HTMLElement> => {
  const row = rowOf(canvasElement, attractionName);
  await user.click(within(row).getByRole("radio", { name: "select row" }));
  return row;
};

export const openAttractionDeleteDialog = async (
  canvasElement: HTMLElement,
  user: User,
  attractionName: string
): Promise<void> => {
  await selectAttractionRow(canvasElement, user, attractionName);
  await waitFor(() =>
    expect(
      within(canvasElement).getByRole("menuitem", { name: "Delete attraction" })
    ).toBeEnabled()
  );
  await user.click(
    within(canvasElement).getByRole("menuitem", { name: "Delete attraction" })
  );
  await overlay(canvasElement).findByRole(
    "button",
    { name: "Delete" },
    { timeout: 5000 }
  );
};

export const openEditDialog = async (
  canvasElement: HTMLElement,
  user: User,
  triggerName: string
): Promise<void> => {
  await user.click(
    within(canvasElement).getByRole("button", { name: triggerName })
  );
};

export const destinationTextbox = (
  canvasElement: HTMLElement,
  name: "Select a country" | "Select a region" | "Select a city"
): HTMLElement => overlay(canvasElement).getByLabelText(name);

export const pickSuggestion = async (
  canvasElement: HTMLElement,
  user: User,
  name: string
): Promise<void> => {
  await user.click(
    await overlay(canvasElement).findByRole("menuitem", { name })
  );
};

export const expectSuggestionBelowInput = (
  input: HTMLElement,
  suggestion: HTMLElement
): void => {
  const inputControl =
    input.closest<HTMLElement>(".fui-Input, .fui-Textarea") ?? input;
  const inputRect = inputControl.getBoundingClientRect();
  const suggestionRect = suggestion.getBoundingClientRect();

  expect(Math.abs(suggestionRect.left - inputRect.left)).toBeLessThan(1);
  expect(Math.abs(suggestionRect.right - inputRect.right)).toBeLessThan(1);
  expect(Math.abs(suggestionRect.top - inputRect.bottom)).toBeLessThan(1);
};

export const updateButton = (canvasElement: HTMLElement): HTMLElement =>
  overlay(canvasElement).getByRole("button", { name: "Update" });

export const cancelButton = (canvasElement: HTMLElement): HTMLElement =>
  overlay(canvasElement).getByRole("button", { name: "Cancel" });

export const modalDropdown = (
  canvasElement: HTMLElement,
  headingName: string
): HTMLElement => {
  const modal = overlay(canvasElement)
    .getByRole("heading", { name: headingName })
    .closest('[role="dialog"]') as HTMLElement;
  return within(modal).getByRole("combobox");
};
