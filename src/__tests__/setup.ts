import dotenv from "dotenv";
import path from "path";

// load test environment variables
dotenv.config({ path: path.resolve(__dirname, "../..//env.test") });

// increase timeout for database operations
jest.setTimeout(30000);

// cleanup after all tests

afterAll(async () => {
  // close database connections
  await new Promise((resolve) => setTimeout(resolve, 500));
});
