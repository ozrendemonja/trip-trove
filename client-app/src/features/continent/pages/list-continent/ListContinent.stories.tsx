import { Meta, StoryObj } from "@storybook/react";
import makeServer from "../../../../ServerSetup";
import ContinentList from "./ListContinent";
import { MemoryRouter } from "react-router";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof ContinentList> = {
  component: ContinentList,
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

type Story = StoryObj<typeof ContinentList>;

export const Primary: Story = {};
