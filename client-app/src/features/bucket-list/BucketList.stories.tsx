import { Meta, StoryObj } from "@storybook/react";
import { Response as MirageResponse } from "miragejs";
import type { ResponseData, ResponseHandler } from "pretender";
import { act } from "react";
import { MemoryRouter } from "react-router";
import { expect, userEvent, waitFor, within } from "storybook/test";
import makeServer from "../../ServerSetup";
import { SOLID_STORY_BACKGROUND_STYLES as styleOverrides } from "../../shared/storybook/StoryStyles";
import BucketList from "./BucketList";
import type { BucketListItem } from "./BucketList.types";

let server: ReturnType<typeof makeServer> | undefined;
const completionDate = new Date();
const completionDateIso = `${completionDate.getFullYear()}-${String(
  completionDate.getMonth() + 1
).padStart(2, "0")}-${String(completionDate.getDate()).padStart(2, "0")}`;

const meta: Meta<typeof BucketList> = {
  component: BucketList,
  tags: ["wide"],
  decorators: [
    (Story) => {
      server?.shutdown();
      server = makeServer({
        tripDateOverrides: [
          {
            tripId: 1,
            fromDate: completionDateIso,
            toDate: completionDateIso
          }
        ]
      });
      return (
        <MemoryRouter initialEntries={["/bucket-list"]}>
          <Story />
          <style>{styleOverrides}</style>
        </MemoryRouter>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof BucketList>;

const holdBucketListRead = (
  path = "/bucket-list/items"
): {
  requests: Parameters<ResponseHandler>[0][];
  respond: (body: unknown, status?: number) => Promise<void>;
} => {
  if (!server) throw new Error("Bucket list server was not started");

  const response = Promise.withResolvers<ResponseData>();
  const delivered = Promise.withResolvers<void>();
  const requests: Parameters<ResponseHandler>[0][] = [];
  server.pretender.get(
    `http://localhost:8080${path}`,
    (request) => {
      requests.push(request);
      request.addEventListener("loadend", () => delivered.resolve());
      return response.promise;
    },
    false
  );

  return {
    requests,
    respond: async (body, status = 200) => {
      await waitFor(() => expect(requests).toHaveLength(1));
      const previousActEnvironment = Reflect.get(
        globalThis,
        "IS_REACT_ACT_ENVIRONMENT"
      );
      Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
      try {
        await act(async () => {
          response.resolve([
            status,
            { "Content-Type": "application/json" },
            JSON.stringify(body)
          ]);
          await delivered.promise;
        });
      } finally {
        Reflect.set(
          globalThis,
          "IS_REACT_ACT_ENVIRONMENT",
          previousActEnvironment
        );
      }
    }
  };
};

const waitForCanvasToBecomeAccessible = async (
  canvasElement: HTMLElement
): Promise<void> => {
  await waitFor(() =>
    expect(canvasElement.closest('[aria-hidden="true"]')).toBeNull()
  );
};

const findDialog = async (
  canvasElement: HTMLElement,
  heading: string
): Promise<HTMLElement> => {
  const title = await within(canvasElement.ownerDocument.body).findByRole(
    "heading",
    { name: heading }
  );
  const dialog = title.closest('[role="dialog"]');
  if (!dialog) throw new Error(`${heading} dialog was not found`);
  return dialog as HTMLElement;
};

const completeParaglidingToday = async (
  canvasElement: HTMLElement,
  wouldRepeat = false
): Promise<{
  canvas: ReturnType<typeof within>;
  user: ReturnType<typeof userEvent.setup>;
  paraglidingRow: () => HTMLElement;
  todayIso: string;
}> => {
  const canvas = within(canvasElement);
  const overlay = within(canvasElement.ownerDocument.body);
  const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });

  const staleDialogTitle = overlay.queryByRole("heading", {
    name: /^Complete /i
  });
  const staleDialog = staleDialogTitle?.closest('[role="dialog"]');
  if (staleDialog) {
    await user.click(
      within(staleDialog as HTMLElement).getByRole("button", {
        name: "Cancel"
      })
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
  }

  await canvas.findByText("Paragliding");

  await user.click(
    await canvas.findByRole("button", { name: "Mark as completed" })
  );

  const dialogTitle = await overlay.findByText("Complete Paragliding");
  const dialogElement = dialogTitle.closest('[role="dialog"]');
  if (!dialogElement) throw new Error("Completion dialog was not found");
  const dialog = within(dialogElement as HTMLElement);
  await user.click(dialog.getByLabelText("Select completion date"));
  const selectedDate = `${completionDate.getDate()}, ${completionDate.toLocaleString(
    "en-US",
    {
      month: "long"
    }
  )}, ${completionDate.getFullYear()}`;
  await user.click(await overlay.findByRole("button", { name: selectedDate }));
  await overlay.findByText("Finding trip...");
  await waitFor(
    () =>
      expect(overlay.queryByText("Finding trip...")).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
  await expect(await dialog.findByText("Italy")).toBeVisible();
  const repeatCheckbox = dialog.getByRole("checkbox", {
    name: "Would do again"
  });
  await expect(repeatCheckbox).not.toBeChecked();
  if (wouldRepeat) {
    await user.click(repeatCheckbox);
  }
  await user.click(dialog.getByText("Mark completed", { selector: "button" }));

  await waitFor(() =>
    expect(
      overlay.queryByRole("heading", { name: "Complete Paragliding" })
    ).not.toBeInTheDocument()
  );
  await waitForCanvasToBecomeAccessible(canvasElement);

  const paraglidingRow = (): HTMLElement => {
    const row = canvas.getByText("Paragliding").closest("tr");
    if (!row) throw new Error("Paragliding row was not found");
    return row;
  };

  return { canvas, user, paraglidingRow, todayIso: completionDateIso };
};

export const Primary: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Paragliding")).toBeVisible();
    await expect(canvas.getByText("Zorbing")).toBeVisible();
    await expect(
      canvas.getByRole("columnheader", { name: "Name" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("columnheader", { name: "Location" })
    ).toBeVisible();
    const paraglidingRow = canvas.getByText("Paragliding").closest("tr");
    if (!paraglidingRow) throw new Error("Paragliding row was not found");
    const cells = within(paraglidingRow).getAllByRole("cell");
    await expect(cells).toHaveLength(6);
    await expect(cells[0]).toHaveTextContent(/^Paragliding$/);
    await expect(within(cells[1]).getByText("Dzūkija")).toBeVisible();
    await expect(within(cells[1]).getByText("Region")).toBeVisible();
    await expect(
      within(paraglidingRow).queryByText(/Would.*do again|Repeat: not answered/)
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "To do (1)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (1)" })
    ).toBeVisible();
  }
};

export const FindsCompletedItemBeyondDownloadedItems: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");
    await canvas.findByText("Zorbing");

    server?.db.bucketListItems.insert({
      id: 3,
      name: "Hidden completed experience",
      completedOn: "2025-04-12",
      wouldRepeat: true,
      cityId: null,
      cityName: null,
      regionId: null,
      regionName: null,
      description: null,
      tripId: 1,
      tripName: "Italy",
      changedOn: "2025-04-12T10:00:00.0000000"
    });

    await user.click(canvas.getByRole("tab", { name: /Completed/ }));

    await expect(
      await canvas.findByText("Hidden completed experience")
    ).toBeVisible();
    await expect(canvas.queryByText("Paragliding")).not.toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "All (3)" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "To do (1)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (2)" })
    ).toBeVisible();
  }
};

