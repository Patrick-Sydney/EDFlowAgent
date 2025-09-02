import { journeyStore } from "../stores/journeyStore";
import { vitalsStore } from "../stores/vitalsStore";
import { resolvePatientId } from "./demoPatients";

type Key = "baseline" | "surge" | "cohort-sepsis" | "cohort-stroke" | "cohort-chestpain";

const now = () => Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
const minsAgo = (m: number) => iso(now() - m * 60_000);

function addObs(pid: string, rows: Array<Partial<{t:string; rr:number; hr:number; sbp:number; spo2:number; temp:number; ews:number}>>) {
  for (const r of rows) {
    const t = r.t ?? minsAgo(0);
    vitalsStore.add(String(pid), { t, ...r, source: "obs" });
  }
  window.dispatchEvent(new CustomEvent("vitals:updated", { detail: { patientId: pid }}));
}

function addJourney(pid: string, kind: any, label: string, detail?: string, t?: string) {
  journeyStore.add(pid, { kind, label, detail, t });
}

function seedBaseline() {
  const alex = resolvePatientId("Alex Taylor");
  const moana = resolvePatientId("Moana Rangi");
  const rose  = resolvePatientId("Rose Chen");
  const list = [alex, moana, rose].filter(Boolean) as string[];
  for (const pid of list) {
    addJourney(pid, "arrival", "Arrived at ED", undefined, minsAgo(180));
    addJourney(pid, "triage",  "Triage completed (ATS 3)", undefined, minsAgo(160));
    addJourney(pid, "room_change", "Moved to cubicle", "Roomed", minsAgo(140));
    addObs(pid, [
      { t: minsAgo(120), rr: 16, hr: 84, sbp: 132, spo2: 98, temp: 36.7, ews: 1 },
      { t: minsAgo(60),  rr: 15, hr: 80, sbp: 128, spo2: 98, temp: 36.8, ews: 1 },
      { t: minsAgo(10),  rr: 16, hr: 78, sbp: 126, spo2: 99, temp: 36.7, ews: 0 },
    ]);
    addJourney(pid, "task", "Obs scheduled q30m");
  }
}

function seedSurge() {
  // Keep your existing surge behavior; here we just leave a timeline hint.
  const alex = resolvePatientId("Alex Taylor");
  if (alex) addJourney(alex, "alert", "Surge mode activated", "Board capacity high");
}

function seedSepsisCohort() {
  const pid = resolvePatientId("Alex Taylor");
  if (!pid) return;
  addJourney(pid, "alert", "Sepsis risk flagged", "qSOFA ≥ 2", minsAgo(95));
  addJourney(pid, "order", "Sepsis bundle ordered", "Blood cultures, lactate, broad-spectrum abx", minsAgo(90));
  addObs(pid, [
    { t: minsAgo(100), rr: 24, hr: 112, sbp: 98,  spo2: 94, temp: 38.6, ews: 5 },
    { t: minsAgo(70),  rr: 22, hr: 118, sbp: 92,  spo2: 93, temp: 38.9, ews: 6 },
    { t: minsAgo(30),  rr: 20, hr: 110, sbp: 100, spo2: 95, temp: 38.4, ews: 4 },
  ]);
  addJourney(pid, "med_admin", "Antibiotics administered", "Piperacillin/tazobactam 4.5g IV", minsAgo(60));
  addJourney(pid, "task", "Fluids bolus started", "30 mL/kg crystalloid", minsAgo(58));
  addJourney(pid, "result", "Lactate resulted 3.4 mmol/L", "Critical", minsAgo(45));
  addJourney(pid, "ews_change", "EWS 6 → 4", undefined, minsAgo(30));
}

function seedStrokeCohort() {
  const pid = resolvePatientId("Moana Rangi");
  if (!pid) return;
  addJourney(pid, "arrival", "Stroke alert pre-notified by EMS", undefined, minsAgo(75));
  addJourney(pid, "triage", "FAST positive", "Left arm weakness, aphasia", minsAgo(70));
  addJourney(pid, "order", "CT brain (non-contrast) ordered", undefined, minsAgo(68));
  addJourney(pid, "room_change", "To Diagnostics", "CT suite", minsAgo(60));
  addJourney(pid, "result", "CT completed", "No hemorrhage", minsAgo(50));
  addJourney(pid, "order", "CT perfusion + CTA", undefined, minsAgo(48));
  addJourney(pid, "result", "LVO M1 suspected", "Neuro IR paged", minsAgo(40));
  addObs(pid, [
    { t: minsAgo(70), rr: 18, hr: 84, sbp: 168, spo2: 96, temp: 36.5, ews: 3 },
    { t: minsAgo(30), rr: 16, hr: 82, sbp: 158, spo2: 97, temp: 36.5, ews: 2 },
  ]);
}

function seedChestPainCohort() {
  const pid = resolvePatientId("Rose Chen");
  if (!pid) return;
  addJourney(pid, "arrival", "Chest pain onset 1h prior", undefined, minsAgo(65));
  addJourney(pid, "order", "ECG ordered", undefined, minsAgo(62));
  addJourney(pid, "result", "ECG completed", "T-wave inversion V2–V4", minsAgo(60));
  addJourney(pid, "order", "Troponin (0/2h)", undefined, minsAgo(60));
  addObs(pid, [
    { t: minsAgo(60), rr: 18, hr: 96,  sbp: 142, spo2: 98, temp: 36.8, ews: 1 },
    { t: minsAgo(30), rr: 16, hr: 92,  sbp: 138, spo2: 98, temp: 36.7, ews: 1 },
    { t: minsAgo(5),  rr: 16, hr: 105, sbp: 146, spo2: 97, temp: 36.7, ews: 2 },
  ]);
  addJourney(pid, "result", "Troponin (0h) 72 ng/L", "Abnormal", minsAgo(20));
  addJourney(pid, "order", "Aspirin 300 mg PO", undefined, minsAgo(18));
  addJourney(pid, "med_admin", "Aspirin administered", undefined, minsAgo(15));
}

export function runScenario(key: string) {
  const k = key as Key;
  switch (k) {
    case "baseline":        seedBaseline(); break;
    case "surge":           seedSurge(); break;
    case "cohort-sepsis":   seedSepsisCohort(); break;
    case "cohort-stroke":   seedStrokeCohort(); break;
    case "cohort-chestpain":seedChestPainCohort(); break;
    default: break;
  }
}