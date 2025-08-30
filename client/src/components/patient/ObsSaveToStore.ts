import { vitalsStore, ObsPoint } from "../../stores/vitalsStore";

export function saveObsToStore(patientId: string | number, values: {
  rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
}) {
  const point: ObsPoint = {
    t: new Date().toISOString(),
    rr: values.rr, spo2: values.spo2, hr: values.hr, sbp: values.sbp, temp: values.temp, ews: values.ews,
    source: "obs",
  };
  vitalsStore.add(patientId, point);
}

// Example usage in your +Obs modal:
// import { saveObsToStore } from "./ObsSaveToStore";
// async function handleSave() {
//   saveObsToStore(patient.id, formValues); // instant UI update
//   try { await api.saveObservation(patient.id, formValues); } catch {}
//   onClose();
// }