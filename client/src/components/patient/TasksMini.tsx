import React from "react";
import { Timer } from "lucide-react";

export type TaskItem = {
  id: string;
  label: string;
  dueAt?: string | null;         // ISO time
  status?: "due" | "overdue" | "done";
};

export default function TasksMini({ tasks = [], onOpen }: { tasks?: TaskItem[]; onOpen?: () => void }) {
  if (!tasks.length) return null;
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Tasks</div>
        <button className="rounded-full border px-3 py-2 text-sm" onClick={onOpen}>Open board</button>
      </div>
      <div className="mt-2 space-y-1">
        {tasks.slice(0,5).map(t => {
          const badge =
            t.status === "overdue" ? "border-rose-500/40 text-rose-800 bg-rose-50" :
            t.status === "due"     ? "border-amber-500/40 text-amber-800 bg-amber-50" :
                                     "border border-muted text-muted-foreground";
          return (
            <div key={t.id} className="flex items-center justify-between">
              <div className="text-sm truncate">{t.label}</div>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${badge}`}>
                <Timer className="h-3 w-3"/>{t.dueAt ? new Date(t.dueAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "-"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}