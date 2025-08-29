import { useObsStore } from "@/state/observations";

export function saveObsToStore(patientId: string, values: { 
  rr?: number; 
  spo2?: number; 
  hr?: number; 
  sbp?: number; 
  temp?: number; 
  ews?: number; 
}) {
  useObsStore.getState().addObs(patientId, {
    t: new Date().toISOString(),
    rr: values.rr, 
    spo2: values.spo2, 
    hr: values.hr, 
    sbp: values.sbp, 
    temp: values.temp,
    ews: values.ews, 
    source: "obs",
  });
}