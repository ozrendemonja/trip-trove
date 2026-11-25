import type { Meta, StoryObj } from "@storybook/react";
import { Response as MirageResponse } from "miragejs";
import { expect, waitFor, within } from "storybook/test";
import makeServer from "../../../ServerSetup";
import Board from "./Board";
import {
  findAttractionCard,
  makeAttraction,
  reviewBoard,
  setupUser,
  styleDecorator
} from "./Board.helpers";

type Server = ReturnType<typeof makeServer>;
let server: Server;
const requests: unknown[] = [];

const meta: Meta<typeof Board> = {
  title: "features/AI-table/components/Board/Planning",
  component: Board,
  args: {
    mode: "edit",
    tripId: 1,
    initialSavedAttractionIds: [1, 2],
    initialCities: reviewBoard([
      makeAttraction(1, "Casino Square"),
      makeAttraction(2, "Oceanographic Museum")
    ])
  },
  decorators: [
    (Story, context) => {
      server?.shutdown();
      server = makeServer();
      requests.length = 0;
      const configure: ((server: Server) => void) | undefined =
        context.parameters.configurePlanningServer;
      configure?.(server);
      return <Story />;
    },
    styleDecorator
  ]
};
export default meta;

type Story = StoryObj<typeof Board>;

export const ConfirmsOneSaveBeforeAllowingTheNext: Story = {
  parameters: {
    configurePlanningServer: (server: Server) => {
      server.put(
        "http://localhost:8080/trips/1/attractions/1/note",
        (_schema, request) => {
          requests.push(JSON.parse(request.requestBody));
          return new MirageResponse(204);
        },
        { timing: 800 }
      );
      server.put(
        "http://localhost:8080/trips/1/attractions/2/must-visit",
        (_schema, request) => {
          requests.push(JSON.parse(request.requestBody));
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const first = within(findAttractionCard(canvasElement, "Casino Square"));
    const second = within(
      findAttractionCard(canvasElement, "Oceanographic Museum")
    );

    await user.click(first.getByRole("button", { name: "+ Add note" }));
    await user.type(first.getByRole("textbox"), "Arrive before lunch");
    await user.click(first.getByRole("button", { name: "Save" }));

    const feedback = within(
      await first.findByRole("status", {
        name: "Marked change for Casino Square"
      })
    );
    await expect(feedback.getByText("Saving")).toBeVisible();
    await expect(feedback.queryByText("Saved")).not.toBeInTheDocument();
    await expect(second.getByTitle("Mark must visit")).toBeDisabled();
    await user.click(canvas.getByRole("button", { name: "Filters on demand" }));
    await expect(canvas.getByLabelText("Category")).toBeVisible();

    await waitFor(() => expect(feedback.getByText("Saved")).toBeVisible());
    await user.click(second.getByTitle("Mark must visit"));
    await waitFor(() =>
      expect(second.getByRole("status")).toHaveTextContent("Saved")
    );
    await expect(requests).toEqual([
      { note: "Arrive before lunch" },
      { mustVisit: true }
    ]);
  }
};

export const KeepsRejectedTextAvailableForCorrection: Story = {
  parameters: {
    configurePlanningServer: (server: Server) => {
      const outcomes = [
        new MirageResponse(
          400,
          {},
          { errorCode: "BAD_REQUEST", errorMessage: "The note is too long." }
        ),
        new MirageResponse(204)
      ];
      server.put(
        "http://localhost:8080/trips/1/attractions/1/note",
        (_schema, request) => {
          requests.push(JSON.parse(request.requestBody));
          return outcomes.shift() ?? new MirageResponse(500);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const user = setupUser();
    const first = within(findAttractionCard(canvasElement, "Casino Square"));
    const second = within(
      findAttractionCard(canvasElement, "Oceanographic Museum")
    );
    const invalidNote = "x".repeat(513);

    await user.click(first.getByRole("button", { name: "+ Add note" }));
    await user.type(first.getByRole("textbox"), invalidNote);
    await user.click(first.getByRole("button", { name: "Save" }));
    await first.findByText("The note is too long.");
    await expect(second.getByTitle("Mark must visit")).toBeDisabled();

    await user.click(first.getByRole("button", { name: "+ Add note" }));
    await expect(first.getByRole("textbox")).toHaveValue(invalidNote);
    await user.clear(first.getByRole("textbox"));
    await user.type(first.getByRole("textbox"), "Corrected trip note");
    await user.click(first.getByRole("button", { name: "Save" }));

    await first.findByText("Saved");
    await expect(first.getByText("Corrected trip note")).toBeVisible();
    await expect(second.getByTitle("Mark must visit")).toBeEnabled();
    await expect(requests).toEqual([
      { note: invalidNote },
      { note: "Corrected trip note" }
    ]);
  }
};

export const ReloadsSavedPlanningAfterAnUnconfirmedSave: Story = {
  parameters: {
    configurePlanningServer: (server: Server) => {
      server.put(
        "http://localhost:8080/trips/1/attractions/1/note",
        (_schema, request) => {
          requests.push(JSON.parse(request.requestBody));
          return new MirageResponse(
            500,
            {},
            { errorMessage: "The save couldn't be confirmed." }
          );
        },
        { timing: 0 }
      );
      server.get(
        "http://localhost:8080/trips/1/attractions",
        () => [
          {
            attractionId: 1,
            attractionName: "Casino Square",
            cityName: "Monaco",
            regionName: "Monaco",
            countryName: "Monaco",
            isCountrywide: false,
            attractionCategory: "POINT_OF_INTEREST_AND_LANDMARK",
            attractionType: "STABLE",
            isTraditional: false,
            mustVisit: false,
            infoFrom: "",
            status: "PLANNED",
            attractionGroup: "PRIMARY",
            note: "Previously saved note"
          }
        ],
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = setupUser();
    const first = within(findAttractionCard(canvasElement, "Casino Square"));
    await user.click(first.getByRole("button", { name: "+ Add note" }));
    await user.type(first.getByRole("textbox"), "Unconfirmed note");
    await user.click(first.getByRole("button", { name: "Save" }));

    await first.findByText("The save couldn't be confirmed.");
    await user.click(
      first.getByRole("button", { name: "Reload saved planning" })
    );
    await canvas.findByText("Previously saved note");
    await expect(
      canvas.queryByText("Unconfirmed note")
    ).not.toBeInTheDocument();
    const reloaded = within(findAttractionCard(canvasElement, "Casino Square"));
    await user.click(reloaded.getByTitle("Edit note"));
    await expect(reloaded.getByRole("textbox")).toHaveValue("Unconfirmed note");
    await user.click(reloaded.getByRole("button", { name: "Cancel" }));
    await user.click(reloaded.getByRole("button", { name: "Discard change" }));
    await expect(
      within(findAttractionCard(canvasElement, "Casino Square")).getByTitle(
        "Mark must visit"
      )
    ).toBeEnabled();
    await expect(requests).toHaveLength(1);
  }
};
