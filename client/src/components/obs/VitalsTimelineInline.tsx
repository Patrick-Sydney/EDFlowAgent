import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ReferenceLine
} from "recharts";
import { useVitalsList } from "@/stores/vitalsStore";

type Obs = {
  t: string;         // ISO-ish time
  rr?: number;       // breaths/min
  hr?: number;       // bpm
  sbp?: number;      // mmHg (systolic)
  temp?: number;     // °C
  spo2?: number;     // %
  ews?: number;
  source?: "triage" | "obs" | "device";
};

// --- utilities --------------------------------------------------------------
function coerceMs(x:any): number | undefined {
  if (x == null) return undefined;
  if (x instanceof Date) return x.getTime();
  if (typeof x === "number") return x > 1e12 ? x : x*1000; // allow seconds
  if (typeof x === "string") {
    // ISO first
    const iso = Date.parse(x);
    if (!Number.isNaN(iso)) return iso;
    // If hook ever returns time-only strings, we simply skip (modal already succeeded,
    // so your hook likely returns ISO strings or Date/number).
  }
  return undefined;
}

// Use the project's canonical hook (same one used by the working modal) - PURE
function useVitalsSeries(patientId: string | number) {
  // The hook already subscribes to store updates; we just normalize timestamps.
  const list = useVitalsList(String(patientId)) as Obs[] | undefined;
  
  // Memoize the transformation to prevent new arrays on every render
  return useMemo(() => {
    if (!Array.isArray(list)) return [];
    return list.map((r:any) => {
      const ms = coerceMs(r.t ?? r.time ?? r.timestamp ?? r.ts ?? r.date);
      return {
        ...r,
        t: ms != null ? new Date(ms).toISOString() : (r.t ?? r.time ?? r.timestamp ?? r.ts ?? r.date),
      } as Obs;
    });
  }, [list]);
}

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};

type Props = {
  patientId: string | number;
  height?: number;
  className?: string;
};

export default function VitalsTimelineInline({ patientId, height = 260, className }: Props) {
  const pid = String(patientId);
  const raw = useVitalsSeries(pid);

  // Derive, sort, clamp to selected window
  const [windowHours, setWindowHours] = useState<4 | 8 | 24 | 72>(8);
  const now = Date.now();
  const minTime = now - windowHours * 3600_000;

  const data = useMemo(() => {
    const rows = [...raw].filter(r => {
      const t = Date.parse(r.t);
      return isFinite(t) && t >= minTime;
    }).sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
    return rows.map(r => ({ ...r, time: fmtTime(r.t) }));
  }, [raw, minTime]);

  // Series toggles (default all on)
  const [show, setShow] = useState({ rr: true, hr: true, sbp: true, spo2: true, temp: true });
  const toggle = (k: keyof typeof show) => setShow(s => ({ ...s, [k]: !s[k] }));

  // Vertical markers where EWS >= 5 (escalation threshold example)
  const markers = useMemo(() => {
    return data
      .map((r, idx) => ({ idx, time: r.time, ews: r.ews ?? 0 }))
      .filter(m => (m.ews ?? 0) >= 5);
  }, [data]);

  // Axis domains (calm defaults with padding)
  const domRate = [0, 200];           // hr/rr
  const domBP   = [70, 220];          // systolic
  const domSpO2 = [88, 100];
  const domTemp = [33, 41.5];

  const hasAny = data.length > 0;

  return (
    <div className={`rounded-2xl border p-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-sm font-medium">Vitals timeline</div>
        <div className="flex flex-wrap items-center gap-1">
          {/* Window presets */}
          {[4, 8, 24, 72].map(h => (
            <button key={h}
              className={`rounded-full border px-2.5 py-1 text-xs ${windowHours===h ? "bg-background shadow" : "opacity-80"}`}
              onClick={() => setWindowHours(h as any)}
              title={`Show last ${h} hours`}
            >
              {h}h
            </button>
          ))}
          <div className="mx-2 h-4 w-px bg-border" />
          {/* Toggles */}
          <button className={`rounded-full border px-2.5 py-1 text-xs ${show.rr ? "bg-background shadow" : "opacity-70"}`} onClick={()=>toggle("rr")}>RR</button>
          <button className={`rounded-full border px-2.5 py-1 text-xs ${show.hr ? "bg-background shadow" : "opacity-70"}`} onClick={()=>toggle("hr")}>HR</button>
          <button className={`rounded-full border px-2.5 py-1 text-xs ${show.sbp ? "bg-background shadow" : "opacity-70"}`} onClick={()=>toggle("sbp")}>SBP</button>
          <button className={`rounded-full border px-2.5 py-1 text-xs ${show.spo2 ? "bg-background shadow" : "opacity-70"}`} onClick={()=>toggle("spo2")}>SpO₂</button>
          <button className={`rounded-full border px-2.5 py-1 text-xs ${show.temp ? "bg-background shadow" : "opacity-70"}`} onClick={()=>toggle("temp")}>Temp</button>
        </div>
      </div>

      <div className="w-full" style={{ height }}>
        {!hasAny ? (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">
            No observations in the last {windowHours}h.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />

              {/* Hidden default axis to satisfy any components that fall back to id 0 */}
              {/* (Recharts uses 0 as the implicit yAxisId when none is provided) */}
              <YAxis yAxisId={0 as any} hide />

              {/* Multi-axes — kept subtle to avoid clutter */}
              <YAxis yAxisId="rate"  domain={domRate}  width={36} tick={{ fontSize: 11 }} label={{ value: "HR/RR", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <YAxis yAxisId="bp"    domain={domBP}    orientation="right" width={36} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="spo2"  domain={domSpO2}  orientation="right" width={28} hide />
              <YAxis yAxisId="temp"  domain={domTemp}  orientation="right" width={28} hide />

              {/* Calm palette (no alarm colors) */}
              {show.rr   && <Line type="monotone" yAxisId="rate" dataKey="rr"   name="RR"   stroke="#4b9fd6" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />}
              {show.hr   && <Line type="monotone" yAxisId="rate" dataKey="hr"   name="HR"   stroke="#6f7fb2" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />}
              {show.sbp  && <Line type="monotone" yAxisId="bp"   dataKey="sbp"  name="SBP"  stroke="#6aa3a1" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />}
              {show.spo2 && <Line type="monotone" yAxisId="spo2" dataKey="spo2" name="SpO₂" stroke="#7aa386" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />}
              {show.temp && <Line type="monotone" yAxisId="temp" dataKey="temp" name="Temp" stroke="#a38b6b" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />}

              {/* EWS ≥5 markers */}
              {markers.map(m => (
                <ReferenceLine key={`${m.idx}-${m.time}`} x={m.time} stroke="#999" strokeDasharray="4 4" opacity={0.6} />
              ))}

              <Tooltip
                formatter={(value: any, name: string) => {
                  const v = typeof value === "number" ? value : Number(value);
                  const unit = name === "SBP" ? "mmHg"
                              : name === "SpO₂" ? "%"
                              : name === "Temp" ? "°C"
                              : "bpm";
                  return [`${isFinite(v) ? v : value} ${unit}`, name];
                }}
                labelFormatter={(label: string) => `Time: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Brush dataKey="time" height={18} travellerWidth={12} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tiny footnote for marker semantics (optional, unobtrusive) */}
      <div className="mt-2 text-[11px] text-muted-foreground">
        Dashed lines indicate times where EWS ≥ 5.
      </div>
    </div>
  );
}