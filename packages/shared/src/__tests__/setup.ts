// Test setup file
// This file is executed before each test file

// Set test environment
process.env.NODE_ENV = "test";

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
