import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import AddContinent from "./AddContinent";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof AddContinent> = {
  component: AddContinent,
  decorators: [
    (Story) => {
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

type Story = StoryObj<typeof AddContinent>;

export const Primary: Story = {};
