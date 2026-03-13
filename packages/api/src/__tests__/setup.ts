// Test setup file for API package
// This file is executed before each test file

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
	console.error = jest.fn((message: string, ...args: any[]) => {
		// Ignore specific warnings that are expected in tests
		if (
			typeof message === "string" &&
			(message.includes("Warning:") || message.includes("React"))
		) {
			return;
		}
		originalConsoleError(message, ...args);
	});
});

afterAll(() => {
	console.error = originalConsoleError;
});

// Increase timeout for async tests
jest.setTimeout(10000);

// Clear mock users before each test
beforeEach(() => {
	// Clear the mockUsers Map
	const { mockUsers } = require("../__mocks__/database");
	mockUsers.clear();
});
