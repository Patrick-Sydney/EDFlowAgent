// tasks/types.ts
export type Role = "RN" | "Charge" | "MD" | "HCA";

export type TaskKind =
  | "comfort"      // blankets, settle, reassurance
  | "hygiene"      // toileting, wash, linen change
  | "mobility"     // transfer, pressure roll, out-of-bed
  | "escort"       // chaperone, imaging escort, ECG escort
  | "environment"; // prepare bay/room, restock

export type TaskStatus = "pending" | "done" | "escalated";

export interface Task {
  id: string;
  patientId?: string;     // optional for environment tasks
  kind: TaskKind;
  label: string;          // short human label ("Assist to toilet")
  detail?: string;        // free-text detail from RN/Charge
  createdAt: string;      // ISO
  dueAt?: string;         // ISO (overdue = now > dueAt)
  status: TaskStatus;
  assignedTo?: string;    // HCA user id (optional = pool)
  origin: "RN" | "Charge" | "Schedule"; // for now: RN/Charge only
  actorId?: string;       // creator user id
}

export const isOverdue = (t: Task): boolean =>
  !!t.dueAt && t.status === "pending" && new Date(t.dueAt).getTime() < Date.now();