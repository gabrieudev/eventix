import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core/columns";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		activeOrganizationId: uuid("active_organization_id").references(
			() => organizations.id,
			{ onDelete: "set null" },
		),
		activeTeamId: uuid("active_team_id").references(() => teams.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		index("session_userId_idx").on(table.userId),
		index("session_activeOrganizationId_idx").on(table.activeOrganizationId),
		index("session_activeTeamId_idx").on(table.activeTeamId),
	],
);

export const accounts = pgTable(
	"accounts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("account_userId_idx").on(table.userId),
		uniqueIndex("account_provider_account_unique").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const verifications = pgTable(
	"verifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organizationInvitationStatusEnum = pgEnum(
	"organization_invitation_status",
	["pending", "accepted", "cancelled", "expired"],
);

export const eventStatusEnum = pgEnum("event_status", [
	"draft",
	"published",
	"paused",
	"sold_out",
	"finished",
	"cancelled",
]);

export const ticketTypeStatusEnum = pgEnum("ticket_type_status", [
	"active",
	"inactive",
	"sold_out",
	"hidden",
]);

export const orderStatusEnum = pgEnum("order_status", [
	"pending_payment",
	"waiting_payment",
	"paid",
	"cancelled",
	"expired",
	"refunded",
	"partial_refunded",
	"failed",
]);

export const paymentProviderEnum = pgEnum("payment_provider", ["mercado_pago"]);

export const paymentStatusEnum = pgEnum("payment_status", [
	"pending",
	"authorized",
	"approved",
	"in_process",
	"rejected",
	"cancelled",
	"refunded",
	"charged_back",
	"error",
]);

export const webhookStatusEnum = pgEnum("webhook_status", [
	"pending",
	"processed",
	"failed",
	"ignored",
]);

export const discountTypeEnum = pgEnum("discount_type", [
	"percentage",
	"fixed",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
	"issued",
	"checked_in",
	"canceled",
	"refunded",
]);

export const refundStatusEnum = pgEnum("refund_status", [
	"pending",
	"approved",
	"rejected",
	"cancelled",
	"refunded",
]);

export const organizations = pgTable(
	"organizations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description"),
		logoUrl: text("logo_url"),
		websiteUrl: text("website_url"),
		contactEmail: text("contact_email"),
		timezone: text("timezone").notNull().default("America/Sao_Paulo"),
		isActive: boolean("is_active").default(true).notNull(),
		settings: jsonb("settings")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdById: uuid("created_by_id")
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("organization_createdById_idx").on(table.createdById),
		index("organization_isActive_idx").on(table.isActive),
	],
);

export const organizationMembers = pgTable(
	"organization_members",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		role: text("role").notNull().default("member"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("organization_member_userId_idx").on(table.userId),
		index("organization_member_organizationId_idx").on(table.organizationId),
		uniqueIndex("organization_member_unique").on(
			table.userId,
			table.organizationId,
		),
	],
);

export const teams = pgTable(
	"teams",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		createdById: uuid("created_by_id")
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("team_organizationId_idx").on(table.organizationId),
		index("team_createdById_idx").on(table.createdById),
		uniqueIndex("team_organization_slug_unique").on(
			table.organizationId,
			table.slug,
		),
	],
);

export const teamMembers = pgTable(
	"team_members",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role").notNull().default("member"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("team_member_teamId_idx").on(table.teamId),
		index("team_member_userId_idx").on(table.userId),
		uniqueIndex("team_member_unique").on(table.teamId, table.userId),
	],
);

export const organizationInvitations = pgTable(
	"organization_invitations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: text("email").notNull(),
		inviterId: uuid("inviter_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		teamId: uuid("team_id").references(() => teams.id, {
			onDelete: "set null",
		}),
		role: text("role").notNull().default("member"),
		status: organizationInvitationStatusEnum("status")
			.notNull()
			.default("pending"),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("organization_invitation_email_idx").on(table.email),
		index("organization_invitation_organizationId_idx").on(
			table.organizationId,
		),
		index("organization_invitation_inviterId_idx").on(table.inviterId),
		index("organization_invitation_teamId_idx").on(table.teamId),
		index("organization_invitation_status_idx").on(table.status),
	],
);

export const venues = pgTable(
	"venues",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		addressLine1: text("address_line_1").notNull(),
		addressLine2: text("address_line_2"),
		neighborhood: text("neighborhood"),
		city: text("city").notNull(),
		state: text("state").notNull(),
		postalCode: text("postal_code"),
		country: text("country").notNull().default("BR"),
		timezone: text("timezone").notNull().default("America/Sao_Paulo"),
		capacity: integer("capacity"),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("venue_organizationId_idx").on(table.organizationId),
		uniqueIndex("venue_organization_slug_unique").on(
			table.organizationId,
			table.slug,
		),
	],
);

