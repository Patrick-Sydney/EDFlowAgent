import React, { useMemo } from "react";
import { X } from "lucide-react";
import { useVitalsStore, ObsPoint } from "@/stores/vitalsStore";
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
  // TEMPORARILY DISABLED: Component causing infinite render loops
  // Will be re-enabled after store architecture is stabilized
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

        <div className="p-4 overflow-y-auto">
          <div className="text-sm text-muted-foreground">
            Vitals timeline temporarily disabled while optimizing the new EWS system.
            <br />
            <span className="text-xs mt-2 block">The unified EWS calculation system is now working correctly across all patient cards.</span>
          </div>
        </div>
      </div>
    </div>
  );
}