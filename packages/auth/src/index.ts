import { expo } from "@better-auth/expo";
import { db } from "@eventix/db";
import * as schema from "@eventix/db/schema/index";
import { env } from "@eventix/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
		usePlural: true,
		camelCase: true,
	}),
	trustedOrigins: [
		env.CORS_ORIGIN,
		"eventix://",
		...(env.NODE_ENV === "development"
			? [
					"exp://",
					"exp://**",
					"exp://192.168.*.*:*/**",
					"http://localhost:8081",
				]
			: []),
	],
	emailAndPassword: {
		enabled: true,
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
		database: {
			generateId: false,
		},
	},
	plugins: [expo()],
});
