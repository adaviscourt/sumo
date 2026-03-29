import { pgTable, text, integer, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  deckSlug: text("deck_slug").notNull(),
  score: integer("score").notNull(),
  asked: integer("asked").notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
  environment: text("environment")
});

export const cardResults = pgTable("card_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  cardId: text("card_id").notNull(),
  correct: boolean("correct").notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }).notNull()
});
