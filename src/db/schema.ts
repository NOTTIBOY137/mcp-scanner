import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const servers = pgTable(
  "servers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    repoUrl: text("repo_url").notNull().unique(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    description: text("description"),
    stars: integer("stars").default(0),
    language: text("language"),
    latestGrade: varchar("latest_grade", { length: 1 }),
    latestScore: integer("latest_score"),
    latestScanId: text("latest_scan_id"),
    isVerified: boolean("is_verified").default(false),
    registrySlug: text("registry_slug"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("servers_grade_idx").on(table.latestGrade),
    index("servers_score_idx").on(table.latestScore),
    index("servers_owner_repo_idx").on(table.owner, table.repo),
  ]
);

export const scans = pgTable(
  "scans",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => servers.id),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    grade: varchar("grade", { length: 1 }),
    score: integer("score"),
    filesScanned: integer("files_scanned").default(0),
    findingsCount: integer("findings_count").default(0),
    categoryScores: jsonb("category_scores"),
    owaspCompliance: jsonb("owasp_compliance"),
    compliancePercentage: integer("compliance_percentage"),
    commitSha: text("commit_sha"),
    branch: text("branch").default("main"),
    duration: integer("duration"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("scans_server_idx").on(table.serverId),
    index("scans_status_idx").on(table.status),
  ]
);

export const findings = pgTable(
  "findings",
  {
    id: text("id").primaryKey(),
    scanId: text("scan_id")
      .notNull()
      .references(() => scans.id),
    ruleId: text("rule_id").notNull(),
    category: text("category").notNull(),
    severity: varchar("severity", { length: 10 }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    filePath: text("file_path").notNull(),
    lineNumber: integer("line_number"),
    snippet: text("snippet"),
    confidence: varchar("confidence", { length: 10 }).notNull().default("high"),
    owaspMcpTop10: varchar("owasp_mcp_top10", { length: 10 }),
    cweIds: jsonb("cwe_ids"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("findings_scan_idx").on(table.scanId),
    index("findings_category_idx").on(table.category),
    index("findings_severity_idx").on(table.severity),
  ]
);

export const toolHashes = pgTable(
  "tool_hashes",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => servers.id),
    toolName: text("tool_name").notNull(),
    hash: text("hash").notNull(),
    previousHash: text("previous_hash"),
    changedAt: timestamp("changed_at"),
    scanId: text("scan_id")
      .notNull()
      .references(() => scans.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("tool_hashes_server_idx").on(table.serverId),
    index("tool_hashes_tool_idx").on(table.toolName),
  ]
);

// --- Monetization tables ---

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id").notNull().unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    plan: varchar("plan", { length: 20 }).notNull().default("free"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_idx").on(table.clerkUserId),
    index("subscriptions_stripe_cust_idx").on(table.stripeCustomerId),
  ]
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    name: text("name").default("Default"),
    plan: varchar("plan", { length: 20 }).default("free"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_user_idx").on(table.clerkUserId),
    index("api_keys_hash_idx").on(table.keyHash),
  ]
);

export const serverClaims = pgTable(
  "server_claims",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => servers.id),
    clerkUserId: text("clerk_user_id").notNull(),
    verificationToken: text("verification_token").notNull().unique(),
    verified: boolean("verified").default(false),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("server_claims_server_idx").on(table.serverId),
    index("server_claims_user_idx").on(table.clerkUserId),
  ]
);

export const waitlist = pgTable(
  "waitlist",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    plan: varchar("plan", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("waitlist_email_idx").on(table.email)]
);

// --- Engagement tables ---

export const webhooks = pgTable(
  "webhooks",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: jsonb("events").$type<string[]>().default(["scan.completed", "scan.failed"]),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("webhooks_user_idx").on(table.clerkUserId)]
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id").primaryKey(),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    payload: jsonb("payload"),
    statusCode: integer("status_code"),
    attempts: integer("attempts").default(0),
    lastAttemptAt: timestamp("last_attempt_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("webhook_deliveries_webhook_idx").on(table.webhookId)]
);

export const emailPreferences = pgTable(
  "email_preferences",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    scanAlerts: boolean("scan_alerts").default(true),
    marketingEmails: boolean("marketing_emails").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("email_prefs_user_idx").on(table.clerkUserId)]
);

export const apiUsage = pgTable(
  "api_usage",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    date: text("date").notNull(),
    endpoint: text("endpoint").notNull(),
    count: integer("count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_usage_user_date_idx").on(table.clerkUserId, table.date),
    index("api_usage_user_idx").on(table.clerkUserId),
  ]
);

// Relations
export const serversRelations = relations(servers, ({ many }) => ({
  scans: many(scans),
  toolHashes: many(toolHashes),
  claims: many(serverClaims),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
  server: one(servers, { fields: [scans.serverId], references: [servers.id] }),
  findings: many(findings),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  scan: one(scans, { fields: [findings.scanId], references: [scans.id] }),
}));

export const toolHashesRelations = relations(toolHashes, ({ one }) => ({
  server: one(servers, {
    fields: [toolHashes.serverId],
    references: [servers.id],
  }),
  scan: one(scans, { fields: [toolHashes.scanId], references: [scans.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, () => ({}));

export const serverClaimsRelations = relations(serverClaims, ({ one }) => ({
  server: one(servers, {
    fields: [serverClaims.serverId],
    references: [servers.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ many }) => ({
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
}));

export const emailPreferencesRelations = relations(emailPreferences, () => ({}));
export const apiUsageRelations = relations(apiUsage, () => ({}));
