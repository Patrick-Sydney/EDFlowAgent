import React, { useMemo, useState } from "react";
import { useJourneyStore, JourneyEvent } from "@/stores/journeyStore";
import clsx from "clsx";

type Props = { 
  patientId: string|number; 
  className?: string; 
  height?: number;
  showHeader?: boolean;
  showTypeChips?: boolean;
  showWindowChips?: boolean;
  /** Choose chrome style; "card" keeps its own border, "flat" removes it */
  chrome?: "card" | "flat";
  /** External filter mode for journey events */
  mode?: "All" | "Clinical" | "Moves";
  windowHours?: number;
};

const KIND_LABEL: Record<JourneyEvent["kind"], string> = {
  arrival: "Arrival", triage: "Triage", room_change: "Moved",
  vitals: "Obs", ews_change: "EWS",
  order: "Order", result: "Result", med_admin: "Med/Fluids",
  task: "Task", note: "Note", communication: "Comms", alert: "Alert",
};

const KIND_ICON: Record<JourneyEvent["kind"], string> = {
  arrival: "🟢", triage: "📝", room_change: "🚪",
  vitals: "💓", ews_change: "↗︎", order: "🧾", result: "🧪",
  med_admin: "💉", task: "⏱", note: "🗒", communication: "📣", alert: "⚠️",
};

export default function PatientJourneyInline({ 
  patientId, 
  className, 
  height = 320,
  showHeader = true,
  showTypeChips = true,
  showWindowChips = true,
  chrome = "card",
  mode = "All",
  windowHours = 8
}: Props) {
  const events = useJourneyStore(s => s.events); // Subscribe to live events
  const [windowH, setWindowH] = useState<4|8|24|72|0>(windowHours as any); // Use external windowHours
  const [filter, setFilter] = useState<"all"|JourneyEvent["kind"]>("all");
  const now = Date.now();
  const minT = windowH ? now - windowH * 3600_000 : 0;

  // Filter events for this patient
  const rows = useMemo(() => {
    return events.filter(e => e.patientId === String(patientId));
  }, [events, patientId]);

  const filtered = useMemo(() => {
    const clinicalKinds = new Set([
      "vitals","ews_change","order","result","med_admin","note","task","alert"
    ]);
    const moveKinds = new Set([
      "arrival","triage","room_change","room_assigned","encounter.location","communication"
    ]);

    let list = rows.filter(r => Date.parse(r.t) >= minT);
    
    // Apply external mode filter
    if (mode === "Clinical") {
      list = list.filter(r => clinicalKinds.has(r.kind));
    } else if (mode === "Moves") {
      list = list.filter(r => moveKinds.has(r.kind));
    }
    // "All" mode shows everything
    
    // Apply internal filter
    return filter === "all" ? list : list.filter(r => r.kind === filter);
  }, [rows, minT, filter, mode]);

  // group by hour bucket for simple visual grouping
  const grouped = useMemo(() => {
    const byKey: Record<string, JourneyEvent[]> = {};
    for (const r of filtered) {
      const d = new Date(r.t);
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:00`;
      (byKey[key] ||= []).push(r);
    }
    // preserve chronological order
    return Object.entries(byKey).sort((a,b) => Date.parse(a[0]) - Date.parse(b[0]));
  }, [filtered]);

  return (
    <section className={clsx(
      chrome === "card" ? "rounded-2xl border p-3" : "p-0",
      className
    )}>
      {showHeader && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Patient journey</div>
          {(showWindowChips || showTypeChips) && (
            <div className="flex items-center gap-1 flex-wrap">
              {showWindowChips && (
                <>
                  {[4,8,24,72].map(h => (
                    <button key={h} className={`rounded-full border px-2.5 py-1 text-xs ${windowH===h ? "bg-background shadow" : "opacity-80"}`} onClick={() => setWindowH(h as any)}>{h}h</button>
                  ))}
                  <button className={`rounded-full border px-2.5 py-1 text-xs ${windowH===0 ? "bg-background shadow" : "opacity-80"}`} onClick={() => setWindowH(0)}>All</button>
                </>
              )}
              {/* LEGACY FILTER BAR — hide it now that segmented filters are present */}
              {showTypeChips && false && (
            <>
              <div className="mx-2 h-4 w-px bg-border" />
              {["all","vitals","ews_change","order","result","med_admin","task","room_change","note","alert","communication","triage","arrival"].map(k => (
                <button key={k} className={`rounded-full border px-2.5 py-1 text-xs ${(filter===k) ? "bg-background shadow" : "opacity-80"}`} onClick={() => setFilter(k as any)}>{k === "all" ? "All" : KIND_LABEL[k as JourneyEvent["kind"]]}</button>
              ))}
            </>
              )}
            </div>
          )}
        </div>
      )}

      <div 
        className={chrome === "card" 
          ? "rounded-xl border h-[320px] md:h-[400px] overflow-auto p-3" 
          : "h-[320px] md:h-[400px] overflow-auto p-0 border-0 rounded-none"
        } 
        style={{height}}
      >
        {grouped.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">
            No events in the selected window.
          </div>
        ) : (
          <ol className="space-y-4">
            {grouped.map(([bucket, items]) => {
              const d = new Date(bucket);
              const bucketLabel = d.toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
              return (
                <li key={bucket}>
                  <div className="text-xs font-medium text-muted-foreground mb-1">{bucketLabel}</div>
                  <ul className="space-y-2">
                    {items.map(ev => {
                      const t = new Date(ev.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      return (
                        <li key={ev.id} className="flex items-start gap-3">
                          <div className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">{t}</div>
                          <div className="shrink-0 leading-6">{KIND_ICON[ev.kind] ?? "•"}</div>
                          <div className="grow">
                            <div className="text-sm">
                              <span className="font-medium">{KIND_LABEL[ev.kind] ?? ev.kind}</span>
                              <span className="ml-2">{ev.label}</span>
                            </div>
                            {ev.detail && <div className="text-xs text-muted-foreground">{ev.detail}</div>}
                          </div>
                          {ev.actor && typeof ev.actor === 'object' && 'role' in ev.actor && (ev.actor as any).role && <div className="text-xs text-muted-foreground shrink-0">{(ev.actor as any).role}</div>}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}