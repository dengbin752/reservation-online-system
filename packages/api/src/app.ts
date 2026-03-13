import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { typeDefs } from "@shared/reservation-system";
import cors from "cors";
import dotenv from "dotenv";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { graphqlAuthenticate } from "./middleware/index.js";
import { resolvers } from "./resolvers/index.js";
import { logger } from "./logger.js";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Log application startup
logger.info({
	port: PORT,
	env: process.env.NODE_ENV || "development",
	msg: "Starting Hotel Reservation API Server",
});

// Security middleware
if (process.env.NODE_ENV === "development") {
	app.use(
		helmet({
			contentSecurityPolicy: false,
		}),
	);
} else {
	app.use(helmet());
}
app.use(
	cors({
		origin:
			process.env.NODE_ENV === "development"
				? "*"
				: process.env.FRONTEND_URL || "http://localhost:3001",
		credentials: true,
	}),
);

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	message: "Too many requests, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
	try {
		// Check Couchbase connection
		const { createCouchbaseConnection } = await import("@database/reservation-system");
		const connection = createCouchbaseConnection();
		const connected = await connection.healthCheck();

		if (connected) {
			res.status(200).json({
				status: "OK",
				database: "connected",
				timestamp: new Date().toISOString()
			});
		} else {
			res.status(503).json({
				status: "ERROR",
				database: "disconnected",
				timestamp: new Date().toISOString()
			});
		}
	} catch (error) {
		res.status(503).json({
			status: "ERROR",
			database: "error",
			message: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString()
		});
	}
});

// GraphQL setup
const server = new ApolloServer({
	typeDefs,
	resolvers,
	plugins: process.env.NODE_ENV === "development" ? [] : [],
	introspection: true,
});

// Start the server
const startServer = async () => {
	// Initialize database connection on startup
	try {
		const { createCouchbaseConnection } = await import("@database/reservation-system");
		const connection = createCouchbaseConnection();
		await connection.connect();
		console.log("Database connection initialized");
	} catch (error) {
		console.error("Failed to initialize database connection:", error);
	}

	await server.start();

	// Apply the GraphQL middleware with authentication
	const graphqlMiddleware = expressMiddleware(server, {
		context: async ({ req }: { req: Request }) => {
			return { req, user: (req as any).user };
		},
	});

	if (process.env.NODE_ENV === "development") {
		// Development: no authentication required
		app.use("/api/graphql", graphqlMiddleware);
	} else {
		// Production: require authentication
		app.use("/api/graphql", graphqlAuthenticate, graphqlMiddleware);
	}

	const routes = await import("./routes/index.js");
	app.use("/api/auth", routes.authRouter);
	app.use("/api/reservations", routes.reservationsRouter);

	// Error handling middleware
	app.use(
		(err: Error, req: Request, res: Response, next: express.NextFunction) => {
			console.error(err.stack);
			res.status(500).json({ error: "Something went wrong!" });
		},
	);

	// 404 handler - must be after all other routes
	app.use((req: Request, res: Response) => {
		res.status(404).json({ error: "Route not found" });
	});

	app.listen(PORT, () => {
		console.log(`🚀 Server ready at http://localhost:${PORT}`);
		console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/api/graphql`);
	});
};

startServer().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});

export default app;