export const IgnoresStaleFilterContentAndCounts: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    const obsoleteContent = holdBucketListRead();
    const obsoleteCounts = holdBucketListRead("/bucket-list/items/counts");
    await user.click(canvas.getByRole("tab", { name: /Completed/ }));
    await waitFor(() =>
      expect(obsoleteContent.requests[0]?.queryParams).toEqual({
        status: "COMPLETED"
      })
    );
    await waitFor(() => expect(obsoleteCounts.requests).toHaveLength(1));

    const currentContent = holdBucketListRead();
    const currentCounts = holdBucketListRead("/bucket-list/items/counts");
    await user.click(canvas.getByRole("tab", { name: /To do/ }));
    await currentContent.respond([
      {
        id: 1,
        name: "Current to-do response",
        completedOn: null,
        changedOn: "2026-08-20T10:00:00.0000000"
      }
    ]);
    await currentCounts.respond({ all: 2, todo: 1, completed: 1 });
    await expect(
      await canvas.findByText("Current to-do response")
    ).toBeVisible();

    const terminal = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await terminal.respond([]);
    await obsoleteContent.respond([
      {
        id: 2,
        name: "Obsolete completed response",
        completedOn: "2026-06-14",
        changedOn: "2026-06-14T18:30:00.0000000"
      }
    ]);
    await obsoleteCounts.respond({ all: 101, todo: 100, completed: 1 });

    await expect(canvas.getByText("Current to-do response")).toBeVisible();
    await expect(
      canvas.queryByText("Obsolete completed response")
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "All (2)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "To do (1)" })
    ).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tablist")).toHaveAttribute(
      "aria-busy",
      "false"
    );
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: /Load more|Loading\.\.\.|Retry/ })
    ).not.toBeInTheDocument();
  }
};

export const KeepsCurrentErrorsAfterObsoleteSuccesses: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    const obsoleteContent = holdBucketListRead();
    const obsoleteCounts = holdBucketListRead("/bucket-list/items/counts");
    await user.click(canvas.getByRole("tab", { name: /Completed/ }));
    await waitFor(() => expect(obsoleteContent.requests).toHaveLength(1));
    await waitFor(() => expect(obsoleteCounts.requests).toHaveLength(1));

    const failedContent = holdBucketListRead();
    const failedCounts = holdBucketListRead("/bucket-list/items/counts");
    await user.click(canvas.getByRole("tab", { name: /To do/ }));
    await failedContent.respond({}, 500);
    await failedCounts.respond({}, 500);
    await canvas.findByText("Bucket list could not be loaded.");
    await canvas.findByText("Bucket list counters could not be loaded.");

    await obsoleteContent.respond([
      {
        id: 2,
        name: "Obsolete completed item",
        completedOn: "2026-06-14",
        changedOn: "2026-06-14T18:30:00.0000000"
      }
    ]);
    await obsoleteCounts.respond({ all: 101, todo: 100, completed: 1 });

    await expect(
      canvas.getByText("Bucket list could not be loaded.")
    ).toBeVisible();
    await expect(
      canvas.getByText("Bucket list counters could not be loaded.")
    ).toBeVisible();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(
      canvas.queryByText("No to-do items yet.")
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "All (2)" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeEnabled();
    await expect(canvas.getByRole("tablist")).toHaveAttribute(
      "aria-busy",
      "false"
    );

    const retryContent = holdBucketListRead();
    const retryCounts = holdBucketListRead("/bucket-list/items/counts");
    await user.click(canvas.getByRole("button", { name: "Retry" }));
    await waitFor(() =>
      expect(retryContent.requests[0]?.queryParams).toEqual({ status: "TODO" })
    );
    await retryContent.respond([
      {
        id: 1,
        name: "Recovered to-do item",
        completedOn: null,
        changedOn: "2026-08-20T10:00:00.0000000"
      }
    ]);
    await retryCounts.respond({ all: 2, todo: 1, completed: 1 });
    await expect(await canvas.findByText("Recovered to-do item")).toBeVisible();
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await expect(
      canvas.queryByText("Bucket list could not be loaded.")
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByText("Bucket list counters could not be loaded.")
    ).not.toBeInTheDocument();
  }
};

