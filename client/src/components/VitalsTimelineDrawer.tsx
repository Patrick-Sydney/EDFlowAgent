import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useObsStore } from "@/state/observations";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================
export type ObsPoint = {
  t: string;              // ISO datetime
  rr?: number;            // /min
  spo2?: number;          // %
  hr?: number;            // bpm
  sbp?: number;           // mmHg (systolic); (optionally include dbp)
  temp?: number;          // °C
  ews?: number;           // derived score at t
  source?: 'triage' | 'obs' | 'device';
};

export type BundleEvent = {
  t: string;                       // ISO datetime
  type: 'abx' | 'fluids' | 'cultures' | 'lactate' | 'review' | 'alert';
  label?: string;                  // optional custom label
};

export type TimelineData = {
  points: ObsPoint[];
  events?: BundleEvent[];
};

// ============================================================================
// HOOK — useVitalsTimeline(patientId)
// - Uses React Query to fetch observations with proper cache management
// - Provides refresh() via React Query invalidation
// ============================================================================
export function useVitalsTimeline(patientId: string) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<TimelineData>({ points: [], events: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setTimelineData({ points: [], events: [] });
      setIsLoading(false);
      return;
    }

    // Check Zustand store first
    const obsFromStore = useObsStore.getState().byPatient[patientId];
    if (obsFromStore?.length) {
      setTimelineData({ points: obsFromStore, events: timelineData.events || [] });
      setIsLoading(false);
      return;
    }

    // Fallback to API if no data in store
    setIsLoading(true);
    fetch(`/api/observations?patientId=${encodeURIComponent(patientId)}`)
      .then(response => response.json())
      .then(rawData => {
        // Normalize API data to ObsPoint format
        const pts: ObsPoint[] = [];
        if (Array.isArray(rawData)) {
          rawData.forEach((o: any) => {
            const t = o.takenAt || o.t || o.time;
            if (!t) return;
            pts.push({
              t: new Date(t).toISOString(),
              rr: o.value && o.type === 'RR' ? parseInt(o.value) : o.rr,
              spo2: o.value && o.type === 'SpO2' ? parseInt(o.value) : o.spo2,
              hr: o.value && o.type === 'HR' ? parseInt(o.value) : o.hr,
              sbp: o.value && o.type === 'BP' ? parseInt(o.value.split('/')[0]) : o.sbp,
              temp: o.value && o.type === 'Temp' ? parseFloat(o.value) : o.temp,
              ews: o.ews,
              source: o.source || 'obs',
            });
          });
        }
        pts.sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
        setTimelineData({ points: pts, events: [] });
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [patientId]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/observations', patientId] });
  };

  return { 
    points: timelineData.points, 
    events: timelineData.events, 
    loading: isLoading, 
    error, 
    refresh 
  };
}

// ============================================================================
// CHART — VitalsTimelineChart
// - Calm palette; light grid; event markers for sepsis bundle steps
// - Stacks per-vital mini charts for clarity on mobile
// ============================================================================
function formatTime(ts: string) { const d = new Date(ts); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function MiniChart({ data, yKey, unit, yDomain }: { data: ObsPoint[]; yKey: keyof ObsPoint; unit: string; yDomain?: [number, number] }) {
  return (
    <div className="h-28 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tickFormatter={formatTime} minTickGap={24} tick={{ fontSize: 11 }} />
          <YAxis domain={yDomain || ["auto", "auto"]} width={36} tick={{ fontSize: 11 }} tickFormatter={(v)=> `${v}`}/>
          <Tooltip labelFormatter={(l)=> formatTime(String(l))} formatter={(v)=> [`${v} ${unit}`, unit.replace(/.*/, '')]} />
          <Line type="monotone" dataKey={yKey as any} dot={{ r: 2 }} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VitalsTimelineChart({ points, events = [] }: { points: ObsPoint[]; events?: BundleEvent[]; }) {
  const has = (k: keyof ObsPoint) => points.some((p) => typeof p[k] === 'number');
  const data = points; // already sorted

  return (
    <div className="space-y-3">
      {/* RR */}
      {has('rr') && <MiniChart data={data} yKey="rr" unit="/m" yDomain={[6, 40]} />}
      {/* SpO2 */}
      {has('spo2') && <MiniChart data={data} yKey="spo2" unit="%" yDomain={[80, 100]} />}
      {/* HR */}
      {has('hr') && <MiniChart data={data} yKey="hr" unit="bpm" yDomain={[40, 160]} />}
      {/* SBP */}
      {has('sbp') && <MiniChart data={data} yKey="sbp" unit="mmHg" yDomain={[70, 200]} />}
      {/* Temp */}
      {has('temp') && <MiniChart data={data} yKey="temp" unit="°C" yDomain={[34, 41]} />}

      {/* Event markers row (vertical lines across all charts) */}
      {events?.length ? (
        <div className="pt-1">
          <div className="text-xs text-muted-foreground mb-1">Bundle events</div>
          <div className="flex flex-wrap gap-2">
            {events.map((e, i) => (
              <span key={i} className="rounded-full border px-2 py-0.5 text-xs">
                {new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {e.label || e.type}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// DRAWER — VitalsTimelineDrawer (mobile-first full screen)
// ============================================================================
export function VitalsTimelineDrawer({ open, onOpenChange, patientId, patientName, onAddObs }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  patientId: string; patientName?: string;
  onAddObs?: () => void;
}) {
  const { points, events, loading, error, refresh } = useVitalsTimeline(patientId);

  // Auto-refresh when drawer opens to ensure latest data
  React.useEffect(() => {
    if (open && patientId) {
      refresh();
    }
  }, [open, patientId, refresh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[100vw] w-[100vw] sm:max-w-[720px] sm:rounded-2xl rounded-none h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base">Vitals timeline{patientName ? ` — ${patientName}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-3 flex items-center gap-2">
          <Button size="sm" className="rounded-full" onClick={onAddObs}>+ Obs</Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={refresh}>Refresh</Button>
        </div>

        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-28 w-full"/>
              <Skeleton className="h-28 w-full"/>
              <Skeleton className="h-28 w-full"/>
            </div>
          ) : error ? (
            <div className="py-6 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {error}</div>
          ) : points.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">
              No observations yet. Use <b>+ Obs</b> to add the first set and then <b>Refresh</b>.
            </div>
          ) : (
            <div className="pb-6">
              <VitalsTimelineChart points={points} events={events} />
            </div>
          )}
        </ScrollArea>

        <div className="sticky bottom-0 w-full p-4 border-t bg-background">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}