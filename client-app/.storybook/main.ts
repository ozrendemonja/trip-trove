import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-webpack5-compiler-babel",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    'storybook-addon-mock',
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      fsCache: true,
      lazyCompilation: true
    },
  },
};
export default config;
