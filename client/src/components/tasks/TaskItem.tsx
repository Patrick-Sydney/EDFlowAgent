// components/tasks/TaskItem.tsx
import React from "react";
import { Task, isOverdue } from "../../tasks/types";
import { useTaskStore } from "../../stores/taskStore";
import clsx from "clsx";

type Props = {
  task: Task;
  roleView: "RN" | "Charge" | "HCA";
  currentUserId?: string;
  compact?: boolean;
  onSelectPatient?: (patientId: string) => void;
};

export default function TaskItem({ task, roleView, currentUserId, compact = false, onSelectPatient }: Props) {
  const { claim, complete, escalate, assign } = useTaskStore(s => ({
    claim: s.claim, complete: s.complete, escalate: s.escalate, assign: s.assign
  }));

  const overdue = isOverdue(task);
  const dueLabel = task.dueAt ? new Date(task.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className={clsx(
      "rounded-lg border p-3 flex items-start gap-3",
      overdue && roleView !== "HCA" ? "border-red-400" : overdue ? "border-amber-400" : "border-slate-200"
    )}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm px-2 py-0.5 rounded bg-slate-100">{task.kind}</span>
          {task.patientId && (
            <button className="text-xs text-blue-700 hover:underline"
              onClick={() => task.patientId && onSelectPatient?.(task.patientId)}
              data-testid={`button-select-patient-${task.patientId}`}>
              Patient: {task.patientId}
            </button>
          )}
          <span className={clsx("ml-auto text-xs px-2 py-0.5 rounded",
            overdue ? (roleView !== "HCA" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")
                    : "bg-slate-100 text-slate-700")}>
            {task.status === "pending" ? (overdue ? "Overdue" : `Due ${dueLabel}`) : task.status}
          </span>
        </div>
        <div className="mt-1 font-medium">{task.label}</div>
        {task.detail && <div className="text-sm text-slate-600 mt-0.5">{task.detail}</div>}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        {roleView === "HCA" && task.status === "pending" && (
          <>
            {!task.assignedTo && (
              <button onClick={() => claim(task.id, currentUserId!)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200" data-testid={`button-claim-task-${task.id}`}>
                Claim
              </button>
            )}
            {(!task.assignedTo || task.assignedTo === currentUserId) && (
              <>
                <button onClick={() => complete(task.id)} className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700" data-testid={`button-complete-task-${task.id}`}>
                  Complete
                </button>
                <button onClick={() => {
                  const note = prompt("Escalation note (what did you observe)?") ?? undefined;
                  escalate(task.id, note);
                }} className="text-xs px-2 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50" data-testid={`button-escalate-task-${task.id}`}>
                  Escalate
                </button>
              </>
            )}
          </>
        )}
        {(roleView === "RN" || roleView === "Charge") && task.status === "pending" && (
          <>
            <button onClick={() => {
              const uid = prompt("Assign to HCA user id (leave empty to unassign)") || undefined;
              assign(task.id, uid || undefined);
            }} className="text-xs px-2 py-1 rounded border hover:bg-slate-50" data-testid={`button-assign-task-${task.id}`}>
              Assign
            </button>
          </>
        )}
      </div>
    </div>
  );
}