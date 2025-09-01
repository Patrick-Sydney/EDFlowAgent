import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type Space = {
  id: string;
  label: string;          // e.g., "Resus1", "Room5", "OBS2", "ISO1", "LB3"
  type: "Resus" | "Cubicle" | "Observation" | "Isolation" | "Chair" | "Room";
  zone?: string;          // e.g., "Zone A", "Zone B"
  status?: "Available" | "Cleaning" | "Occupied" | "Blocked" | "Out of Service";
};

function defaultSpaces(): Space[] {
  const out: Space[] = [];
  // Dunedin baseline (per earlier spec)
  for (let i = 1; i <= 2; i++) out.push({ id: `RESUS${i}`, label: `Resus${i}`, type: "Resus", status: "Available" });
  for (let i = 1; i <= 10; i++) out.push({ id: `ROOM${i}`, label: `Room${i}`, type: "Cubicle", status: "Available" });
  for (let i = 1; i <= 8; i++) out.push({ id: `OBS${i}`, label: `OBS${i}`, type: "Observation", status: "Available" });
  for (let i = 1; i <= 2; i++) out.push({ id: `ISO${i}`, label: `ISO${i}`, type: "Isolation", status: "Available" });
  for (let i = 1; i <= 10; i++) out.push({ id: `LB${i}`, label: `LB${i}`, type: "Chair", status: "Available" });
  return out;
}

export default function AssignRoomPanel({
  patient,
  spaces = defaultSpaces(),
  onAssigned,
}: {
  patient: { id: string | number; name: string; ats?: number | null; isolationRequired?: boolean; currentLocationLabel?: string | null };
  spaces?: Space[];
  onAssigned: (space: Space) => void;
}) {
  const [status, setStatus] = useState<"All" | Space["status"]>("Available");
  const [type, setType] = useState<"All" | Space["type"]>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Space | null>(null);

  const types: ("All" | Space["type"])[] = ["All", "Resus", "Cubicle", "Observation", "Isolation", "Chair", "Room"];
  const statuses: ("All" | Space["status"])[] = ["All", "Available", "Cleaning", "Occupied", "Blocked", "Out of Service"];

  const filtered = useMemo(() => {
    return spaces
      .filter(s => status === "All" ? true : s.status === status)
      .filter(s => type === "All" ? true : s.type === type)
      .filter(s => (query ? s.label.toLowerCase().includes(query.toLowerCase()) : true))
      // Sort: Available first, then by type priority, then numeric label where possible
      .sort((a, b) => {
        const rankStatus = (x?: Space["status"]) => x === "Available" ? 0 : x === "Cleaning" ? 1 : x === "Occupied" ? 2 : x === "Blocked" ? 3 : 4;
        const rankType = (x: Space["type"]) => ({ Resus: 0, Isolation: 1, Cubicle: 2, Observation: 3, Chair: 4, Room: 5 } as const)[x];
        const rs = rankStatus(a.status) - rankStatus(b.status);
        if (rs !== 0) return rs;
        const rt = rankType(a.type) - rankType(b.type);
        if (rt !== 0) return rt;
        const num = (s: Space) => parseInt(s.label.replace(/[^\d]/g, "") || "0", 10);
        return num(a) - num(b);
      });
  }, [spaces, status, type, query]);

  return (
    <div className="space-y-3">
      {/* Patient summary */}
      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium">{patient.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {patient.currentLocationLabel ? <>Currently in <b>{patient.currentLocationLabel}</b> · </> : null}
          ATS {patient.ats ?? "—"} · {patient.isolationRequired ? "Isolation required" : "Isolation not required"}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border p-3 space-y-2">
        <div className="text-sm font-medium">Filter spaces</div>
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1 text-sm ${status === s ? "bg-background shadow" : "opacity-80"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full border px-3 py-1 text-sm ${type === t ? "bg-background shadow" : "opacity-80"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-md border pl-8 pr-2 py-2 text-sm"
            placeholder="Search label (e.g., OBS2, Room5)…"
            value={query}
            onChange={(e)=> setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Space grid */}
      <div className="rounded-xl border p-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map(s => {
            const isSelected = selected?.id === s.id;
            const disabled = s.status && s.status !== "Available";
            const badgeClass =
              s.status === "Available" ? "border-emerald-400/60 bg-emerald-50 text-emerald-800"
              : s.status === "Cleaning" ? "border-amber-400/60 bg-amber-50 text-amber-800"
              : s.status === "Occupied" ? "border-slate-300 bg-slate-50 text-slate-600"
              : s.status === "Blocked" ? "border-rose-400/60 bg-rose-50 text-rose-800"
              : "border-slate-300 bg-slate-50 text-slate-600";
            return (
              <button
                key={s.id}
                disabled={disabled}
                onClick={()=> setSelected(s)}
                className={`rounded-lg border p-3 text-left ${isSelected ? "ring-2 ring-blue-500" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50"}`}
                title={s.label}
              >
                <div className="font-medium">{s.label}</div>
                <div className={`mt-1 text-[11px] inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${badgeClass}`}>
                  {s.type} · {s.status ?? "—"}
                </div>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground text-center">No spaces match your filters.</div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2">
        <button className="rounded-full border px-4 py-2 text-sm" onClick={()=> setSelected(null)}>Clear</button>
        <button
          className="rounded-full px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          disabled={!selected}
          onClick={() => { if (selected) onAssigned(selected); }}
        >
          {patient.currentLocationLabel ? "Reassign room" : "Assign room"}
        </button>
      </div>
    </div>
  );
}