import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Meta, StoryObj } from "@storybook/react";
import { Response as MirageResponse } from "miragejs";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within
} from "storybook/test";
import makeServer from "../../ServerSetup";
import EditTripDetails from "./EditTripDetails";
import { Trip } from "./domain/Trip.types";
import { ComponentProps, useState } from "react";

import { SOLID_STORY_BACKGROUND_STYLES as styleOverrides } from "../../shared/storybook/StoryStyles";

const sampleTrip: Trip = {
  id: 1,
  name: "Italy",
  startDate: "2026-06-10",
  endDate: "2026-06-24",
  status: "active"
};

let server: ReturnType<typeof makeServer>;
const dateRequests: unknown[] = [];
const nameRequests: unknown[] = [];

const meta: Meta<typeof EditTripDetails> = {
  component: EditTripDetails,
  decorators: [
    (Story, context) => {
      server?.shutdown();
      server = makeServer();
      dateRequests.length = 0;
      nameRequests.length = 0;
      const configure:
        ((server: ReturnType<typeof makeServer>) => void) | undefined =
        context.parameters.configurePlanningServer;
      configure?.(server);
      return (
        <>
          <FluentProvider theme={webLightTheme}>
            <Story />
          </FluentProvider>
          <style>{styleOverrides}</style>
        </>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof EditTripDetails>;

const InteractiveEditTripDetails = (
  props: ComponentProps<typeof EditTripDetails>
) => {
  const [isOpen, setIsOpen] = useState(props.isOpen ?? true);
  return (
    <EditTripDetails
      {...props}
      isOpen={isOpen}
      onDismiss={() => {
        setIsOpen(false);
        props.onDismiss?.();
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => <InteractiveEditTripDetails {...args} />,
  args: {
    trip: sampleTrip,
    isOpen: true,
    onDismiss: () => {},
    onUpdateClick: () => {}
  }
};

export const NoDates: Story = {
  args: {
    trip: { id: 5, name: "New Adventure", status: "active" },
    isOpen: true,
    onDismiss: () => {},
    onUpdateClick: () => {}
  }
};

export const LongName: Story = {
  args: {
    trip: {
      id: 4,
      name: "South East Asia — Thailand, Vietnam & Cambodia",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      status: "active"
    },
    isOpen: true,
    onDismiss: () => {},
    onUpdateClick: () => {}
  }
};

export const SavesTripDates: Story = {
  render: (args) => <InteractiveEditTripDetails {...args} />,
  args: {
    trip: sampleTrip,
    isOpen: true,
    onDismiss: fn(),
    onUpdateClick: fn()
  },
  parameters: {
    configurePlanningServer: (server: ReturnType<typeof makeServer>) => {
      server.put(
        "http://localhost:8080/trips/1/range",
        (_schema, request) => {
          dateRequests.push(JSON.parse(request.requestBody));
          return new MirageResponse(204);
        },
        { timing: 0 }
      );
    }
  },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
    const modal = within(await body.findByRole("dialog"));
    fireEvent.change(modal.getByLabelText("Start date"), {
      target: { value: "2099-07-10" }
    });
    fireEvent.change(modal.getByLabelText("End date"), {
      target: { value: "2099-07-20" }
    });
    await user.click(modal.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(body.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await expect(args.onUpdateClick).toHaveBeenCalledTimes(1);
    await expect(dateRequests).toEqual([
      { fromDate: "2099-07-10", toDate: "2099-07-20" }
    ]);
  }
};

export const KeepsDetailsAfterFailedDateSaveWithoutResendingTheSavedName: Story =
  {
    render: (args) => <InteractiveEditTripDetails {...args} />,
    args: {
      trip: sampleTrip,
      isOpen: true,
      onDismiss: fn(),
      onUpdateClick: fn()
    },
    parameters: {
      configurePlanningServer: (server: ReturnType<typeof makeServer>) => {
        server.put(
          "http://localhost:8080/trips/1/name",
          (_schema, request) => {
            nameRequests.push(JSON.parse(request.requestBody));
            return new MirageResponse(204);
          },
          { timing: 0 }
        );
        const outcomes = [
          new MirageResponse(400, {}, { errorCode: "BAD_REQUEST" }),
          new MirageResponse(204)
        ];
        server.put(
          "http://localhost:8080/trips/1/range",
          (_schema, request) => {
            dateRequests.push(JSON.parse(request.requestBody));
            return outcomes.shift() ?? new MirageResponse(500);
          },
          { timing: 0 }
        );
      }
    },
    play: async ({ canvasElement, args }) => {
      const body = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0, delay: null });
      const modal = within(await body.findByRole("dialog"));
      await user.clear(modal.getByLabelText("Trip name"));
      await user.type(modal.getByLabelText("Trip name"), "Italy summer");
      fireEvent.change(modal.getByLabelText("Start date"), {
        target: { value: "2099-07-10" }
      });
      fireEvent.change(modal.getByLabelText("End date"), {
        target: { value: "2099-07-20" }
      });
      await user.click(modal.getByRole("button", { name: "Update" }));

      await modal.findByText(
        "The save couldn't be completed. Your details are still here; review them and try again."
      );
      await expect(modal.getByLabelText("Trip name")).toHaveValue(
        "Italy summer"
      );
      await expect(modal.getByLabelText("Start date")).toHaveValue(
        "2099-07-10"
      );
      await expect(modal.getByLabelText("End date")).toHaveValue("2099-07-20");
      await expect(args.onUpdateClick).not.toHaveBeenCalled();

      fireEvent.change(modal.getByLabelText("End date"), {
        target: { value: "2099-07-21" }
      });
      await user.click(modal.getByRole("button", { name: "Update" }));
      await waitFor(() =>
        expect(body.queryByRole("dialog")).not.toBeInTheDocument()
      );
      await expect(nameRequests).toEqual([{ tripName: "Italy summer" }]);
      await expect(dateRequests).toEqual([
        { fromDate: "2099-07-10", toDate: "2099-07-20" },
        { fromDate: "2099-07-10", toDate: "2099-07-21" }
      ]);
      await expect(args.onUpdateClick).toHaveBeenCalledTimes(1);
    }
  };
