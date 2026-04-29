import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const deduplicatedTransactions = pgTable("deduplicated_transactions", {
  transactionId: text("transaction_id").primaryKey(),
  recordId: text("record_id").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})
