// lib/pathwayTimers.ts
import { getArrivalISO } from "./ewsAndNextObs";
import { journeyStore } from "@/stores/journeyStore";

export type TimerState = { label: string; state: "due"|"ordered"|"done"; dueAt?: string; tDone?: string };

export function acsTimers(patientId: string): TimerState[] {
  // ECG due at +10m from arrival unless done
  const evs = useJourneyStore.getState().events.filter(e => e.patientId === patientId);
  const got = (q: string) => evs.find(e => (e.label || "").toLowerCase().includes(q));
  const arrISO = getArrivalISO(patientId);
  const mkDue = (mins: number) => {
    if (!arrISO) return undefined;
    const d = new Date(arrISO); d.setMinutes(d.getMinutes() + mins);
    return d.toISOString();
  };
  const ecgRes = got("ecg");
  const tropRes = got("trop");
  const asaAdmin = got("aspirin");
  const ecg: TimerState = ecgRes ? { label: "ECG", state: "done", tDone: ecgRes.t }
    : got("order ecg") ? { label: "ECG", state: "ordered", dueAt: mkDue(10) }
    : { label: "ECG", state: "due", dueAt: mkDue(10) };
  const trop: TimerState = tropRes ? { label: "Troponin", state: "done", tDone: tropRes.t }
    : got("order trop") ? { label: "Troponin", state: "ordered" }
    : { label: "Troponin", state: "due" };
  const asa: TimerState = asaAdmin ? { label: "Aspirin", state: "done", tDone: asaAdmin.t }
    : { label: "Aspirin", state: "due" };
  return [ecg, trop, asa];
}

export function sepsisTimers(patientId: string): TimerState[] {
  const evs = journeyStore.list(patientId);
  const got = (q: string) => evs.find(e => (e.label || "").toLowerCase().includes(q));
  const abx = got("antibiot");
  const lact = got("lactate");
  return [
    abx ? { label: "Antibiotics", state: "done", tDone: abx.t } : { label: "Antibiotics", state: "due" },
    lact ? { label: "Lactate", state: "done", tDone: lact.t } : { label: "Lactate", state: "due" },
  ];
}