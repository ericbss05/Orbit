ALTER TABLE "routines" ADD COLUMN "message_id" varchar;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_message_id_unique" UNIQUE("message_id");