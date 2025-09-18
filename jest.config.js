export default {
  testEnvironment: "jsdom", // Required for testing React components
  setupFilesAfterEnv: ["<rootDir>/jest.setup.mjs"], // Points to jest.setup.mjs
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.mjs",
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: ["/node_modules/(?!.*)"],
};
