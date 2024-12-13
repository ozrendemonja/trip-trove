import { Meta, StoryObj } from "@storybook/react";
import makeServer from "../../../server";
import ContinentList from "./Continent";

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
          <Story />
          <style>{styleOverrides}</style>
        </>
      )
    },
  ],
};

export default meta;

type Story = StoryObj<typeof ContinentList>;

export const Primary: Story = {};