export const IgnoresObsoleteFailuresAfterAFilterRefresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    const obsoleteContent = holdBucketListRead();
    const obsoleteCounts = holdBucketListRead("/bucket-list/items/counts");
    await user.click(canvas.getByRole("tab", { name: /Completed/ }));
    await waitFor(() => expect(obsoleteContent.requests).toHaveLength(1));
    await waitFor(() => expect(obsoleteCounts.requests).toHaveLength(1));

    const currentContent = holdBucketListRead();
    const currentCounts = holdBucketListRead("/bucket-list/items/counts");
    await user.click(canvas.getByRole("tab", { name: /To do/ }));
    await currentContent.respond([
      {
        id: 1,
        name: "Current to-do item",
        completedOn: null,
        changedOn: "2026-08-20T10:00:00.123456"
      }
    ]);
    await currentCounts.respond({ all: 3, todo: 2, completed: 1 });
    await canvas.findByText("Current to-do item");

    const failedContinuation = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await failedContinuation.respond({}, 500);
    await canvas.findByText("More bucket list items could not be loaded.");
    await obsoleteContent.respond({}, 500);
    await obsoleteCounts.respond({}, 500);

    await expect(canvas.getByText("Current to-do item")).toBeVisible();
    await expect(
      canvas.getByText("More bucket list items could not be loaded.")
    ).toBeVisible();
    await expect(
      canvas.queryByText("Bucket list could not be loaded.")
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByText("Bucket list counters could not be loaded.")
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("tab", { name: "To do (2)" })
    ).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tablist")).toHaveAttribute(
      "aria-busy",
      "false"
    );

    const retry = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Retry" }));
    await waitFor(() =>
      expect(retry.requests[0]?.queryParams).toEqual({
        status: "TODO",
        itemId: "1",
        updatedOn: "2026-08-20T10:00:00.123456"
      })
    );
    await retry.respond([
      {
        id: 3,
        name: "Skydiving",
        completedOn: null,
        changedOn: "2025-01-01T00:00:00.123456"
      }
    ]);
    await expect(await canvas.findByText("Skydiving")).toBeVisible();
    await expect(canvas.getAllByText("Current to-do item")).toHaveLength(1);
    await expect(canvas.getAllByRole("row")).toHaveLength(3);
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  }
};

export const IgnoresAContinuationThatFinishesAfterAFilterRefresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");
    await canvas.findByText("Zorbing");

    const obsoleteContinuation = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() =>
      expect(obsoleteContinuation.requests[0]?.queryParams).toEqual({
        status: "ALL",
        itemId: "2",
        updatedOn: "2026-06-14T18:30:00.0000000"
      })
    );

    const refresh = holdBucketListRead();
    await user.click(canvas.getByRole("tab", { name: /Completed/ }));
    await refresh.respond([
      {
        id: 12,
        name: "Current completed item",
        completedOn: "2026-05-14",
        changedOn: "2026-05-14T18:30:00.123456"
      }
    ]);
    await canvas.findByText("Current completed item");

    const currentContinuation = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() =>
      expect(currentContinuation.requests[0]?.queryParams).toEqual({
        status: "COMPLETED",
        itemId: "12",
        updatedOn: "2026-05-14T18:30:00.123456"
      })
    );
    await obsoleteContinuation.respond([
      {
        id: 99,
        name: "Obsolete continuation item",
        completedOn: null,
        changedOn: "2025-01-01T00:00:00.0000000"
      }
    ]);

    await expect(canvas.getByText("Current completed item")).toBeVisible();
    await expect(
      canvas.queryByText("Obsolete continuation item")
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Loading..." })
    ).toBeDisabled();
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

    await currentContinuation.respond([
      {
        id: 13,
        name: "Next completed item",
        completedOn: "2026-04-12",
        changedOn: "2026-04-12T10:00:00.123456"
      }
    ]);
    await expect(await canvas.findByText("Next completed item")).toBeVisible();
    await expect(canvas.getAllByRole("row")).toHaveLength(3);

    const terminal = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() =>
      expect(terminal.requests[0]?.queryParams).toEqual({
        status: "COMPLETED",
        itemId: "13",
        updatedOn: "2026-04-12T10:00:00.123456"
      })
    );
    await terminal.respond([]);
    await expect(
      canvas.queryByRole("button", { name: /Load more|Loading\.\.\.|Retry/ })
    ).not.toBeInTheDocument();
  }
};

export const IgnoresAContinuationThatFinishesBeforeAFilterRefresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");
    await canvas.findByText("Zorbing");

    const obsoleteTerminal = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(obsoleteTerminal.requests).toHaveLength(1));

    const refresh = holdBucketListRead();
    await user.click(canvas.getByRole("tab", { name: /Completed/ }));
    await waitFor(() =>
      expect(refresh.requests[0]?.queryParams).toEqual({
        status: "COMPLETED"
      })
    );
    await obsoleteTerminal.respond([]);

    await expect(canvas.getByText("Loading bucket list")).toBeVisible();
    await expect(
      canvas.queryByText("No completed items yet.")
    ).not.toBeInTheDocument();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: /Load more|Retry/ })
    ).not.toBeInTheDocument();

    await refresh.respond([
      {
        id: 12,
        name: "Current completed item",
        completedOn: "2026-05-14",
        changedOn: "2026-05-14T18:30:00.123456"
      }
    ]);
    await expect(
      await canvas.findByText("Current completed item")
    ).toBeVisible();
    await expect(
      canvas.queryByText("Loading bucket list")
    ).not.toBeInTheDocument();
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

    const terminal = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() =>
      expect(terminal.requests[0]?.queryParams).toEqual({
        status: "COMPLETED",
        itemId: "12",
        updatedOn: "2026-05-14T18:30:00.123456"
      })
    );
    await terminal.respond([]);
    await expect(canvas.getAllByRole("row")).toHaveLength(2);
    await expect(
      canvas.queryByRole("button", { name: /Load more|Loading\.\.\.|Retry/ })
    ).not.toBeInTheDocument();
  }
};

