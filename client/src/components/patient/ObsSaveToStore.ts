import { vitalsStore, ObsPoint } from "../../stores/vitalsStore";

// Optional NEWS/EWS computation fallback.
// If your modal already computes EWS, it will be used; otherwise we try window.EDFLOW.calcEWS(values).
function calcEWSFallback(values: { rr?:number; spo2?:number; hr?:number; sbp?:number; temp?:number; }) {
  // Call your existing calculator if exposed globally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win: any = typeof window !== "undefined" ? (window as any) : {};
  if (typeof win.EDFLOW?.calcEWS === "function") {
    try { return Number(win.EDFLOW.calcEWS(values)); } catch {}
  }
  return undefined; // leave undefined if you prefer not to guess
}

export function saveObsToStore(patientId: string | number, values: {
  rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
}) {
  const nowIso = new Date().toISOString();
  const ews = values.ews ?? calcEWSFallback(values);
  const point: ObsPoint = {
    t: nowIso,
    rr: values.rr, spo2: values.spo2, hr: values.hr, sbp: values.sbp, temp: values.temp,
    ews, source: "obs",
  };
  vitalsStore.add(patientId, point);
}

// Example usage in your +Obs modal:
// import { saveObsToStore } from "./ObsSaveToStore";
// async function handleSave() {
//   saveObsToStore(patient.id, { rr, spo2, hr, sbp, temp, ews }); // instant UI update + persistence
//   try { await api.saveObservation(patient.id, { rr, spo2, hr, sbp, temp, ews }); } catch {}
//   onClose();
// }