export const events = pgTable(
	"events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		venueId: uuid("venue_id").references(() => venues.id, {
			onDelete: "set null",
		}),
		teamId: uuid("team_id").references(() => teams.id, {
			onDelete: "set null",
		}),
		createdById: uuid("created_by_id")
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),
		title: text("title").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		shortDescription: text("short_description"),
		status: eventStatusEnum("status").notNull().default("draft"),
		format: text("format").notNull().default("in_person"),
		timezone: text("timezone").notNull().default("America/Sao_Paulo"),
		startsAt: timestamp("starts_at").notNull(),
		endsAt: timestamp("ends_at"),
		saleStartsAt: timestamp("sale_starts_at"),
		saleEndsAt: timestamp("sale_ends_at"),
		publishedAt: timestamp("published_at"),
		cancelledAt: timestamp("cancelled_at"),
		coverImageUrl: text("cover_image_url"),
		bannerImageUrl: text("banner_image_url"),
		capacity: integer("capacity"),
		settings: jsonb("settings")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("event_organizationId_idx").on(table.organizationId),
		index("event_venueId_idx").on(table.venueId),
		index("event_teamId_idx").on(table.teamId),
		index("event_createdById_idx").on(table.createdById),
		index("event_status_idx").on(table.status),
		index("event_startsAt_idx").on(table.startsAt),
		uniqueIndex("event_organization_slug_unique").on(
			table.organizationId,
			table.slug,
		),
	],
);

export const ticketTypes = pgTable(
	"ticket_types",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.notNull()
			.references(() => events.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		priceCents: integer("price_cents").notNull(),
		currency: text("currency").notNull().default("BRL"),
		quantityTotal: integer("quantity_total"),
		quantitySold: integer("quantity_sold").notNull().default(0),
		maxPerOrder: integer("max_per_order").notNull().default(10),
		salesStartAt: timestamp("sales_start_at"),
		salesEndAt: timestamp("sales_end_at"),
		status: ticketTypeStatusEnum("status").notNull().default("active"),
		sortOrder: integer("sort_order").notNull().default(0),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("ticket_type_eventId_idx").on(table.eventId),
		index("ticket_type_status_idx").on(table.status),
		index("ticket_type_sortOrder_idx").on(table.sortOrder),
		uniqueIndex("ticket_type_event_slug_unique").on(table.eventId, table.slug),
	],
);

export const coupons = pgTable(
	"coupons",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		eventId: uuid("event_id").references(() => events.id, {
			onDelete: "cascade",
		}),
		createdById: uuid("created_by_id")
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),
		code: text("code").notNull(),
		type: discountTypeEnum("type").notNull(),
		amountCents: integer("amount_cents"),
		percentOff: integer("percent_off"),
		minOrderCents: integer("min_order_cents"),
		maxUses: integer("max_uses"),
		maxUsesPerUser: integer("max_uses_per_user"),
		usageCount: integer("usage_count").notNull().default(0),
		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		isActive: boolean("is_active").default(true).notNull(),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("coupon_organizationId_idx").on(table.organizationId),
		index("coupon_eventId_idx").on(table.eventId),
		index("coupon_createdById_idx").on(table.createdById),
		index("coupon_code_idx").on(table.code),
		uniqueIndex("coupon_code_unique").on(table.code),
	],
);

export const orders = pgTable(
	"orders",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		eventId: uuid("event_id")
			.notNull()
			.references(() => events.id, { onDelete: "cascade" }),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		couponId: uuid("coupon_id").references(() => coupons.id, {
			onDelete: "set null",
		}),

		buyerName: text("buyer_name").notNull(),
		buyerEmail: text("buyer_email").notNull(),
		buyerDocument: text("buyer_document"),
		buyerPhone: text("buyer_phone"),

		status: orderStatusEnum("status").notNull().default("pending_payment"),
		currency: text("currency").notNull().default("BRL"),
		subtotalCents: integer("subtotal_cents").notNull().default(0),
		discountCents: integer("discount_cents").notNull().default(0),
		feesCents: integer("fees_cents").notNull().default(0),
		totalCents: integer("total_cents").notNull().default(0),

		externalReference: text("external_reference").notNull(),
		mercadoPagoPreferenceId: text("mercado_pago_preference_id"),
		mercadoPagoMerchantOrderId: text("mercado_pago_merchant_order_id"),
		checkoutUrl: text("checkout_url"),

		purchasedAt: timestamp("purchased_at"),
		expiresAt: timestamp("expires_at"),
		cancelledAt: timestamp("cancelled_at"),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("order_organizationId_idx").on(table.organizationId),
		index("order_eventId_idx").on(table.eventId),
		index("order_userId_idx").on(table.userId),
		index("order_couponId_idx").on(table.couponId),
		index("order_status_idx").on(table.status),
		index("order_externalReference_idx").on(table.externalReference),
		uniqueIndex("order_externalReference_unique").on(table.externalReference),
		uniqueIndex("order_mercadoPagoPreferenceId_unique").on(
			table.mercadoPagoPreferenceId,
		),
	],
);

