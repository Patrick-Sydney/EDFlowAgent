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
  // Triage fields - Core vitals and assessment
  triageCompleted: varchar("triage_completed", { length: 10 }).default("false"), // "true" | "false"
  triagePain: integer("triage_pain"), // 0-10 pain scale
  triageNotes: text("triage_notes").default(""),
  triageHr: integer("triage_hr"), // heart rate (bpm)
  triageRr: integer("triage_rr"), // respiratory rate (/min)
  triageBpSys: integer("triage_bp_sys"), // systolic BP
  triageBpDia: integer("triage_bp_dia"), // diastolic BP
  triageSpo2: integer("triage_spo2"), // oxygen saturation (%)
  triageTemp: integer("triage_temp"), // temperature (°C * 10 for decimal precision)
  // Triage fields - Extended v2 fields
  triageModeOfArrival: varchar("triage_mode_of_arrival", { length: 20 }), // walk-in, ambulance, transfer
  triageComplaintText: text("triage_complaint_text").default(""),
  triageComplaintCode: varchar("triage_complaint_code", { length: 50 }),
  triageAllergy: varchar("triage_allergy", { length: 20 }).default("unknown"), // none, known, unknown
  triagePregnancy: varchar("triage_pregnancy", { length: 20 }).default("unknown"), // yes, no, unknown
  triageInfection: varchar("triage_infection", { length: 20 }).default("none"), // none, suspected, confirmed
  triageMobility: varchar("triage_mobility", { length: 20 }).default("independent"), // independent, assist, bed
  triageRiskSepsis: varchar("triage_risk_sepsis", { length: 10 }).default("false"),
  triageRiskStroke: varchar("triage_risk_stroke", { length: 10 }).default("false"),
  triageRiskSuicide: varchar("triage_risk_suicide", { length: 10 }).default("false"),
  triageProvisionalDispo: varchar("triage_provisional_dispo", { length: 30 }).default("unsure"), // unsure, likelyDischarge, likelyAdmit
  triageExpectedResources: text("triage_expected_resources").default(""), // JSON array as string
  triageCareAnalgesia: varchar("triage_care_analgesia", { length: 10 }).default("false"),
  triageCareIv: varchar("triage_care_iv", { length: 10 }).default("false"),
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
