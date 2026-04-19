import { Meta, StoryObj } from "@storybook/react";
import CountriesVisitedGauge from "./CountriesVisitedGauge";

const meta: Meta<typeof CountriesVisitedGauge> = {
  component: CountriesVisitedGauge
};

export default meta;

type Story = StoryObj<typeof CountriesVisitedGauge>;

export const Primary: Story = {
  args: {
    visitedCount: 15,
    totalCount: 256
  }
};