export const orderItems = pgTable(
	"order_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		ticketTypeId: uuid("ticket_type_id")
			.notNull()
			.references(() => ticketTypes.id, { onDelete: "restrict" }),
		ticketNameSnapshot: text("ticket_name_snapshot").notNull(),
		unitPriceCents: integer("unit_price_cents").notNull(),
		quantity: integer("quantity").notNull(),
		totalCents: integer("total_cents").notNull(),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("order_item_orderId_idx").on(table.orderId),
		index("order_item_ticketTypeId_idx").on(table.ticketTypeId),
	],
);

export const payments = pgTable(
	"payments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		provider: paymentProviderEnum("provider").notNull().default("mercado_pago"),
		providerPaymentId: text("provider_payment_id").notNull(),
		providerPreferenceId: text("provider_preference_id"),
		merchantOrderId: text("merchant_order_id"),
		status: paymentStatusEnum("status").notNull().default("pending"),
		amountCents: integer("amount_cents").notNull(),
		currency: text("currency").notNull().default("BRL"),
		paymentMethodId: text("payment_method_id"),
		paymentTypeId: text("payment_type_id"),
		installments: integer("installments"),
		approvedAt: timestamp("approved_at"),
		receivedAt: timestamp("received_at"),
		rawPayload: jsonb("raw_payload")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("payment_orderId_idx").on(table.orderId),
		index("payment_provider_idx").on(table.provider),
		index("payment_status_idx").on(table.status),
		index("payment_providerPaymentId_idx").on(table.providerPaymentId),
		uniqueIndex("payment_providerPaymentId_unique").on(table.providerPaymentId),
		uniqueIndex("payment_providerPreferenceId_unique").on(
			table.providerPreferenceId,
		),
	],
);

export const refunds = pgTable(
	"refunds",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		paymentId: uuid("payment_id")
			.notNull()
			.references(() => payments.id, { onDelete: "cascade" }),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		providerRefundId: text("provider_refund_id"),
		amountCents: integer("amount_cents").notNull(),
		currency: text("currency").notNull().default("BRL"),
		status: refundStatusEnum("status").notNull().default("pending"),
		reason: text("reason"),
		rawPayload: jsonb("raw_payload")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		processedAt: timestamp("processed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("refund_paymentId_idx").on(table.paymentId),
		index("refund_orderId_idx").on(table.orderId),
		index("refund_status_idx").on(table.status),
		uniqueIndex("refund_providerRefundId_unique").on(table.providerRefundId),
	],
);

export const webhookEvents = pgTable(
	"webhook_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		provider: paymentProviderEnum("provider").notNull().default("mercado_pago"),
		eventType: text("event_type").notNull(),
		providerEventId: text("provider_event_id"),
		action: text("action"),
		resourceId: text("resource_id"),
		orderId: uuid("order_id").references(() => orders.id, {
			onDelete: "set null",
		}),
		paymentId: uuid("payment_id").references(() => payments.id, {
			onDelete: "set null",
		}),
		status: webhookStatusEnum("status").notNull().default("pending"),
		processedAt: timestamp("processed_at"),
		errorMessage: text("error_message"),
		payload: jsonb("payload")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("webhook_provider_idx").on(table.provider),
		index("webhook_eventType_idx").on(table.eventType),
		index("webhook_providerEventId_idx").on(table.providerEventId),
		index("webhook_orderId_idx").on(table.orderId),
		index("webhook_paymentId_idx").on(table.paymentId),
		index("webhook_status_idx").on(table.status),
		uniqueIndex("webhook_providerEventId_unique").on(table.providerEventId),
	],
);

