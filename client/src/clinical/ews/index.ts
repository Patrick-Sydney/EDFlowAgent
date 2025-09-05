// ALL EWS MUST COME FROM computeEws(). UI must never compute scores.

export type EwsAlgo = "adult-simple-v1" | "news2" | "adds";

export function computeEws(input: {
  rr?: number; hr?: number; sbp?: number; spo2?: number; temp?: number;
  loc?: "A"|"V"|"P"|"U"; onOxygen?: boolean;
}, algo: EwsAlgo = "adult-simple-v1"): number {
  if (algo === "adult-simple-v1") return ewsAdultSimpleV1(input);
  // future: add NEWS2/ADDS here
  return ewsAdultSimpleV1(input);
}

// Adult Simple v1 (Phase-2 baseline)
// RR, SpO2, Temp, SBP, HR, LOC, O2 gives extra point
function ewsAdultSimpleV1({
  rr, spo2, temp, sbp, hr, loc, onOxygen
}: {
  rr?: number; spo2?: number; temp?: number; sbp?: number; hr?: number; loc?: "A"|"V"|"P"|"U"; onOxygen?: boolean;
}): number {
  let s = 0;

  // RR
  if (rr != null) {
    if (rr <= 8) s += 3;
    else if (rr <= 11) s += 1;
    else if (rr <= 20) s += 0;
    else if (rr <= 24) s += 2;
    else s += 3; // >=25
  }

  // SpO2
  if (spo2 != null) {
    if (spo2 <= 91) s += 3;
    else if (spo2 <= 93) s += 2;
    else if (spo2 <= 95) s += 1;
    else s += 0; // 96-100
  }
  if (onOxygen) s += 1; // supplemental O2 adds 1

  // Temp (°C)
  if (temp != null) {
    if (temp <= 35.0) s += 3;
    else if (temp <= 36.0) s += 1;
    else if (temp <= 38.0) s += 0;
    else if (temp <= 39.0) s += 1;
    else s += 2; // >39
  }

  // SBP
  if (sbp != null) {
    if (sbp <= 90) s += 3;
    else if (sbp <= 100) s += 2;
    else if (sbp <= 110) s += 1;
    else if (sbp <= 219) s += 0;
    else s += 3; // >=220
  }

  // HR
  if (hr != null) {
    if (hr <= 40) s += 3;
    else if (hr <= 50) s += 1;
    else if (hr <= 90) s += 0;
    else if (hr <= 110) s += 1;
    else if (hr <= 130) s += 2;
    else s += 3; // >130
  }

  // LOC (AVPU)
  if (loc && loc !== "A") s += 3;

  return s;
}