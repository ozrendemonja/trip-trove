import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import AttractionListUser from "./ListAttractionUser";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AttractionListUser> = {
  component: AttractionListUser,
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

type Story = StoryObj<typeof AttractionListUser>;

export const Primary: Story = {};
