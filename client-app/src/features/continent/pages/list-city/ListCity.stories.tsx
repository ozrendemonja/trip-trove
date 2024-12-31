import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import CityList from "./ListCity";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof CityList> = {
  component: CityList,
  decorators: [
    (Story) => {
      makeServer();
      return (
        <>
          <MemoryRouter initialEntries={["/"]}>
            <Story />
          </MemoryRouter>
          <style>{styleOverrides}</style>
        </>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof CityList>;

export const Primary: Story = {};
