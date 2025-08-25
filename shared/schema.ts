import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const encounters = pgTable("encounters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  sex: varchar("sex", { length: 1 }).notNull(), // M, F, O
  nhi: varchar("nhi", { length: 7 }).notNull().unique(),
  ats: integer("ats").notNull(), // 1-5 (Australian Triage Scale)
  complaint: text("complaint").notNull(),
  lane: varchar("lane", { length: 50 }).notNull().default("waiting"),
  room: varchar("room", { length: 10 }),
  provider: varchar("provider", { length: 100 }),
  disposition: varchar("disposition", { length: 100 }),
  arrivalTime: timestamp("arrival_time").notNull().defaultNow(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertEncounterSchema = createInsertSchema(encounters).omit({
  id: true,
  arrivalTime: true,
  lastUpdated: true,
});

export const updateEncounterSchema = createInsertSchema(encounters).partial().omit({
  id: true,
  arrivalTime: true,
}).extend({
  id: z.string(),
});

export type InsertEncounter = z.infer<typeof insertEncounterSchema>;
export type UpdateEncounter = z.infer<typeof updateEncounterSchema>;
export type Encounter = typeof encounters.$inferSelect;

// Lane types
export const LANES = [
  "waiting",
  "triage", 
  "roomed",
  "diagnostics",
  "review",
  "ready",
  "discharged"
] as const;

export type Lane = typeof LANES[number];

// ATS color mapping
export const ATS_COLORS = {
  1: "bg-red-600", // Resuscitation
  2: "bg-orange-500", // Emergency
  3: "bg-yellow-500", // Urgent
  4: "bg-green-500", // Semi-urgent
  5: "bg-gray-500", // Non-urgent
} as const;

// Action schemas
export const assignRoomSchema = z.object({
  id: z.string(),
  room: z.string().min(1),
});

export const markReadySchema = z.object({
  id: z.string(),
  disposition: z.string().min(1),
});

export type AssignRoomRequest = z.infer<typeof assignRoomSchema>;
export type MarkReadyRequest = z.infer<typeof markReadySchema>;