const verifyRefreshedCursorAfterObsoleteContinuation =
  (obsoletePage: BucketListItem[]): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");
    await canvas.findByText("Zorbing");

    const obsoleteContinuation = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(obsoleteContinuation.requests).toHaveLength(1));

    const refresh = holdBucketListRead();
    await user.click(canvas.getByRole("tab", { name: /Completed/ }));
    await refresh.respond([
      {
        id: 12,
        name: "Current completed item",
        completedOn: "2026-05-14",
        changedOn: "2026-05-14T18:30:00.123456"
      }
    ]);
    await canvas.findByText("Current completed item");
    await obsoleteContinuation.respond(obsoletePage);

    await expect(canvas.getByText("Current completed item")).toBeVisible();
    await expect(canvas.getAllByRole("row")).toHaveLength(2);
    await expect(
      canvas.queryByText("Obsolete continuation item")
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Load more" })
    ).toBeEnabled();
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

    const terminal = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() =>
      expect(terminal.requests[0]?.queryParams).toEqual({
        status: "COMPLETED",
        itemId: "12",
        updatedOn: "2026-05-14T18:30:00.123456"
      })
    );
    await terminal.respond([]);
    await expect(canvas.getAllByRole("row")).toHaveLength(2);
    await expect(
      canvas.queryByRole("button", { name: /Load more|Loading\.\.\.|Retry/ })
    ).not.toBeInTheDocument();
  };

export const PreservesTheRefreshedCursorAfterAnObsoleteContentPage: Story = {
  play: verifyRefreshedCursorAfterObsoleteContinuation([
    {
      id: 99,
      name: "Obsolete continuation item",
      completedOn: null,
      changedOn: "2025-01-01T00:00:00.0000000"
    }
  ])
};

export const PreservesTheRefreshedCursorAfterAnObsoleteEmptyPage: Story = {
  play: verifyRefreshedCursorAfterObsoleteContinuation([])
};

export const CompletingTheLastTodoEmptiesTheListAndUpdatesCounts: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");
    await user.click(canvas.getByRole("tab", { name: /To do/ }));
    await canvas.findByText("Paragliding");

    await completeParaglidingToday(canvasElement);

    await expect(await canvas.findByText("No to-do items yet.")).toBeVisible();
    await expect(canvas.queryByText("Paragliding")).not.toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "All (2)" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "To do (0)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (2)" })
    ).toBeVisible();
  }
};

export const RetriesAnInitialReadFailureWithoutShowingAnEmptyList: Story = {
  decorators: [
    (Story) => {
      if (!server) throw new Error("Bucket list server was not started");
      server.get("/bucket-list/items", () => new MirageResponse(500), {
        timing: 0
      });
      server.get("/bucket-list/items/counts", () => new MirageResponse(500), {
        timing: 0
      });
      return <Story />;
    }
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Bucket list could not be loaded.");
    await canvas.findByText("Bucket list counters could not be loaded.");

    await expect(canvas.getByRole("tab", { name: "All (...)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "To do (...)" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (...)" })
    ).toBeVisible();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(
      canvas.queryByText("Your bucket list is ready for its first idea.")
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByText("Loading bucket list")
    ).not.toBeInTheDocument();

    const content = holdBucketListRead();
    const counts = holdBucketListRead("/bucket-list/items/counts");
    await user.click(canvas.getByRole("button", { name: "Retry" }));
    await waitFor(() =>
      expect(content.requests[0]?.queryParams).toEqual({ status: "ALL" })
    );
    await content.respond([
      {
        id: 1,
        name: "Paragliding",
        completedOn: null,
        changedOn: "2026-08-20T10:00:00.0000000"
      }
    ]);
    await counts.respond({ all: 1, todo: 1, completed: 0 });

    await expect(await canvas.findByText("Paragliding")).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "All (1)" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "To do (1)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (0)" })
    ).toBeVisible();
    await expect(
      canvas.queryByText("Bucket list could not be loaded.")
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByText("Bucket list counters could not be loaded.")
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Load more" })
    ).toBeEnabled();
  }
};

export const RetriesFailedContentAndCountersSeparately: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    server?.get("/bucket-list/items", () => new MirageResponse(500), {
      timing: 0
    });
    server?.get("/bucket-list/items/counts", () => new MirageResponse(500), {
      timing: 0
    });
    await user.click(canvas.getByRole("tab", { name: /Completed/ }));

    await expect(
      await canvas.findByText("Bucket list could not be loaded.")
    ).toBeVisible();
    await expect(
      canvas.getByText("Bucket list counters could not be loaded.")
    ).toBeVisible();
    await expect(
      canvas.queryByText("No completed items yet.")
    ).not.toBeInTheDocument();

    server?.get(
      "/bucket-list/items",
      () => [
        {
          id: 2,
          name: "Recovered completed item",
          completedOn: "2026-06-14",
          changedOn: "2026-06-14T18:30:00.0000000"
        }
      ],
      { timing: 0 }
    );
    await user.click(canvas.getByRole("button", { name: "Retry" }));

    await expect(
      await canvas.findByText("Recovered completed item")
    ).toBeVisible();
    await expect(
      canvas.getByText("Bucket list counters could not be loaded.")
    ).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "All (2)" })).toBeVisible();

    server?.get(
      "/bucket-list/items/counts",
      () => ({ all: 2, todo: 1, completed: 1 }),
      { timing: 0 }
    );
    await user.click(canvas.getByRole("button", { name: "Retry counters" }));

    await waitFor(() =>
      expect(
        canvas.queryByText("Bucket list counters could not be loaded.")
      ).not.toBeInTheDocument()
    );
    await expect(
      canvas.getByRole("tab", { name: "Completed (1)" })
    ).toBeVisible();
  }
};

