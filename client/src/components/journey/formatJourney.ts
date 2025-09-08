import type { JourneyEvent } from "@/stores/journeyStore";

export function formatJourneyLine(ev: JourneyEvent): { title: string; meta?: string } {
  // Default title
  let title = ev.label || prettyKind(ev.kind);
  let meta: string | undefined;

  switch (ev.kind) {
    case "vitals": {
      const d: any = ev.detail || {};
      // compact vitals summary
      const parts: string[] = [];
      if (isNum(d.rr))  parts.push(`RR ${d.rr}`);
      if (isNum(d.hr))  parts.push(`HR ${d.hr}`);
      if (isNum(d.sbp)) parts.push(`SBP ${d.sbp}`);
      if (isNum(d.spo2))parts.push(`SpO₂ ${d.spo2}%`);
      if (isNum(d.temp))parts.push(`Temp ${d.temp}°C`);
      const ews = isNum(d.ews) ? ` (EWS ${d.ews})` : "";
      title = ev.label || "Obs";
      meta = parts.join(" · ") + ews;
      break;
    }
    case "ews_change": {
      // label already has "EWS a → b"
      title = ev.label || "EWS change";
      break;
    }
    case "task": {
      const d: any = ev.detail || {};
      title = `Task: ${d.kind ?? ""}`.trim();
      meta = [d.status, d.assigneeRole].filter(Boolean).join(" · ") || undefined;
      break;
    }
    case "order":
    case "result":
    case "med_admin":
    case "note":
    case "communication":
    case "room_change":
    case "triage":
    case "arrival":
    case "alert":
    case "assessment_nursing":
    case "monitoring_start":
    case "monitoring_update":
    case "monitoring_stop":
    case "disposition_set":
    default: {
      // prefer string label; only show detail if it's a string
      const d = ev.detail;
      if (!title && typeof d === "string") title = d;
      if (typeof d === "string") meta = d;
      break;
    }
  }
  return { title: title || prettyKind(ev.kind), meta };
}

function prettyKind(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
const isNum = (n: any) => typeof n === "number" && Number.isFinite(n);