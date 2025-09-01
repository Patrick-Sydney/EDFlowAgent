import React, { useEffect, useMemo, useRef, useState } from "react";
import { vitalsStore, useVitalsLast } from "../../stores/vitalsStore";
import "./obs-slider.css";

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

/** Finger-first slider with hidden thumb on first obs and on-drag halo. */
function FingerSlider({
  label, unit, min, max, step = 1,
  value, onChange,
  last, // seed/ hint
}: {
  label: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  value: Num;
  onChange: (n: Num) => void;
  last?: number;
}) {
  const [active, setActive] = useState(false);
  const [touched, setTouched] = useState<boolean>(value != null || last != null);
  const inputRef = useRef<HTMLInputElement|null>(null);
  const overlayRef = useRef<HTMLDivElement|null>(null);

  // If we have a last value but no current, seed visual position.
  const visualValue = value ?? last ?? (min + max) / 2;

  // Tap-to-place under finger on first interaction
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || (value != null)) return;
    const onPointerDown = (e: PointerEvent) => {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const clamped = Math.min(1, Math.max(0, ratio));
      const v = min + clamped * (max - min);
      const snapped = Math.round(v / step) * step;
      onChange(Number(snapped.toFixed(2)));
      setTouched(true);
      setActive(true);
      input.focus();
    };
    el.addEventListener("pointerdown", onPointerDown);
    return () => el.removeEventListener("pointerdown", onPointerDown);
  }, [min, max, step, onChange, value]);

  const delta = last != null && value != null ? value - last : undefined;
  const deltaStr = delta != null && delta !== 0 ? (delta > 0 ? `Δ +${Math.abs(delta)}` : `Δ −${Math.abs(delta)}`) : undefined;

  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">{label}</div>
        <div className="text-base font-medium tabular-nums">
          {value != null ? value : last != null ? <span className="text-muted-foreground">Last {last}</span> : "—"}
          {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
          {deltaStr && <span className="ml-2 text-xs rounded-full border px-2 py-0.5">{deltaStr}</span>}
        </div>
      </div>
      <div className="relative">
        {/* invisible overlay to capture first tap and place thumb */}
        <div ref={overlayRef} className="absolute inset-0 z-[1]" />
        <input
          ref={inputRef}
          type="range"
          className="finger-range z-0"
          min={min}
          max={max}
          step={step}
          value={visualValue}
          onChange={(e) => { onChange(Number(e.target.value)); setTouched(true); }}
          onPointerDown={() => setActive(true)}
          onPointerUp={() => setActive(false)}
          data-active={active ? "true" : "false"}
          data-hasvalue={touched ? "true" : "false"}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          className="rounded-full border px-3 py-1 text-sm"
          onClick={() => {
            const next = (value ?? last ?? (min + max) / 2) - step;
            onChange(Number(Math.max(min, next).toFixed(2)));
            setTouched(true);
          }}
        >
          −
        </button>
        <button
          className="rounded-full border px-3 py-1 text-sm"
          onClick={() => {
            const next = (value ?? last ?? (min + max) / 2) + step;
            onChange(Number(Math.min(max, next).toFixed(2)));
            setTouched(true);
          }}
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
  const last = useVitalsLast(String(patientId));
  const [rr, setRR] = useState<Num>(last?.rr);
  const [spo2, setSpO2] = useState<Num>(last?.spo2);
  const [hr, setHR] = useState<Num>(last?.hr);
  const [sbp, setSBP] = useState<Num>(last?.sbp);
  const [temp, setTemp] = useState<Num>(last?.temp);
  const [loc, setLOC] = useState<"A" | "V" | "P" | "U" | undefined>("A");
  const [saving, setSaving] = useState(false);

  const ews = useMemo(() => calcEWS({ rr, spo2, hr, sbp, temp, loc }), [rr, spo2, hr, sbp, temp, loc]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Enter observations</div>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
          EWS <strong className="tabular-nums">{isFinite(ews) ? ews : 0}</strong>
        </span>
      </div>

      {/* Sliders grid (finger-first) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FingerSlider label="Respiratory rate" unit="bpm" min={4} max={60} step={1}
          value={rr} onChange={setRR} last={last?.rr} />
        <FingerSlider label="SpO₂" unit="%" min={70} max={100} step={1}
          value={spo2} onChange={setSpO2} last={last?.spo2} />
        <FingerSlider label="Heart rate" unit="bpm" min={20} max={220} step={1}
          value={hr} onChange={setHR} last={last?.hr} />
        <FingerSlider label="Systolic BP" unit="mmHg" min={50} max={260} step={1}
          value={sbp} onChange={setSBP} last={last?.sbp} />
        <FingerSlider label="Temperature" unit="°C" min={32} max={42.5} step={0.1}
          value={temp} onChange={setTemp} last={last?.temp} />

        {/* AVPU pills */}
        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">Level of consciousness</div>
            <div className="text-xs text-muted-foreground">AVPU</div>
          </div>
          <div className="flex items-center gap-1">
            {(["A","V","P","U"] as const).map(k => (
              <button key={k}
                className={`rounded-full border px-3 py-1 text-sm ${loc===k ? "bg-background shadow" : ""}`}
                onClick={()=> setLOC(k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button className="rounded-full border px-4 py-2 text-sm"
          onClick={() => { setRR(undefined); setSpO2(undefined); setHR(undefined); setSBP(undefined); setTemp(undefined); setLOC("A"); }}>
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