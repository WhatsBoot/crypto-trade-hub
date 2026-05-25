import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const swapsTable = pgTable("swaps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  fromAmount: numeric("from_amount", { precision: 20, scale: 8 }).notNull(),
  toAmount: numeric("to_amount", { precision: 20, scale: 8 }).notNull(),
  rate: numeric("rate", { precision: 20, scale: 8 }).notNull(),
  fee: numeric("fee", { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSwapSchema = createInsertSchema(swapsTable).omit({ id: true, createdAt: true });
export type InsertSwap = z.infer<typeof insertSwapSchema>;
export type Swap = typeof swapsTable.$inferSelect;
