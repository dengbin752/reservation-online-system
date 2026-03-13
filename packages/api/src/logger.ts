/**
 * Logger Module
 * Simple console-based logging for the application
 */

// Log levels
type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVELS: Record<LogLevel, number> = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
	fatal: 5,
};

// Get current log level from environment
const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 
	(process.env.NODE_ENV === "production" ? "info" : "debug");

const currentLevelValue = LOG_LEVELS[currentLevel] ?? LOG_LEVELS.info;

// Format timestamp
const formatTimestamp = () => new Date().toISOString();

// Create log function
const createLogFn = (level: LogLevel) => {
	const levelValue = LOG_LEVELS[level];
	
	return (obj: any = {}, msg?: string) => {
		if (levelValue < currentLevelValue) return;
		
		const logData = {
			timestamp: formatTimestamp(),
			level: level.toUpperCase(),
			...obj,
		};
		
		const message = msg || obj.msg || "";
		const output = process.env.NODE_ENV === "production"
			? JSON.stringify({ ...logData, msg: message })
			: `${logData.timestamp} [${logData.level}]: ${message}`;
		
		if (levelValue >= LOG_LEVELS.error) {
			console.error(output);
		} else if (levelValue >= LOG_LEVELS.warn) {
			console.warn(output);
		} else {
			console.log(output);
		}
	};
};

// Logger instance
export const logger = {
	trace: createLogFn("trace"),
	debug: createLogFn("debug"),
	info: createLogFn("info"),
	warn: createLogFn("warn"),
	error: createLogFn("error"),
	fatal: createLogFn("fatal"),
};

// Create child logger for specific modules
export const createModuleLogger = (moduleName: string) => {
	return {
		trace: (obj: any = {}, msg?: string) => logger.trace({ ...obj, module: moduleName }, msg),
		debug: (obj: any = {}, msg?: string) => logger.debug({ ...obj, module: moduleName }, msg),
		info: (obj: any = {}, msg?: string) => logger.info({ ...obj, module: moduleName }, msg),
		warn: (obj: any = {}, msg?: string) => logger.warn({ ...obj, module: moduleName }, msg),
		error: (obj: any = {}, msg?: string) => logger.error({ ...obj, module: moduleName }, msg),
		fatal: (obj: any = {}, msg?: string) => logger.fatal({ ...obj, module: moduleName }, msg),
	};
};

// Specialized loggers
export const authLogger = createModuleLogger("auth");
export const reservationLogger = createModuleLogger("reservation");
export const databaseLogger = createModuleLogger("database");
export const graphqlLogger = createModuleLogger("graphql");
export const middlewareLogger = createModuleLogger("middleware");

// Request logging helper
export const logRequest = (req: any, res: any, duration: number) => {
	const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
	logger[level]({
		req: {
			method: req.method,
			url: req.url,
		},
		res: {
			statusCode: res.statusCode,
		},
		responseTime: `${duration}ms`,
	}, `${req.method} ${req.url} - ${res.statusCode}`);
};

export default logger;
