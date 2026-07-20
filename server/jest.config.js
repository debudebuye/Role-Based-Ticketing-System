/**
 * Jest configuration for the server.
 *
 * Uses --experimental-vm-modules so Jest can handle ES Modules (the server
 * uses "type": "module" throughout).  Run tests with:
 *
 *   npm test              — single run
 *   npm run test:watch    — watch mode
 *   npm run test:coverage — coverage report
 */
export default {
  testEnvironment: 'node',

  // Transform nothing — Node handles ESM natively via --experimental-vm-modules
  transform: {},

  // Where to find tests
  testMatch: ['**/__tests__/**/*.test.js'],

  // Runs once in the main process — warms the mongodb-memory-server binary cache
  globalSetup: './__tests__/setup/globalSetup.js',

  // Runs inside every worker process before tests — sets env vars
  setupFiles: ['./__tests__/setup/setEnvVars.js'],

  // Coverage
  collectCoverageFrom: [
    'features/**/*.js',
    'shared/**/*.js',
    '!shared/config/swagger.js',
    '!**/*.validation.js',
  ],

  // Increase timeout for DB operations
  testTimeout: 30000,
};
