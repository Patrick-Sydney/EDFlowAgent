import { vitalsStore, ObsPoint } from "../../stores/vitalsStore";
import { calcEWSFromLatest } from "../../utils/ews";

// EWS computation fallback using the existing EWS calculation system.
function calcEWSFallback(values: { rr?:number; spo2?:number; hr?:number; sbp?:number; temp?:number; }) {
  try {
    const result = calcEWSFromLatest({
      RR: values.rr,
      SpO2: values.spo2,
      HR: values.hr,
      SBP: values.sbp,
      Temp: values.temp
    });
    return result.score;
  } catch (error) {
    console.warn("EWS calculation failed:", error);
    return undefined;
  }
}

export function saveObsToStore(patientId: string | number, values: {
  rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
}) {
  const nowIso = new Date().toISOString();
  const ews = values.ews ?? calcEWSFallback(values);
  console.log("saveObsToStore:", patientId, "vitals:", values, "calculated EWS:", ews);
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