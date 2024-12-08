import { Meta, StoryObj } from "@storybook/react"
import { ComponentProps } from "react";
import ContinentList from "./Continent";

type StoryProps = ComponentProps<typeof ContinentList>
const meta: Meta<StoryProps> = {
    component: ContinentList
} satisfies Meta<typeof ContinentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};