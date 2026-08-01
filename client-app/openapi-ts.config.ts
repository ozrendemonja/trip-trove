import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi-doc/api-docs.json",
  interactive: false,
  output: {
    path: "src/clients/manager",
    postProcess: ["prettier"]
  },
  plugins: [
    "@hey-api/typescript",
    {
      name: "@hey-api/client-fetch",
      includeInEntry: true
    },
    "@hey-api/sdk"
  ]
});
