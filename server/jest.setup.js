// jest.setup.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.test for the Jest testing environment
// Adjust the path if your .env.test file is located elsewhere relative to the project root.
// Assuming jest is run from the 'server' directory where package.json is.
const result = dotenv.config({ path: path.resolve(__dirname, '.env.test') });

if (result.error) {
  console.warn(`Jest setup: Could not load .env.test file. Error: ${result.error.message}`);
  // Optionally, load from .env.example or .env as a fallback if appropriate for your strategy
  // const fallbackResult = dotenv.config({ path: path.resolve(__dirname, '.env.example') });
  // if (fallbackResult.error) {
  //   console.warn(`Jest setup: Could not load .env.example either. Error: ${fallbackResult.error.message}`);
  // } else {
  //   console.log('Jest setup: Loaded environment variables from .env.example as fallback.');
  // }
} else {
  console.log('Jest setup: Loaded environment variables from .env.test');
}

// You can add any other global setup for your tests here, for example:
// - Mocking global objects
// - Setting up a test database connection (if not using in-memory)

// Example: Ensure JWT_SECRET is loaded, otherwise tests relying on it will fail clearly.
if (!process.env.JWT_SECRET) {
  console.error('FATAL JEST SETUP ERROR: JWT_SECRET is not defined even after attempting to load .env.test.');
  // process.exit(1); // Optionally, exit if critical env vars are missing
}

// console.log('Jest setup complete. Current NODE_ENV:', process.env.NODE_ENV);
// console.log('Jest setup JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
