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
  ats: integer("ats"), // 1-5 (Australian Triage Scale) - nullable until set in triage
  complaint: text("complaint").notNull(),
  lane: varchar("lane", { length: 50 }).notNull().default("waiting"),
  room: varchar("room", { length: 10 }),
  provider: varchar("provider", { length: 100 }),
  disposition: varchar("disposition", { length: 100 }),
  resultsStatus: varchar("results_status", { length: 20 }).default("pending"), // "pending" | "complete" | null
  triageBypass: varchar("triage_bypass", { length: 10 }).default("false"), // "true" | "false" for critical cases
  isolationRequired: varchar("isolation_required", { length: 10 }).default("false"), // "true" | "false" for isolation needs
  provisionalAts: varchar("provisional_ats", { length: 10 }).default("false"), // "true" | "false" for ambulance-provided ATS
  arrivalTime: timestamp("arrival_time").notNull().defaultNow(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  encounterId: varchar("encounter_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  beforeValue: text("before_value"),
  afterValue: text("after_value"),
  actorName: varchar("actor_name", { length: 100 }),
  actorRole: varchar("actor_role", { length: 50 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
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

export const markResultsCompleteSchema = z.object({
  id: z.string(),
});

export const startTriageSchema = z.object({
  id: z.string(),
});

export const setAtsSchema = z.object({
  id: z.string(),
  ats: z.number().int().min(1).max(5),
  actorName: z.string().optional(),
  actorRole: z.string().optional(),
});

export type AssignRoomRequest = z.infer<typeof assignRoomSchema>;
export type MarkReadyRequest = z.infer<typeof markReadySchema>;
export type MarkResultsCompleteRequest = z.infer<typeof markResultsCompleteSchema>;
export type StartTriageRequest = z.infer<typeof startTriageSchema>;
export type SetAtsRequest = z.infer<typeof setAtsSchema>;

// Audit log types
export type AuditEntry = typeof auditLog.$inferSelect;
export type InsertAuditEntry = typeof auditLog.$inferInsert;
