ALTER TABLE "affirmations" ADD COLUMN "is_repeating" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "affirmations_is_repeating_idx" ON "affirmations" USING btree ("is_repeating");--> statement-breakpoint
CREATE INDEX "habits_is_favorite_idx" ON "habits" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "journal_entries_is_favorite_idx" ON "journal_entries" USING btree ("is_favorite");