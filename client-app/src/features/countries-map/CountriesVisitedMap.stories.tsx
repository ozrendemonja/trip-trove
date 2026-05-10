import { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import makeServer from "../../ServerSetup";
import CountriesVisitedMap from "./CountriesVisitedMap";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof CountriesVisitedMap> = {
  component: CountriesVisitedMap,
  decorators: [
    (Story) => {
      makeServer();
      return (
        <>
          <MemoryRouter initialEntries={["/countries-map"]}>
            <Story />
          </MemoryRouter>
          <style>{styleOverrides}</style>
        </>
      );
    }
  ]
};

export default meta;

type Story = StoryObj<typeof CountriesVisitedMap>;

export const Primary: Story = {};
