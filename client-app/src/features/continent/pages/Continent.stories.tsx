import { Meta, StoryObj } from "@storybook/react";
import { GetContinentResponse } from "../../../clients/manager";
import ContinentList from "./Continent";

const styleOverrides = `
    body {
      background: #C3E0E7;
    }`;

const meta: Meta<typeof ContinentList> = {
  component: ContinentList,
  decorators: [
    (Story) => (
      <>
        <Story />
        <style>{styleOverrides}</style>
      </>
    ),
  ],
  parameters: {
    mockData: [
      {
        url: 'http://localhost:8080/continents',
        method: 'GET',
        status: 200,
        response: [
          { continentName: "Australia" }, { continentName: "Europe" }, { continentName: "Asia" }
        ] as GetContinentResponse[],
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof ContinentList>;

export const Primary: Story = {};