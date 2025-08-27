// Early Warning Score (EWS) calculation utilities
// Implements Australian standard EWS scoring system

export type ACVPU = "Alert" | "Confusion" | "Voice" | "Pain" | "Unresponsive";

export interface EwsResult {
  score: number;
  band: "low" | "medium" | "high";
  byParam: {
    RR?: number;
    SpO2?: number; 
    Temp?: number;
    SBP?: number;
    HR?: number;
    ACVPU?: number;
  };
  flags: {
    anyThree: boolean; // any single parameter scoring 3+
    requiresEscalation: boolean;
  };
  calculatedAt: string;
}

interface VitalRanges {
  RR?: number;
  SpO2?: number;
  Temp?: number; 
  SBP?: number;
  HR?: number;
  ACVPU?: ACVPU;
  O2?: boolean;
  SpO2Scale?: 1 | 2; // Scale 1 or 2 for SpO2 scoring
}

// EWS scoring tables (Australian standard)
function scoreRR(rr?: number): number {
  if (rr === undefined) return 0;
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3; // ≥25
}

function scoreSpO2(spo2?: number, scale: 1 | 2 = 1): number {
  if (spo2 === undefined) return 0;
  if (scale === 1) {
    if (spo2 <= 91) return 3;
    if (spo2 <= 93) return 2;
    if (spo2 <= 95) return 1;
    return 0; // ≥96
  } else { // Scale 2
    if (spo2 <= 83) return 3;
    if (spo2 <= 85) return 2;
    if (spo2 <= 87) return 1;
    return 0; // ≥88
  }
}

function scoreTemp(temp?: number): number {
  if (temp === undefined) return 0;
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2; // ≥39.1
}

function scoreSBP(sbp?: number): number {
  if (sbp === undefined) return 0;
  if (sbp <= 90) return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 2; // ≥220
}

function scoreHR(hr?: number): number {
  if (hr === undefined) return 0;
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3; // ≥131
}

function scoreACVPU(acvpu?: ACVPU): number {
  if (!acvpu || acvpu === "Alert") return 0;
  return 3; // Any non-Alert state
}

export function calcEWSFromLatest(vitals: VitalRanges): EwsResult {
  const byParam = {
    RR: scoreRR(vitals.RR),
    SpO2: scoreSpO2(vitals.SpO2, vitals.SpO2Scale),
    Temp: scoreTemp(vitals.Temp),
    SBP: scoreSBP(vitals.SBP),
    HR: scoreHR(vitals.HR),
    ACVPU: scoreACVPU(vitals.ACVPU),
  };

  const score = Object.values(byParam).reduce((sum, val) => sum + val, 0);
  
  // Band classification
  let band: "low" | "medium" | "high";
  const anyThree = Object.values(byParam).some(val => val >= 3);
  
  if (anyThree || score >= 7) {
    band = "high";
  } else if (score >= 4) {
    band = "medium"; 
  } else {
    band = "low";
  }

  return {
    score,
    band,
    byParam,
    flags: {
      anyThree,
      requiresEscalation: band === "high" || anyThree,
    },
    calculatedAt: new Date().toISOString(),
  };
}