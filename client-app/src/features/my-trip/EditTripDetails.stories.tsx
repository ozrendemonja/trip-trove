import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Meta, StoryObj } from "@storybook/react";
import makeServer from "../../ServerSetup";
import EditTripDetails from "./EditTripDetails";
import { Trip } from "./domain/Trip.types";
import { ComponentProps, useState } from "react";

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
