CREATE TABLE "deduplicated_transactions" (
	"transaction_id" text PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
