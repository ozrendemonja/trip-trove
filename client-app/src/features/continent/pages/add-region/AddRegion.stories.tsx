import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import AddRegion from "./AddRegion";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddRegion> = {
  component: AddRegion,
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

type Story = StoryObj<typeof AddRegion>;

export const Primary: Story = {};