export const RetriesContinuationAndTerminalFailuresWithoutLosingProgress: Story =
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
      await canvas.findByText("Paragliding");
      await canvas.findByText("Zorbing");
      await canvas.findByRole("tab", { name: "All (2)" });
      await user.click(canvas.getByRole("button", { name: "Name" }));
      await user.click(canvas.getByRole("button", { name: "Name" }));
      await expect(canvas.getAllByRole("row")[1]).toHaveTextContent("Zorbing");

      const unexpectedCounts = holdBucketListRead("/bucket-list/items/counts");
      const failedContinuation = holdBucketListRead();
      await user.click(canvas.getByRole("button", { name: "Load more" }));
      await user.click(canvas.getByRole("button", { name: "Loading..." }));
      await waitFor(() =>
        expect(failedContinuation.requests[0]?.queryParams).toEqual({
          status: "ALL",
          itemId: "2",
          updatedOn: "2026-06-14T18:30:00.0000000"
        })
      );
      await failedContinuation.respond({}, 500);
      await expect(
        await canvas.findByText("More bucket list items could not be loaded.")
      ).toBeVisible();
      await expect(canvas.getAllByRole("row")).toHaveLength(3);
      await expect(canvas.getByText("Paragliding")).toBeVisible();
      await expect(canvas.getByText("Zorbing")).toBeVisible();

      const retryContinuation = holdBucketListRead();
      await user.click(canvas.getByRole("button", { name: "Retry" }));
      await waitFor(() =>
        expect(retryContinuation.requests[0]?.queryParams).toEqual({
          status: "ALL",
          itemId: "2",
          updatedOn: "2026-06-14T18:30:00.0000000"
        })
      );
      await retryContinuation.respond([
        {
          id: 3,
          name: "Skydiving",
          completedOn: null,
          changedOn: "2025-01-01T00:00:00.123456"
        }
      ]);
      await canvas.findByText("Skydiving");
      await expect(canvas.getAllByRole("row")).toHaveLength(4);
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

      const failedTerminal = holdBucketListRead();
      await user.click(canvas.getByRole("button", { name: "Load more" }));
      await waitFor(() =>
        expect(failedTerminal.requests[0]?.queryParams).toEqual({
          status: "ALL",
          itemId: "3",
          updatedOn: "2025-01-01T00:00:00.123456"
        })
      );
      await failedTerminal.respond({}, 500);
      await expect(
        await canvas.findByText("More bucket list items could not be loaded.")
      ).toBeVisible();
      await expect(canvas.getAllByRole("row")).toHaveLength(4);
      await expect(
        canvas.queryByText("Your bucket list is ready for its first idea.")
      ).not.toBeInTheDocument();

      const retryTerminal = holdBucketListRead();
      await user.click(canvas.getByRole("button", { name: "Retry" }));
      await waitFor(() =>
        expect(retryTerminal.requests[0]?.queryParams).toEqual({
          status: "ALL",
          itemId: "3",
          updatedOn: "2025-01-01T00:00:00.123456"
        })
      );
      await retryTerminal.respond([]);
      await expect(canvas.getAllByText("Paragliding")).toHaveLength(1);
      await expect(canvas.getAllByText("Zorbing")).toHaveLength(1);
      await expect(canvas.getAllByText("Skydiving")).toHaveLength(1);
      await expect(
        canvas.queryByRole("button", { name: /Load more|Loading\.\.\.|Retry/ })
      ).not.toBeInTheDocument();
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
      await expect(unexpectedCounts.requests).toHaveLength(0);
      await expect(canvas.getByRole("tab", { name: "All (2)" })).toBeVisible();
    }
  };

export const ContinuesAfterDuplicatesAndRecoversFromAStalledCursor: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");
    await canvas.findByText("Zorbing");

    server?.get("/bucket-list/items/counts", () => new MirageResponse(500), {
      timing: 0
    });
    server?.get(
      "/bucket-list/items",
      () => [
        {
          id: 1,
          name: "Paragliding",
          completedOn: null,
          changedOn: "2025-01-01T00:00:00.0000000"
        }
      ],
      { timing: 0 }
    );

    await user.click(await canvas.findByRole("button", { name: "Load more" }));

    await expect(canvas.getAllByText("Paragliding")).toHaveLength(1);
    await expect(
      await canvas.findByRole("button", { name: "Load more" })
    ).toBeVisible();
    await expect(
      canvas.queryByText("Bucket list counters could not be loaded.")
    ).not.toBeInTheDocument();

    await user.click(await canvas.findByRole("button", { name: "Load more" }));

    await expect(
      await canvas.findByText("More bucket list items could not be loaded.")
    ).toBeVisible();
    server?.get("/bucket-list/items", () => [], { timing: 0 });
    await user.click(canvas.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Load more" })
      ).not.toBeInTheDocument()
    );
    await expect(canvas.getAllByText("Paragliding")).toHaveLength(1);
    await expect(canvas.getAllByText("Zorbing")).toHaveLength(1);
  }
};

