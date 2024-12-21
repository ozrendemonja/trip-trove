import { Meta, StoryObj } from "@storybook/react";
import AddCountry from "./AddCountry";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddCountry> = {
  component: AddCountry,
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

type Story = StoryObj<typeof AddCountry>;

export const Primary: Story = {};
