import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import RegionList from "./ListRegion";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof RegionList> = {
  component: RegionList,
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

type Story = StoryObj<typeof RegionList>;

export const Primary: Story = {};
