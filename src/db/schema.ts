import type { DayWindow } from "@/lib/days";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("public_id").notNull(),
    adminToken: text("admin_token").notNull(),
    title: text("title").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    dailyStart: integer("daily_start").notNull(),
    dailyEnd: integer("daily_end").notNull(),
    slotMinutes: integer("slot_minutes").notNull(),
    desiredMinutes: integer("desired_minutes").notNull(),
    /** 日にち指定モードのときだけ入る。null なら期間モード */
    days: jsonb("days").$type<DayWindow[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("events_public_id_idx").on(t.publicId),
    uniqueIndex("events_admin_token_idx").on(t.adminToken),
  ],
);

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    editToken: text("edit_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("participants_edit_token_idx").on(t.editToken),
    index("participants_event_id_idx").on(t.eventId),
  ],
);

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
  },
  (t) => [
    uniqueIndex("availability_slots_unique_idx").on(
      t.participantId,
      t.date,
      t.startMin,
    ),
    index("availability_slots_event_id_idx").on(t.eventId),
  ],
);

export type EventRow = typeof events.$inferSelect;
export type ParticipantRow = typeof participants.$inferSelect;
export type SlotRow = typeof availabilitySlots.$inferSelect;
