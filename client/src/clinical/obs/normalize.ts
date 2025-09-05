export function normalizeRawObs(raw: any) {
  // Convert to canonical units and round consistently
  const toNum = (x:any) => (x === "" || x == null ? undefined : Number(x));
  const rr   = toNum(raw.rr);
  const hr   = toNum(raw.hr);
  const sbp  = toNum(raw.sbp);
  // °F → °C if needed
  let temp = toNum(raw.temp);
  if (raw.tempUnit === "F" && temp != null) temp = Math.round(((temp - 32) * 5/9) * 10) / 10;
  const spo2 = toNum(raw.spo2);

  // Clamp plausible ranges to kill slider jitter / device spikes
  const clamp = (v: number|undefined, lo: number, hi: number) =>
    v == null ? undefined : Math.min(hi, Math.max(lo, v));

  return {
    rr:  clamp(rr,   4, 60),
    hr:  clamp(hr,  20, 220),
    sbp: clamp(sbp, 50, 250),
    spo2:clamp(spo2, 50, 100),
    temp:clamp(temp, 30, 43),
    loc: raw.loc as any, // optional
    o2:  { device: raw.o2Device, lpm: toNum(raw.o2Lpm), onOxygen: !!raw.onOxygen },
    source: raw.source ?? "obs" as const,
  };
}