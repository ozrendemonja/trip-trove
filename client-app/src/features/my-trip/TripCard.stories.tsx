import { ThemeProvider } from "@fluentui/react";
import { Meta, StoryObj } from "@storybook/react";
import TripCard from "./TripCard";
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

const meta: Meta<typeof TripCard> = {
  component: TripCard,
  decorators: [
    (Story) => (
      <>
        <ThemeProvider>
          <Story />
        </ThemeProvider>
        <style>{styleOverrides}</style>
      </>
    )
  ]
};

export default meta;

type Story = StoryObj<typeof TripCard>;

export const Active: Story = {
  args: {
    trip: sampleTrip,
    onClick: () => {},
    onDelete: () => {},
    onEdit: () => {}
  }
};

export const Past: Story = {
  args: {
    trip: {
      id: 2,
      name: "Japan 2025",
      startDate: "2025-09-01",
      endDate: "2025-09-15",
      status: "past"
    },
    onClick: () => {},
    onDelete: () => {},
    onEdit: () => {}
  }
};

export const Archived: Story = {
  args: {
    trip: {
      id: 3,
      name: "Old Road Trip",
      startDate: "2024-08-20",
      endDate: "2024-09-05",
      status: "archived"
    },
    onClick: () => {},
    onDelete: () => {},
    onEdit: () => {}
  }
};

export const NoDates: Story = {
  args: {
    trip: { id: 5, name: "New Adventure", status: "active" },
    onClick: () => {},
    onDelete: () => {},
    onEdit: () => {}
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
    onClick: () => {},
    onDelete: () => {},
    onEdit: () => {}
  }
};

export const ClickDelete: Story = {
  args: {
    trip: sampleTrip,
    onClick: fn(),
    onDelete: fn(),
    onEdit: fn()
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const deleteBtn = canvas.getByRole("button", { name: /Delete trip/i });
    await userEvent.click(deleteBtn);
    await expect(args.onDelete).toHaveBeenCalledTimes(1);
    await expect(args.onClick).not.toHaveBeenCalled();
  }
};
