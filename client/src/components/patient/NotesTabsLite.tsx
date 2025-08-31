import React, { useState } from "react";

export default function NotesTabsLite({
  triageSummary, assessment, note, onEdit,
}: {
  triageSummary?: string | null;
  assessment?: string | null;
  note?: string | null;
  onEdit?: () => void;
}) {
  const [tab, setTab] = useState<"Triage" | "Assessment" | "Notes">("Triage");
  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="inline-flex gap-1 p-1 rounded-full bg-muted">
          {(["Triage","Assessment","Notes"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)}
              className={`px-3 py-1 rounded-full text-sm ${tab===t ? "bg-background shadow" : "opacity-70"}`}>
              {t}
            </button>
          ))}
        </div>
        <button className="rounded-full border px-3 py-1.5 text-sm" onClick={onEdit}>Edit</button>
      </div>
      <div className="p-3 text-sm text-muted-foreground min-h-[64px] whitespace-pre-wrap">
        {tab === "Triage" && (triageSummary || "—")}
        {tab === "Assessment" && (assessment || "—")}
        {tab === "Notes" && (note || "—")}
      </div>
    </div>
  );
}