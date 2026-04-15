import { ThemeProvider } from "@fluentui/react";
import { Meta, StoryObj } from "@storybook/react";
import makeServer from "../../ServerSetup";
import EditTripDetails from "./EditTripDetails";
import { Trip } from "./domain/Trip.types";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const sampleTrip: Trip = {
  id: 1,
  name: "Italy",
  startDate: "2026-06-10",
  endDate: "2026-06-24",
  status: "active"
};

const meta: Meta<typeof EditTripDetails> = {
  component: EditTripDetails,
  decorators: [
    (Story) => {
      makeServer();
      return (
        <>
          <ThemeProvider>
            <Story />
          </ThemeProvider>
          <style>{styleOverrides}</style>
        </>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof EditTripDetails>;

export const Default: Story = {
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