export const RejectsACyclicContinuationAndRetriesTheLastAcceptedCursor: Story =
  {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
      await canvas.findByText("Paragliding");
      await canvas.findByText("Zorbing");

      const duplicatePage = holdBucketListRead();
      await user.click(canvas.getByRole("button", { name: "Load more" }));
      await duplicatePage.respond([
        {
          id: 1,
          name: "Paragliding",
          completedOn: null,
          changedOn: "2025-01-01T00:00:00.123456"
        }
      ]);
      await expect(canvas.getAllByRole("row")).toHaveLength(3);
      await expect(
        canvas.getByRole("button", { name: "Load more" })
      ).toBeEnabled();

      const cycle = holdBucketListRead();
      await user.click(canvas.getByRole("button", { name: "Load more" }));
      await waitFor(() =>
        expect(cycle.requests[0]?.queryParams).toEqual({
          status: "ALL",
          itemId: "1",
          updatedOn: "2025-01-01T00:00:00.123456"
        })
      );
      await cycle.respond([
        {
          id: 2,
          name: "Zorbing",
          completedOn: "2026-06-14",
          changedOn: "2026-06-14T18:30:00.0000000"
        }
      ]);
      await expect(
        await canvas.findByText("More bucket list items could not be loaded.")
      ).toBeVisible();
      await expect(canvas.getAllByRole("row")).toHaveLength(3);
      await expect(cycle.requests).toHaveLength(1);

      const retry = holdBucketListRead();
      await user.click(canvas.getByRole("button", { name: "Retry" }));
      await waitFor(() =>
        expect(retry.requests[0]?.queryParams).toEqual({
          status: "ALL",
          itemId: "1",
          updatedOn: "2025-01-01T00:00:00.123456"
        })
      );
      await retry.respond([
        {
          id: 3,
          name: "Skydiving",
          completedOn: null,
          changedOn: "2024-01-01T00:00:00.123456"
        }
      ]);
      await canvas.findByText("Skydiving");
      await expect(canvas.getAllByText("Paragliding")).toHaveLength(1);
      await expect(canvas.getAllByText("Zorbing")).toHaveLength(1);
      await expect(canvas.getAllByText("Skydiving")).toHaveLength(1);
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

      const terminal = holdBucketListRead();
      await user.click(canvas.getByRole("button", { name: "Load more" }));
      await waitFor(() =>
        expect(terminal.requests[0]?.queryParams).toEqual({
          status: "ALL",
          itemId: "3",
          updatedOn: "2024-01-01T00:00:00.123456"
        })
      );
      await terminal.respond([]);
      await expect(
        canvas.queryByRole("button", { name: /Load more|Loading\.\.\.|Retry/ })
      ).not.toBeInTheDocument();
      await expect(canvas.getAllByRole("row")).toHaveLength(4);
    }
  };

export const CanCompleteItemOnTripDate: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, paraglidingRow, todayIso } =
      await completeParaglidingToday(canvasElement);
    const completedDate = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(`${todayIso}T00:00:00Z`));

    await waitFor(() => {
      const row = within(paraglidingRow());
      expect(row.getByText("Completed")).toBeVisible();
      expect(row.getByText(completedDate)).toBeVisible();
      expect(row.getByText("Italy")).toBeVisible();
      expect(row.getByText("Would not do again")).toBeVisible();
      expect(
        row.getByRole("button", { name: "Move back to bucket list" })
      ).toBeEnabled();
    });
    await expect(canvas.getByRole("tab", { name: "To do (0)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (2)" })
    ).toBeVisible();

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.completedOn).toBe(todayIso);
    expect(savedItem?.tripId).toBe(1);
    expect(savedItem?.tripName).toBe("Italy");
    expect(savedItem?.wouldRepeat).toBe(false);
  }
};

export const CanCompleteItemAndChooseToRepeat: Story = {
  play: async ({ canvasElement }) => {
    const { paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      true
    );

    await expect(
      within(paraglidingRow()).getByText("Would do again")
    ).toBeVisible();
  }
};

export const CanCompleteItemAndChooseNotToRepeat: Story = {
  play: async ({ canvasElement }) => {
    const { paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      false
    );

    await expect(
      within(paraglidingRow()).getByText("Would not do again")
    ).toBeVisible();
  }
};

export const CanCompleteItemOnTripDateAndResetIt: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, user, paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      true
    );
    await waitFor(() => {
      expect(within(paraglidingRow()).getByText("Italy")).toBeVisible();
    });

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Move back to bucket list"
      })
    );
    await waitFor(() =>
      expect(
        within(paraglidingRow()).queryByText("Italy")
      ).not.toBeInTheDocument()
    );
    await expect(
      within(paraglidingRow()).getByText("Not completed")
    ).toBeVisible();
    await expect(
      within(paraglidingRow()).queryByText(
        /Would.*do again|Repeat: not answered/
      )
    ).not.toBeInTheDocument();

    const resetItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(resetItem?.completedOn).toBeNull();
    expect(resetItem?.tripId).toBeNull();
    expect(resetItem?.tripName).toBeNull();
    expect(resetItem?.wouldRepeat).toBeNull();
    await expect(canvas.getByRole("tab", { name: "All (2)" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "To do (1)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (1)" })
    ).toBeVisible();
  }
};

export const CanEditCompletionDetails: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow, todayIso } = await completeParaglidingToday(
      canvasElement,
      true
    );
    const overlay = within(canvasElement.ownerDocument.body);

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Change completion details for Paragliding"
      })
    );

    const dialogElement = await findDialog(
      canvasElement,
      "Edit completion for Paragliding"
    );
    const dialog = within(dialogElement);
    await waitFor(
      () =>
        expect(dialog.queryByText("Finding trip...")).not.toBeInTheDocument(),
      { timeout: 3000 }
    );
    await expect(dialog.getByText("Italy")).toBeVisible();
    await expect(
      dialog.getByRole("checkbox", { name: "Would do again" })
    ).toBeChecked();
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(
        overlay.queryByRole("heading", {
          name: "Edit completion for Paragliding"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(within(paraglidingRow()).getByText("Completed")).toBeVisible();

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.completedOn).toBe(todayIso);
    expect(savedItem?.tripId).toBe(1);
    expect(savedItem?.wouldRepeat).toBe(true);
  }
};

