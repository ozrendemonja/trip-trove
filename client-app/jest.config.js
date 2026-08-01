module.exports = {
  clearMocks: true,
  testEnvironment: "node",
  maxConcurrency: 6,
  testMatch: ["**/__tests__/**/*.[jt]s?(x)"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true
          },
          transform: {
            react: {
              runtime: "automatic"
            }
          }
        },
        module: {
          type: "commonjs"
        }
      }
    ]
  }
};