export const tickets = pgTable(
	"tickets",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		orderItemId: uuid("order_item_id")
			.notNull()
			.references(() => orderItems.id, { onDelete: "cascade" }),
		eventId: uuid("event_id")
			.notNull()
			.references(() => events.id, { onDelete: "cascade" }),
		ticketTypeId: uuid("ticket_type_id")
			.notNull()
			.references(() => ticketTypes.id, { onDelete: "restrict" }),
		ownerUserId: uuid("owner_user_id").references(() => users.id, {
			onDelete: "set null",
		}),

		code: text("code").notNull(),
		qrToken: text("qr_token").notNull(),
		serialNumber: integer("serial_number"),
		status: ticketStatusEnum("status").notNull().default("issued"),

		holderName: text("holder_name"),
		holderEmail: text("holder_email"),
		holderDocument: text("holder_document"),

		issuedAt: timestamp("issued_at"),
		checkedInAt: timestamp("checked_in_at"),
		checkedInById: uuid("checked_in_by_id").references(() => users.id, {
			onDelete: "set null",
		}),
		cancelledAt: timestamp("cancelled_at"),

		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("ticket_orderId_idx").on(table.orderId),
		index("ticket_orderItemId_idx").on(table.orderItemId),
		index("ticket_eventId_idx").on(table.eventId),
		index("ticket_ticketTypeId_idx").on(table.ticketTypeId),
		index("ticket_ownerUserId_idx").on(table.ownerUserId),
		index("ticket_status_idx").on(table.status),
		index("ticket_code_idx").on(table.code),
		index("ticket_qrToken_idx").on(table.qrToken),
		uniqueIndex("ticket_code_unique").on(table.code),
		uniqueIndex("ticket_qrToken_unique").on(table.qrToken),
		uniqueIndex("ticket_event_serialNumber_unique").on(
			table.eventId,
			table.serialNumber,
		),
	],
);

export const ticketScans = pgTable(
	"ticket_scans",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		ticketId: uuid("ticket_id")
			.notNull()
			.references(() => tickets.id, { onDelete: "cascade" }),
		scannedById: uuid("scanned_by_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		scannedAt: timestamp("scanned_at").defaultNow().notNull(),
		result: text("result").notNull(),
		note: text("note"),
		deviceId: text("device_id"),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
	},
	(table) => [
		index("ticket_scan_ticketId_idx").on(table.ticketId),
		index("ticket_scan_scannedById_idx").on(table.scannedById),
		index("ticket_scan_scannedAt_idx").on(table.scannedAt),
	],
);

export const auditLogs = pgTable(
	"audit_logs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		actorUserId: uuid("actor_user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		entityType: text("entity_type").notNull(),
		entityId: text("entity_id").notNull(),
		action: text("action").notNull(),
		payload: jsonb("payload")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("audit_log_organizationId_idx").on(table.organizationId),
		index("audit_log_actorUserId_idx").on(table.actorUserId),
		index("audit_log_entity_idx").on(table.entityType, table.entityId),
		index("audit_log_action_idx").on(table.action),
		index("audit_log_createdAt_idx").on(table.createdAt),
	],
);

export const userRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	createdOrganizations: many(organizations),
	organizationMemberships: many(organizationMembers),
	teamMemberships: many(teamMembers),
	invitationsSent: many(organizationInvitations),
	createdTeams: many(teams),
	eventsCreated: many(events),
	venuesCreated: many(venues),
	couponsCreated: many(coupons),
	orders: many(orders),
	ticketsIssued: many(tickets),
	ticketScans: many(ticketScans),
	auditLogs: many(auditLogs),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
	activeOrganization: one(organizations, {
		fields: [sessions.activeOrganizationId],
		references: [organizations.id],
	}),
	activeTeam: one(teams, {
		fields: [sessions.activeTeamId],
		references: [teams.id],
	}),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const verificationRelations = relations(verifications, () => ({}));

export const organizationRelations = relations(
	organizations,
	({ one, many }) => ({
		createdBy: one(users, {
			fields: [organizations.createdById],
			references: [users.id],
		}),
		members: many(organizationMembers),
		invitations: many(organizationInvitations),
		teams: many(teams),
		venues: many(venues),
		events: many(events),
		coupons: many(coupons),
		orders: many(orders),
		auditLogs: many(auditLogs),
	}),
);

export const organizationMemberRelations = relations(
	organizationMembers,
	({ one }) => ({
		user: one(users, {
			fields: [organizationMembers.userId],
			references: [users.id],
		}),
		organization: one(organizations, {
			fields: [organizationMembers.organizationId],
			references: [organizations.id],
		}),
	}),
);

export const teamRelations = relations(teams, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [teams.organizationId],
		references: [organizations.id],
	}),
	createdBy: one(users, {
		fields: [teams.createdById],
		references: [users.id],
	}),
	members: many(teamMembers),
	invitations: many(organizationInvitations),
	events: many(events),
}));

