import React, { useState } from "react";
import { journeyStore } from "../../stores/journeyStore";

export default function NotesDrawer({ patientId, onSaved }:{ patientId: string|number; onSaved?: ()=>void; }) {
  const [text, setText] = useState("");
  const [addToJourney, setAddToJourney] = useState(true);
  const [tag, setTag] = useState<"Nursing"|"Medical"|"Handover"|"Discharge">("Nursing");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">New note</div>
      <div className="flex items-center gap-2">
        {(["Nursing","Medical","Handover","Discharge"] as const).map(t => (
          <button key={t} className={`rounded-full border px-3 py-1 text-sm ${t===tag?"bg-background shadow":""}`} onClick={()=>setTag(t)}>{t}</button>
        ))}
      </div>
      <textarea className="w-full rounded-xl border p-3 min-h-[160px]" placeholder="Type your note…" value={text} onChange={e=>setText(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={addToJourney} onChange={e=>setAddToJourney(e.target.checked)} />
        Add to patient journey
      </label>
      <div className="flex items-center justify-end gap-2">
        <button className="rounded-full border px-4 py-2 text-sm" onClick={()=>setText("")}>Clear</button>
        <button disabled={saving || !text.trim()} className="rounded-full px-4 py-2 text-sm text-white bg-blue-600 disabled:opacity-50"
          onClick={()=>{
            setSaving(true);
            const label = text.trim().slice(0,80);
            if (addToJourney) {
              journeyStore.add(String(patientId), {
                kind: "note",
                label: label || "Note",
                detail: text.trim(),
                actor: { role: tag==="Nursing"?"RN": tag==="Medical"?"MD":"Clerk" }
              });
            }
            setSaving(false);
            onSaved?.();
          }}>Save note</button>
      </div>
    </div>
  );
}