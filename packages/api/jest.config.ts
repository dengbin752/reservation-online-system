import type { Config } from "jest";

const config: Config = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [".ts"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
		"^@database/reservation-system$": "<rootDir>/src/__mocks__/database.ts",
		"^@shared/reservation-system$": "<rootDir>/src/__mocks__/shared.ts",
	},
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
			},
		],
	},
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!src/__mocks__/**",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	testMatch: [
		"**/__tests__/**/*.ts",
		"**/*.test.ts",
		"**/*.spec.ts",
	],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	roots: ["<rootDir>/src"],
	testPathIgnorePatterns: [
		"/node_modules/",
		"/dist/",
	],
	setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
};

export default config;
