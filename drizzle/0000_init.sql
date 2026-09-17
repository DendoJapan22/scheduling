CREATE TABLE "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_min" integer NOT NULL,
	"end_min" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"admin_token" text NOT NULL,
	"title" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"daily_start" integer NOT NULL,
	"daily_end" integer NOT NULL,
	"slot_minutes" integer NOT NULL,
	"desired_minutes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"edit_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "availability_slots_unique_idx" ON "availability_slots" USING btree ("participant_id","date","start_min");--> statement-breakpoint
CREATE INDEX "availability_slots_event_id_idx" ON "availability_slots" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_public_id_idx" ON "events" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_admin_token_idx" ON "events" USING btree ("admin_token");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_edit_token_idx" ON "participants" USING btree ("edit_token");--> statement-breakpoint
CREATE INDEX "participants_event_id_idx" ON "participants" USING btree ("event_id");