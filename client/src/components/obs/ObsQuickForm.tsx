import React, { useMemo, useState } from "react";
import { vitalsStore } from "../../stores/vitalsStore";

type Num = number | undefined;

// Simple adult EWS (NEWS-like) calculator for RR, SpO2, HR, SBP, Temp + LOC (optional AVPU)
function scoreResp(rr: Num) {
  if (rr == null) return 0;
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}
function scoreSpO2(spo2: Num) {
  if (spo2 == null) return 0;
  if (spo2 >= 96) return 0;
  if (spo2 >= 94) return 1;
  if (spo2 >= 92) return 2;
  return 3;
}
function scoreHR(hr: Num) {
  if (hr == null) return 0;
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3;
}
function scoreSBP(sbp: Num) {
  if (sbp == null) return 0;
  if (sbp <= 90) return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 3; // >=220
}
function scoreTemp(temp: Num) {
  if (temp == null) return 0;
  if (temp <= 35) return 3;
  if (temp <= 36) return 1;
  if (temp <= 38) return 0;
  if (temp <= 39) return 1;
  return 2;
}
function scoreLOC(loc: "A" | "V" | "P" | "U" | undefined) {
  if (!loc || loc === "A") return 0;
  return 3; // any deviation from A scores
}

function calcEWS(vals: {
  rr?: number;
  spo2?: number;
  hr?: number;
  sbp?: number;
  temp?: number;
  loc?: "A" | "V" | "P" | "U";
}) {
  const s =
    scoreResp(vals.rr) +
    scoreSpO2(vals.spo2) +
    scoreHR(vals.hr) +
    scoreSBP(vals.sbp) +
    scoreTemp(vals.temp) +
    scoreLOC(vals.loc);
  return s;
}

function Field({
  label,
  unit,
  value,
  setValue,
  step = 1,
  min,
  max,
}: {
  label: string;
  unit?: string;
  value: Num;
  setValue: (n: Num) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border p-2">
      <div className="text-sm">{label}</div>
      <div className="flex items-center gap-2">
        <button
          className="rounded-full border px-3 py-1 text-sm"
          onClick={() => setValue(value == null ? undefined : Math.max(min ?? -Infinity, Math.round((value - step) * 10) / 10))}
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          className="w-20 rounded-md border px-2 py-1 text-right"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v === "" ? undefined : Number(v));
          }}
          step={step}
          min={min}
          max={max}
        />
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        <button
          className="rounded-full border px-3 py-1 text-sm"
          onClick={() => setValue(value == null ? step : Math.min(max ?? Infinity, Math.round((value + step) * 10) / 10))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function ObsQuickForm({
  patientId,
  onSaved,
}: {
  patientId: string | number;
  onSaved?: () => void;
}) {
  const [rr, setRR] = useState<Num>();
  const [spo2, setSpO2] = useState<Num>();
  const [hr, setHR] = useState<Num>();
  const [sbp, setSBP] = useState<Num>();
  const [temp, setTemp] = useState<Num>();
  const [loc, setLOC] = useState<"A" | "V" | "P" | "U" | undefined>("A");
  const [saving, setSaving] = useState(false);

  const ews = useMemo(() => calcEWS({ rr, spo2, hr, sbp, temp, loc }), [rr, spo2, hr, sbp, temp, loc]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Enter observations</div>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
          EWS <strong>{isFinite(ews) ? ews : 0}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Field label="Respiratory rate" unit="bpm" value={rr} setValue={setRR} step={1} min={4} max={60} />
        <Field label="SpO₂" unit="%" value={spo2} setValue={setSpO2} step={1} min={70} max={100} />
        <Field label="Heart rate" unit="bpm" value={hr} setValue={setHR} step={1} min={20} max={220} />
        <Field label="Systolic BP" unit="mmHg" value={sbp} setValue={setSBP} step={1} min={50} max={260} />
        <Field label="Temperature" unit="°C" value={temp} setValue={setTemp} step={0.1} min={32} max={42.5} />
        <div className="flex items-center justify-between gap-2 rounded-xl border p-2">
          <div className="text-sm">Level of consciousness</div>
          <div className="flex items-center gap-1">
            {(["A", "V", "P", "U"] as const).map((k) => (
              <button
                key={k}
                className={`rounded-full border px-3 py-1 text-sm ${loc === k ? "bg-background shadow" : ""}`}
                onClick={() => setLOC(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button className="rounded-full border px-4 py-2 text-sm" onClick={() => { setRR(undefined); setSpO2(undefined); setHR(undefined); setSBP(undefined); setTemp(undefined); setLOC("A"); }}>
          Clear
        </button>
        <button
          className="rounded-full px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const obs = {
                t: new Date().toISOString(),
                rr, spo2, hr, sbp, temp,
                ews,
                source: "obs" as const,
              };
              vitalsStore.add(String(patientId), obs);
              onSaved?.();
            } finally {
              setSaving(false);
            }
          }}
        >
          Save obs
        </button>
      </div>
    </div>
  );
}