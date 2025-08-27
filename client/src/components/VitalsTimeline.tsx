import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Activity, Thermometer, HeartPulse, Waves, Droplets, ShieldAlert, TrendingUp, TrendingDown } from "lucide-react";
// Charts
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from "recharts";

// ---- Types (aligned with PatientCard + ews.ts) ----
export type ObsType = "HR" | "BP" | "Temp" | "RR" | "SpO2" | "GCS" | "Pain";
export interface Observation { id: string; type: ObsType; value: string; unit?: string; takenAt: string; recordedBy: string; phase?: "triage" | "obs"; }
export interface EwsPoint { t: string; score: number; delta?: number }
export interface LatestVitals { RR?: number; SpO2?: number; Temp?: number; SBP?: number; HR?: number; }

// Import your existing EWS function (adjust the path for your project)
import { calcEWSFromLatest } from "@/utils/ews";
import { computeEwsFromObservations } from "@/utils/monitoring";

// ---- Helpers ----
const parseNumber = (s?: string) => (s ? Number(String(s).replace(/[^0-9.\-]/g, "")) : NaN);
const getSBP = (bp?: string) => (bp ? parseNumber(bp.split("/")[0]) : NaN);

function toMinutes(ts: string) { return Math.floor(new Date(ts).getTime() / 60000); }
function fmtTime(ts: string) { return new Date(ts).toLocaleTimeString(); }

// Build a per-timestamp snapshot of vitals + EWS
function buildSeries(observations: Observation[]): { points: any[]; ews: EwsPoint[] } {
  const sorted = observations.slice().sort((a,b)=> a.takenAt.localeCompare(b.takenAt));
  const snapshots = new Map<number, { t: string; HR?: number; SBP?: number; Temp?: number; RR?: number; SpO2?: number; triage?: boolean }>();

  for (const o of sorted) {
    const key = toMinutes(o.takenAt); // minute granularity
    const snap = snapshots.get(key) ?? { t: o.takenAt };
    switch (o.type) {
      case "HR": snap.HR = parseNumber(o.value); break;
      case "BP": snap.SBP = getSBP(o.value); break;
      case "Temp": snap.Temp = parseNumber(o.value); break;
      case "RR": snap.RR = parseNumber(o.value); break;
      case "SpO2": snap.SpO2 = parseNumber(o.value); break;
    }
    if (o.phase === "triage") snap.triage = true;
    snapshots.set(key, snap);
  }

  // forward-fill missing values for chart continuity (does not mutate source data)
  const points = Array.from(snapshots.values()).sort((a,b)=> a.t.localeCompare(b.t));
  let last: LatestVitals = {};
  const ff = points.map(p => {
    last = { HR: p.HR ?? last.HR, SBP: p.SBP ?? last.SBP, Temp: p.Temp ?? last.Temp, RR: p.RR ?? last.RR, SpO2: p.SpO2 ?? last.SpO2 };
    return { ...p, ...last };
  });

  // compute EWS at each point where inputs exist
  const ews: EwsPoint[] = [];
  let prevScore: number | undefined = undefined;
  for (const p of ff) {
    const inputs = { RR: p.RR, SpO2: p.SpO2, Temp: p.Temp, SBP: p.SBP, HR: p.HR } as LatestVitals;
    const haveAll = [inputs.RR, inputs.SpO2, inputs.Temp, inputs.SBP, inputs.HR].every(v => typeof v === 'number' && isFinite(v as number));
    if (haveAll) {
      try {
        // Convert to format expected by monitoring system
        const obsArray = [
          { type: "HR" as const, value: String(inputs.HR), takenAt: p.t, recordedBy: "System", id: `hr-${p.t}` },
          { type: "RR" as const, value: String(inputs.RR), takenAt: p.t, recordedBy: "System", id: `rr-${p.t}` },
          { type: "SpO2" as const, value: String(inputs.SpO2), takenAt: p.t, recordedBy: "System", id: `spo2-${p.t}` },
          { type: "Temp" as const, value: String(inputs.Temp), takenAt: p.t, recordedBy: "System", id: `temp-${p.t}` },
          { type: "BP" as const, value: `${inputs.SBP}/80`, takenAt: p.t, recordedBy: "System", id: `bp-${p.t}` }
        ];
        const r = computeEwsFromObservations(obsArray);
        const d = prevScore === undefined ? undefined : r.score - prevScore;
        ews.push({ t: p.t, score: r.score, delta: d });
        prevScore = r.score;
      } catch (e) {
        ews.push({ t: p.t, score: NaN });
      }
    } else {
      ews.push({ t: p.t, score: NaN });
    }
  }

  return { points: ff, ews };
}

// ---- Component ----
export interface VitalsTimelineProps {
  observations: Observation[];
  arrival?: string; // to mark triage window if desired
  showChartDefault?: boolean;
}

