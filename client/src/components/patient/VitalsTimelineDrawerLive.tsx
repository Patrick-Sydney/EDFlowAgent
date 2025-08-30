import React from "react";
import { X } from "lucide-react";
import { useVitalsList, vitalsStore, ObsPoint } from "../../stores/vitalsStore";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MiniChart({ data, dataKey, yDomain, unit }: {
  data: ObsPoint[]; dataKey: keyof ObsPoint; yDomain: [number, number]; unit: string;
}) {
  return (
    <div className="h-28 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tickFormatter={formatTime} minTickGap={24} tick={{ fontSize: 11 }} />
          <YAxis domain={yDomain} width={36} tick={{ fontSize: 11 }} />
          <Tooltip labelFormatter={(l) => formatTime(String(l))} formatter={(v) => [`${v} ${unit}`, unit]} />
          <Line type="monotone" dataKey={dataKey as any} dot={{ r: 2 }} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VitalsTimelineDrawerLive({
  open, onOpenChange, patientId, patientName, onAddObs,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  patientId: string | number; patientName?: string;
  onAddObs?: () => void;
}) {
  const points = useVitalsList(patientId);
  const has = (k: keyof ObsPoint) => points.some(p => typeof p[k] === "number");

  async function importFromServer() {
    try {
      const res = await fetch(`/api/observations?patientId=${patientId}`);
      if (res.ok) {
        const json = await res.json();
        const items: ObsPoint[] =
          json?.observations || json?.points || Array.isArray(json) ? (json.observations ?? json.points ?? json) : [];
        vitalsStore.bulkUpsert(patientId, items);
      }
    } catch {}
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/20">
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto sm:max-w-[720px] sm:h-[90vh] bg-background rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-base font-semibold">Vitals timeline — {patientName ?? ""}</div>
          <button aria-label="Close" onClick={() => onOpenChange(false)} className="p-2 rounded-full hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-2 flex items-center gap-2 border-b">
          {onAddObs && <button className="rounded-full bg-primary text-primary-foreground px-3 py-2 text-sm" onClick={onAddObs}>+ Obs</button>}
          <button className="rounded-full border px-3 py-2 text-sm" onClick={importFromServer}>Import</button>
        </div>

        <div className="p-4 overflow-y-auto">
          {points.length === 0 ? (
            <div className="text-sm text-muted-foreground">No observations yet.</div>
          ) : (
            <div className="space-y-3">
              {has("rr")   && <MiniChart data={points} dataKey="rr"   yDomain={[6,40]}   unit="/m"   />}
              {has("spo2") && <MiniChart data={points} dataKey="spo2" yDomain={[80,100]} unit="%"    />}
              {has("hr")   && <MiniChart data={points} dataKey="hr"   yDomain={[40,160]} unit="bpm"  />}
              {has("sbp")  && <MiniChart data={points} dataKey="sbp"  yDomain={[70,200]} unit="mmHg" />}
              {has("temp") && <MiniChart data={points} dataKey="temp" yDomain={[34,41]}  unit="°C"    />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}