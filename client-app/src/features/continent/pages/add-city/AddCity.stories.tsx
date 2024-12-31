import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import AddCity from "./AddCity";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddCity> = {
  component: AddCity,
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

type Story = StoryObj<typeof AddCity>;

export const Primary: Story = {};
