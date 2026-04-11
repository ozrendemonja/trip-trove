import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";
import makeServer from "../../ServerSetup";
import MyTripList from "./MyTripList";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof MyTripList> = {
  component: MyTripList,
  decorators: [
    (Story) => (
      <>
        <MemoryRouter initialEntries={["/my-trips"]}>
          <Routes>
            <Route path="/my-trips" element={<Story />} />
            <Route path="/my-trips/:tripId" element={<div style={{ padding: 40 }}>Trip Planner (navigated)</div>} />
          </Routes>
        </MemoryRouter>
        <style>{styleOverrides}</style>
      </>
    )
  ]
};

export default meta;

type Story = StoryObj<typeof MyTripList>;

export const Empty: Story = {
  decorators: [
    (Story) => {
      makeServer();
      return <Story />;
    }
  ]
};

export const WithTrips: Story = {
  decorators: [
    (Story) => {
      makeServer();
      return <Story />;
    }
  ]
};
