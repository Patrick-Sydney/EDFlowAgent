export type Observation = {
  t: string;                  // ISO timestamp
  rr?: number;                // breaths/min
  hr?: number;                // bpm
  sbp?: number;               // mmHg
  spo2?: number;              // %
  temp?: number;              // °C
  loc?: "A"|"V"|"P"|"U";      // optional, AVPU
  o2?: { device?: string; lpm?: number; onOxygen?: boolean };
  source: "obs" | "device";   // manual vs device
  ews: number;                // computed, persisted
  algoId: string;             // "adult-simple-v1" (versioned)
};