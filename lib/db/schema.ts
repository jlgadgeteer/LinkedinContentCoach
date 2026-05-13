import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  uuid,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Single-tenant by design (ADR-001). Both `config` and `voice_profile`
 * are singletons; the CHECK constraint on id enforces exactly-one-row.
 */
export const config = pgTable(
  "config",
  {
    id: integer("id").primaryKey().default(1),
    passwordHash: text("password_hash"),
    provider: text("provider"),
    model: text("model"),
    encryptedApiKey: text("encrypted_api_key"),
    setupCompletedAt: timestamp("setup_completed_at", { withTimezone: true }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    singleton: check("config_singleton", sql`${t.id} = 1`),
  }),
);

export const voiceProfile = pgTable(
  "voice_profile",
  {
    id: integer("id").primaryKey().default(1),
    markdown: text("markdown").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    singleton: check("voice_profile_singleton", sql`${t.id} = 1`),
  }),
);

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  url: text("url"),
  hook: text("hook"),
  text: text("text").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Append-only log feeding the workspace's "Recent" section.
 * `kind` is one of DRAFT, IDEATE, SEARCH, QC (uppercased in storage).
 */
export const recentActions = pgTable("recent_actions", {
  id: serial("id").primaryKey(),
  at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  ref: text("ref"),
});

export type Config = typeof config.$inferSelect;
export type NewConfig = typeof config.$inferInsert;
export type VoiceProfileRow = typeof voiceProfile.$inferSelect;
export type NewVoiceProfile = typeof voiceProfile.$inferInsert;
export type PostRow = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type RecentActionRow = typeof recentActions.$inferSelect;
export type NewRecentAction = typeof recentActions.$inferInsert;
