import { cors } from "@elysiajs/cors";
import { auth } from "@eventix/auth";
import { env } from "@eventix/env/server";
import { Elysia } from "elysia";

new Elysia()
	.use(
		cors({
			origin: [env.CORS_ORIGIN],
			methods: ["GET", "POST", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			credentials: true,
		}),
	)
	.all("/api/auth/*", async (context) => {
		const { request, status } = context;

		if (["POST", "GET"].includes(request.method)) {
			return auth.handler(request);
		}

		return status(405);
	});
