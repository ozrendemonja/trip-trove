import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";
import makeServer from "../../ServerSetup";
import { MyTrip } from "./MyTrip";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const TRIP_ID = "1";

const meta: Meta<typeof MyTrip> = {
  component: MyTrip,
  decorators: [
    (Story) => {
      makeServer();
      return (
        <>
          <MemoryRouter initialEntries={[`/my-trips/${TRIP_ID}`]}>
            <Routes>
              <Route path="/my-trips" />
              <Route path="/my-trips/:tripId" element={<Story />} />
            </Routes>
          </MemoryRouter>
          <style>{styleOverrides}</style>
        </>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof MyTrip>;

export const Primary: Story = {};