export const CanCancelChangingRepeatPreference: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      true
    );
    const overlay = within(canvasElement.ownerDocument.body);

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Change completion details for Paragliding"
      })
    );
    const dialog = within(
      await findDialog(canvasElement, "Edit completion for Paragliding")
    );
    const repeatCheckbox = dialog.getByRole("checkbox", {
      name: "Would do again"
    });
    await expect(repeatCheckbox).toBeChecked();
    await user.click(repeatCheckbox);
    await user.click(dialog.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        overlay.queryByRole("heading", {
          name: "Edit completion for Paragliding"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(
      within(paraglidingRow()).getByText("Would do again")
    ).toBeVisible();
  }
};

export const CanChangeRepeatPreferenceToNo: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow } = await completeParaglidingToday(
      canvasElement,
      true
    );
    const overlay = within(canvasElement.ownerDocument.body);

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Change completion details for Paragliding"
      })
    );
    const dialog = within(
      await findDialog(canvasElement, "Edit completion for Paragliding")
    );
    const repeatCheckbox = dialog.getByRole("checkbox", {
      name: "Would do again"
    });
    await expect(repeatCheckbox).toBeChecked();
    await user.click(repeatCheckbox);
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "Save" })).toBeEnabled()
    );
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(
        overlay.queryByRole("heading", {
          name: "Edit completion for Paragliding"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(
      within(paraglidingRow()).getByText("Would not do again")
    ).toBeVisible();
  }
};

export const CanChangeRepeatPreferenceToYes: Story = {
  play: async ({ canvasElement }) => {
    const { user, paraglidingRow } =
      await completeParaglidingToday(canvasElement);
    const overlay = within(canvasElement.ownerDocument.body);

    await user.click(
      within(paraglidingRow()).getByRole("button", {
        name: "Change completion details for Paragliding"
      })
    );
    const dialog = within(
      await findDialog(canvasElement, "Edit completion for Paragliding")
    );
    const repeatCheckbox = dialog.getByRole("checkbox", {
      name: "Would do again"
    });
    await expect(repeatCheckbox).not.toBeChecked();
    await user.click(repeatCheckbox);
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "Save" })).toBeEnabled()
    );
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(
        overlay.queryByRole("heading", {
          name: "Edit completion for Paragliding"
        })
      ).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(
      within(paraglidingRow()).getByText("Would do again")
    ).toBeVisible();
  }
};

export const CanEditItemName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    const row = canvas.getByText("Paragliding").closest("tr");
    if (!row) throw new Error("Paragliding row was not found");

    await user.click(
      within(row).getByRole("button", {
        name: "Change bucket list item name from Paragliding"
      })
    );
    const nameDialog = within(
      await findDialog(canvasElement, "Modifying Paragliding")
    );
    const nameInput = nameDialog.getByRole("textbox", { name: "Name" });
    await user.clear(nameInput);
    await user.type(nameInput, "Hang gliding");
    await user.click(nameDialog.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(canvas.getByText("Hang gliding")).toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.name).toBe("Hang gliding");
  }
};

export const KeepsNewFilterMembershipAfterAnOlderEditRefresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");
    await user.click(
      canvas.getByRole("button", {
        name: "Change bucket list item name from Paragliding"
      })
    );
    const dialog = within(
      await findDialog(canvasElement, "Modifying Paragliding")
    );
    await user.clear(dialog.getByRole("textbox", { name: "Name" }));
    await user.type(
      dialog.getByRole("textbox", { name: "Name" }),
      "Hang gliding"
    );

    const editRefresh = holdBucketListRead();
    await user.click(dialog.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(editRefresh.requests[0]?.queryParams).toEqual({ status: "ALL" })
    );
    await user.click(
      dialog.getByRole("button", { name: "Close modify popup" })
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    const filterRefresh = holdBucketListRead();
    await user.click(canvas.getByRole("tab", { name: /Completed/ }));
    await filterRefresh.respond([
      {
        id: 2,
        name: "Zorbing",
        completedOn: "2026-06-14",
        changedOn: "2026-06-14T18:30:00.0000000"
      }
    ]);
    await canvas.findByText("Zorbing");
    await editRefresh.respond([
      {
        id: 1,
        name: "Hang gliding",
        completedOn: null,
        changedOn: "2026-09-29T10:00:00.000001"
      },
      {
        id: 2,
        name: "Zorbing",
        completedOn: "2026-06-14",
        changedOn: "2026-06-14T18:30:00.0000000"
      }
    ]);

    await expect(canvas.queryByText("Hang gliding")).not.toBeInTheDocument();
    await expect(canvas.queryByText("Paragliding")).not.toBeInTheDocument();
    await expect(canvas.getAllByText("Zorbing")).toHaveLength(1);
    await expect(canvas.getAllByRole("row")).toHaveLength(2);
    await expect(
      canvas.getByRole("tab", { name: "Completed (1)" })
    ).toHaveAttribute("aria-selected", "true");
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();

    const terminal = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() =>
      expect(terminal.requests[0]?.queryParams).toEqual({
        status: "COMPLETED",
        itemId: "2",
        updatedOn: "2026-06-14T18:30:00.0000000"
      })
    );
    await terminal.respond([]);
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  }
};