export default function VitalsTimeline({ observations, arrival, showChartDefault = true }: VitalsTimelineProps) {
  const [showChart, setShowChart] = useState(showChartDefault);
  const [showHR, setShowHR] = useState(true);
  const [showSBP, setShowSBP] = useState(true);
  const [showTemp, setShowTemp] = useState(true);
  const [showRR, setShowRR] = useState(true);
  const [showSpO2, setShowSpO2] = useState(true);

  const { points, ews } = useMemo(() => buildSeries(observations), [observations]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/>Vitals Timeline</CardTitle>
          <div className="flex items-center gap-2">
            <Toggle pressed={showChart} onPressedChange={setShowChart} aria-label="Toggle chart">Chart</Toggle>
            <Separator orientation="vertical" className="h-5"/>
            <Toggle pressed={showHR} onPressedChange={setShowHR} aria-label="HR"><HeartPulse className="h-4 w-4"/></Toggle>
            <Toggle pressed={showSBP} onPressedChange={setShowSBP} aria-label="SBP"><ShieldAlert className="h-4 w-4"/></Toggle>
            <Toggle pressed={showTemp} onPressedChange={setShowTemp} aria-label="Temp"><Thermometer className="h-4 w-4"/></Toggle>
            <Toggle pressed={showRR} onPressedChange={setShowRR} aria-label="RR"><Waves className="h-4 w-4"/></Toggle>
            <Toggle pressed={showSpO2} onPressedChange={setShowSpO2} aria-label="SpO2"><Droplets className="h-4 w-4"/></Toggle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        {showChart && (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(t)=> new Date(t).toLocaleTimeString()} minTickGap={48} />
                <YAxis yAxisId="left" domain={[0, 'auto']} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} allowDecimals={false} />
                <Tooltip labelFormatter={(l)=> new Date(String(l)).toLocaleString()} formatter={(v: any, n: string)=> [v, n]} />
                <Legend />
                {showHR && <Line yAxisId="left" type="monotone" dataKey="HR" name="HR (bpm)" dot={false} />}
                {showSBP && <Line yAxisId="left" type="monotone" dataKey="SBP" name="SBP (mmHg)" dot={false} />}
                {showTemp && <Line yAxisId="right" type="monotone" dataKey="Temp" name="Temp (°C)" dot={false} />}
                {showRR && <Line yAxisId="left" type="monotone" dataKey="RR" name="RR (bpm)" dot={false} />}
                {showSpO2 && <Line yAxisId="right" type="monotone" dataKey="SpO2" name="SpO₂ (%)" dot={false} />}
                {/* Triage marker */}
                {arrival && (
                  <ReferenceLine
                    x={points.find(p=>p.triage)?.t ?? arrival}
                    stroke="#999"
                    strokeDasharray="3 3"
                    label={{ value: 'Triage', position: 'top' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div className="mt-4 rounded-md border">
          <div className="grid grid-cols-9 gap-2 px-3 py-2 text-xs font-semibold bg-muted/50">
            <div>Time</div>
            <div>HR</div>
            <div>SBP</div>
            <div>Temp</div>
            <div>RR</div>
            <div>SpO₂</div>
            <div>Source</div>
            <div>Recorder</div>
            <div>EWS Δ</div>
          </div>
          <ScrollArea className="max-h-80">
            <ul>
              {observations.slice().sort((a,b)=> b.takenAt.localeCompare(a.takenAt)).map(o => {
                // find EWS for the nearest snapshot at/after this time
                const near = ews.find(e => e.t === o.takenAt) ?? ews.find(e => new Date(e.t).getTime() >= new Date(o.takenAt).getTime());
                const delta = near?.delta;
                return (
                  <li key={o.id} className="grid grid-cols-9 gap-2 px-3 py-2 text-sm border-t">
                    <div>{fmtTime(o.takenAt)}{o.phase === 'triage' && <Badge className="ml-2">TRIAGE</Badge>}</div>
                    <div>{o.type==='HR' ? o.value : ''}</div>
                    <div>{o.type==='BP' ? o.value.split('/')[0] : ''}</div>
                    <div>{o.type==='Temp' ? o.value : ''}</div>
                    <div>{o.type==='RR' ? o.value : ''}</div>
                    <div>{o.type==='SpO2' ? o.value : ''}</div>
                    <div>{o.phase === 'triage' ? 'Triage' : 'Obs'}</div>
                    <div>{o.recordedBy}</div>
                    <div className="flex items-center gap-1">
                      {Number.isFinite(delta as number) ? (
                        delta! > 0 ? (<><TrendingUp className="h-3 w-3"/>+{delta}</>) : delta! < 0 ? (<><TrendingDown className="h-3 w-3"/>{delta}</>) : (<>0</>)
                      ) : '—'}
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}