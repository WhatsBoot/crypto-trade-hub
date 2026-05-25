import { pgTable, serial, integer, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const txTypeEnum = pgEnum("tx_type", ["deposit", "withdrawal", "trade", "swap"]);
export const txStatusEnum = pgEnum("tx_status", ["pending", "completed", "failed"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: txTypeEnum("type").notNull(),
  currency: text("currency").notNull(),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  status: txStatusEnum("status").notNull().default("completed"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