export const KeepsEditedValuesAfterAnOlderFullRefresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");
    await canvas.findByText("Zorbing");

    const olderRefresh = holdBucketListRead();
    await user.click(
      canvas.getByRole("button", { name: "Move back to bucket list" })
    );
    await waitFor(() =>
      expect(olderRefresh.requests[0]?.queryParams).toEqual({ status: "ALL" })
    );
    await expect(canvas.getByText("Loading bucket list")).toBeVisible();
    await user.click(
      canvas.getByRole("button", {
        name: "Change bucket list item name from Paragliding"
      })
    );
    const dialog = within(
      await findDialog(canvasElement, "Modifying Paragliding")
    );
    await user.clear(dialog.getByRole("textbox", { name: "Name" }));
    await user.type(
      dialog.getByRole("textbox", { name: "Name" }),
      "Hang gliding"
    );

    const editRefresh = holdBucketListRead();
    await user.click(dialog.getByRole("button", { name: "Update" }));
    await editRefresh.respond([
      {
        id: 1,
        name: "Hang gliding",
        completedOn: null,
        changedOn: "2026-09-29T10:01:00.000001"
      },
      {
        id: 2,
        name: "Zorbing",
        completedOn: null,
        changedOn: "2026-09-29T10:00:00.000001"
      }
    ]);
    await waitForCanvasToBecomeAccessible(canvasElement);
    await canvas.findByText("Hang gliding");
    await olderRefresh.respond([
      {
        id: 2,
        name: "Zorbing",
        completedOn: null,
        changedOn: "2026-09-29T10:00:00.000001"
      },
      {
        id: 1,
        name: "Paragliding",
        completedOn: null,
        changedOn: "2026-08-20T10:00:00.0000000"
      }
    ]);

    await expect(canvas.getAllByText("Hang gliding")).toHaveLength(1);
    await expect(canvas.queryByText("Paragliding")).not.toBeInTheDocument();
    await expect(canvas.getAllByText("Not completed")).toHaveLength(2);
    await expect(canvas.getByRole("tab", { name: "To do (2)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (0)" })
    ).toBeVisible();
    await expect(
      canvas.queryByText("Loading bucket list")
    ).not.toBeInTheDocument();

    const terminal = holdBucketListRead();
    await user.click(canvas.getByRole("button", { name: "Load more" }));
    await waitFor(() =>
      expect(terminal.requests[0]?.queryParams).toEqual({
        status: "ALL",
        itemId: "2",
        updatedOn: "2026-09-29T10:00:00.000001"
      })
    );
    await terminal.respond([]);
    await expect(canvas.getAllByRole("row")).toHaveLength(3);
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  }
};

export const CanEditItemLocation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    const itemName = await canvas.findByText("Paragliding");
    const row = itemName.closest("tr");
    if (!row) throw new Error("Paragliding row was not found");

    await user.click(
      within(row).getByRole("button", {
        name: "Change bucket list item location from Dzūkija"
      })
    );
    const locationDialog = within(
      await findDialog(canvasElement, "Modifying Dzūkija")
    );
    await user.click(locationDialog.getByRole("radio", { name: "Anywhere" }));
    await user.click(locationDialog.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(within(row).getByText("Anywhere")).toBeVisible()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    const locationCell = within(row).getAllByRole("cell")[1];
    await expect(within(locationCell).getByText("Anywhere")).toBeVisible();
    await expect(
      within(locationCell).queryByText(/^(City|Region)$/)
    ).not.toBeInTheDocument();

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.cityId).toBeNull();
    expect(savedItem?.regionId).toBeNull();
  }
};

export const CanEditItemDescription: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    const itemName = await canvas.findByText("Paragliding");
    const row = itemName.closest("tr");
    if (!row) throw new Error("Paragliding row was not found");

    await user.click(
      within(row).getByRole("button", {
        name: "Change description for Paragliding"
      })
    );
    const descriptionDialog = within(
      await findDialog(canvasElement, "Modifying Paragliding description")
    );
    const descriptionInput = descriptionDialog.getByRole("textbox", {
      name: "Description"
    });
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Best at sunset.");
    await user.click(descriptionDialog.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(canvas.getByText("Best at sunset.")).toBeVisible()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);

    const savedItem = server?.db.bucketListItems.findBy(
      (item: BucketListItem) => Number(item.id) === 1
    );
    expect(savedItem?.description).toBe("Best at sunset.");
  }
};

export const CanSortByExperienceAndStatus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    const nameHeader = canvas.getByRole("columnheader", {
      name: "Name"
    });
    const statusHeader = canvas.getByRole("columnheader", { name: "Status" });
    const firstDataRow = (): HTMLElement => canvas.getAllByRole("row")[1];

    await user.click(canvas.getByRole("button", { name: "Name" }));
    await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    await expect(firstDataRow()).toHaveTextContent("Paragliding");

    await user.click(canvas.getByRole("button", { name: "Name" }));
    await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
    await expect(firstDataRow()).toHaveTextContent("Zorbing");

    await user.click(canvas.getByRole("button", { name: "Status" }));
    await expect(statusHeader).toHaveAttribute("aria-sort", "ascending");
    await expect(firstDataRow()).toHaveTextContent("Completed");

    await user.click(canvas.getByRole("button", { name: "Status" }));
    await expect(statusHeader).toHaveAttribute("aria-sort", "descending");
    await expect(firstDataRow()).toHaveTextContent("To do");
  }
};

export const CanCreateItem: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    await user.click(canvas.getByRole("button", { name: "Add item" }));
    const dialog = within(canvasElement.ownerDocument.body);
    await user.type(dialog.getByRole("textbox", { name: "Name" }), "Skydiving");
    await user.click(dialog.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(canvas.getByText("Skydiving")).toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(canvas.getByRole("tab", { name: "All (3)" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "To do (2)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (1)" })
    ).toBeVisible();
  }
};

export const CanDeleteItemAndReconcileGlobalCounts: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overlay = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    await canvas.findByText("Paragliding");

    await user.click(
      canvas.getByRole("button", { name: "Delete Paragliding" })
    );
    await overlay.findByText("Are you sure you want to delete Paragliding?");
    await user.click(overlay.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(canvas.queryByText("Paragliding")).not.toBeInTheDocument()
    );
    await waitForCanvasToBecomeAccessible(canvasElement);
    await expect(canvas.getByRole("tab", { name: "All (1)" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "To do (0)" })).toBeVisible();
    await expect(
      canvas.getByRole("tab", { name: "Completed (1)" })
    ).toBeVisible();
    expect(
      server?.db.bucketListItems.findBy(
        (item: BucketListItem) => Number(item.id) === 1
      )
    ).toBeNull();
  }
};
