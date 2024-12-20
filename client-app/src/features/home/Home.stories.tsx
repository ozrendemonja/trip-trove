import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import Home from "./Home";
import makeServer from "../../Server";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof Home> = {
  component: Home,
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

type Story = StoryObj<typeof Home>;

export const Primary: Story = {};
