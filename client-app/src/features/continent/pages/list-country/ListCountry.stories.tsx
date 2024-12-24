import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import makeServer from "../../../../ServerSetup";
import CountryList from "./ListCountry";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof CountryList> = {
  component: CountryList,
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

type Story = StoryObj<typeof CountryList>;

export const Primary: Story = {};
