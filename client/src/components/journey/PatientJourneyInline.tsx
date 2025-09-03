import React, { useMemo, useState } from "react";
import { useJourney, JourneyEvent } from "../../stores/journeyStore";

type Props = { patientId: string|number; className?: string; height?: number; };

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

export default function PatientJourneyInline({ patientId, className, height = 320 }: Props) {
  const rows = useJourney(patientId);
  const [windowH, setWindowH] = useState<4|8|24|72|0>(8); // 0 = all
  const [filter, setFilter] = useState<"all"|JourneyEvent["kind"]>("all");
  const now = Date.now();
  const minT = windowH ? now - windowH * 3600_000 : 0;

  const filtered = useMemo(() => {
    const list = rows.filter(r => Date.parse(r.t) >= minT);
    return filter === "all" ? list : list.filter(r => r.kind === filter);
  }, [rows, minT, filter]);

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
    <div className={`rounded-2xl border p-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Patient journey</div>
        <div className="flex items-center gap-1 flex-wrap">
          {[4,8,24,72].map(h => (
            <button key={h} className={`rounded-full border px-2.5 py-1 text-xs ${windowH===h ? "bg-background shadow" : "opacity-80"}`} onClick={() => setWindowH(h as any)}>{h}h</button>
          ))}
          <button className={`rounded-full border px-2.5 py-1 text-xs ${windowH===0 ? "bg-background shadow" : "opacity-80"}`} onClick={() => setWindowH(0)}>All</button>
          {/* LEGACY FILTER BAR — hide it now that segmented filters are present */}
          {false && (
            <>
              <div className="mx-2 h-4 w-px bg-border" />
              {["all","vitals","ews_change","order","result","med_admin","task","room_change","note","alert","communication","triage","arrival"].map(k => (
                <button key={k} className={`rounded-full border px-2.5 py-1 text-xs ${(filter===k) ? "bg-background shadow" : "opacity-80"}`} onClick={() => setFilter(k as any)}>{k === "all" ? "All" : KIND_LABEL[k as JourneyEvent["kind"]]}</button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border h-[320px] md:h-[400px] overflow-auto p-3" style={{height}}>
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
                          {ev.actor?.role && <div className="text-xs text-muted-foreground shrink-0">{ev.actor.role}</div>}
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
    </div>
  );
}