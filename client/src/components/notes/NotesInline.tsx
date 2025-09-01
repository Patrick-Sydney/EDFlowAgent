import React, { useMemo } from "react";
import { useJourney } from "../../stores/journeyStore";

export default function NotesInline({ patientId, onWriteNote }:{ patientId: string|number; onWriteNote: ()=>void; }) {
  const events = useJourney(patientId);
  const notes = useMemo(() => events.filter(e => e.kind === "note").sort((a,b)=> Date.parse(b.t)-Date.parse(a.t)), [events]);

  return (
    <div className="rounded-2xl border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Notes</div>
        <button onClick={onWriteNote} className="rounded-full px-3 py-1 text-sm bg-blue-600 text-white">Write note</button>
      </div>
      {notes.length === 0 ? (
        <div className="text-sm text-muted-foreground">No notes yet.</div>
      ) : (
        <ul className="space-y-2">
          {notes.slice(0,4).map(n => (
            <li key={n.id} className="rounded-lg border p-2">
              <div className="text-xs text-muted-foreground">{new Date(n.t).toLocaleString()}</div>
              <div className="text-sm">{n.detail ?? n.label}</div>
            </li>
          ))}
          {notes.length > 4 && <div className="text-xs text-muted-foreground">Showing latest {Math.min(4, notes.length)} of {notes.length}.</div>}
        </ul>
      )}
    </div>
  );
}