export const teamMemberRelations = relations(teamMembers, ({ one }) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
	}),
}));

export const organizationInvitationRelations = relations(
	organizationInvitations,
	({ one }) => ({
		inviter: one(users, {
			fields: [organizationInvitations.inviterId],
			references: [users.id],
		}),
		organization: one(organizations, {
			fields: [organizationInvitations.organizationId],
			references: [organizations.id],
		}),
		team: one(teams, {
			fields: [organizationInvitations.teamId],
			references: [teams.id],
		}),
	}),
);

export const venueRelations = relations(venues, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [venues.organizationId],
		references: [organizations.id],
	}),
	events: many(events),
}));

export const eventRelations = relations(events, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [events.organizationId],
		references: [organizations.id],
	}),
	venue: one(venues, {
		fields: [events.venueId],
		references: [venues.id],
	}),
	team: one(teams, {
		fields: [events.teamId],
		references: [teams.id],
	}),
	createdBy: one(users, {
		fields: [events.createdById],
		references: [users.id],
	}),
	ticketTypes: many(ticketTypes),
	coupons: many(coupons),
	orders: many(orders),
	tickets: many(tickets),
}));

export const ticketTypeRelations = relations(ticketTypes, ({ one, many }) => ({
	event: one(events, {
		fields: [ticketTypes.eventId],
		references: [events.id],
	}),
	orderItems: many(orderItems),
	tickets: many(tickets),
}));

export const couponRelations = relations(coupons, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [coupons.organizationId],
		references: [organizations.id],
	}),
	event: one(events, {
		fields: [coupons.eventId],
		references: [events.id],
	}),
	createdBy: one(users, {
		fields: [coupons.createdById],
		references: [users.id],
	}),
	orders: many(orders),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [orders.organizationId],
		references: [organizations.id],
	}),
	event: one(events, {
		fields: [orders.eventId],
		references: [events.id],
	}),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id],
	}),
	coupon: one(coupons, {
		fields: [orders.couponId],
		references: [coupons.id],
	}),
	items: many(orderItems),
	payments: many(payments),
	tickets: many(tickets),
	refunds: many(refunds),
	webhookEvents: many(webhookEvents),
}));

export const orderItemRelations = relations(orderItems, ({ one, many }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	ticketType: one(ticketTypes, {
		fields: [orderItems.ticketTypeId],
		references: [ticketTypes.id],
	}),
	tickets: many(tickets),
}));

export const paymentRelations = relations(payments, ({ one, many }) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id],
	}),
	refunds: many(refunds),
	webhookEvents: many(webhookEvents),
}));

export const refundRelations = relations(refunds, ({ one }) => ({
	payment: one(payments, {
		fields: [refunds.paymentId],
		references: [payments.id],
	}),
	order: one(orders, {
		fields: [refunds.orderId],
		references: [orders.id],
	}),
}));

export const webhookEventRelations = relations(webhookEvents, ({ one }) => ({
	order: one(orders, {
		fields: [webhookEvents.orderId],
		references: [orders.id],
	}),
	payment: one(payments, {
		fields: [webhookEvents.paymentId],
		references: [payments.id],
	}),
}));

export const ticketRelations = relations(tickets, ({ one, many }) => ({
	order: one(orders, {
		fields: [tickets.orderId],
		references: [orders.id],
	}),
	orderItem: one(orderItems, {
		fields: [tickets.orderItemId],
		references: [orderItems.id],
	}),
	event: one(events, {
		fields: [tickets.eventId],
		references: [events.id],
	}),
	ticketType: one(ticketTypes, {
		fields: [tickets.ticketTypeId],
		references: [ticketTypes.id],
	}),
	ownerUser: one(users, {
		fields: [tickets.ownerUserId],
		references: [users.id],
	}),
	checkedInBy: one(users, {
		fields: [tickets.checkedInById],
		references: [users.id],
	}),
	scans: many(ticketScans),
}));

export const ticketScanRelations = relations(ticketScans, ({ one }) => ({
	ticket: one(tickets, {
		fields: [ticketScans.ticketId],
		references: [tickets.id],
	}),
	scannedBy: one(users, {
		fields: [ticketScans.scannedById],
		references: [users.id],
	}),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
	organization: one(organizations, {
		fields: [auditLogs.organizationId],
		references: [organizations.id],
	}),
	actorUser: one(users, {
		fields: [auditLogs.actorUserId],
		references: [users.id],
	}),
}));
