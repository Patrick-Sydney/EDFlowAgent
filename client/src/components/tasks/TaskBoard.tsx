// components/tasks/TaskBoard.tsx
import React, { useEffect, useState } from "react";
import TaskList from "./TaskList";
import CreateTaskDrawer from "./CreateTaskDrawer";
import { useTaskStore } from "../../stores/taskStore";

type Props = {
  roleView: "RN" | "Charge" | "HCA";
  currentUserId?: string;
  onSelectPatient?: (patientId: string) => void;
  onSelectTaskId?: (taskId: string) => void;
};

export default function TaskBoard({ roleView, currentUserId = "hca-1", onSelectPatient, onSelectTaskId }: Props) {
  const hydrate = useTaskStore(s => s.hydrateFromCache);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"mine" | "pool" | "all" | "overdue" | "escalated" | "done">(
    roleView === "HCA" ? "pool" : "all"
  );

  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
        {(roleView === "RN" || roleView === "Charge") && (
          <button onClick={() => setOpen(true)} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" data-testid="button-new-task">
            New Task
          </button>
        )}
      </header>

      <nav className="flex gap-2">
        {roleView === "HCA" ? (
          <>
            <TabBtn id="mine" tab={tab} setTab={setTab} label="My Tasks" />
            <TabBtn id="pool" tab={tab} setTab={setTab} label="Unassigned" />
            <TabBtn id="done" tab={tab} setTab={setTab} label="Done (today)" />
          </>
        ) : (
          <>
            <TabBtn id="all" tab={tab} setTab={setTab} label="All" />
            <TabBtn id="overdue" tab={tab} setTab={setTab} label="Overdue" />
            <TabBtn id="escalated" tab={tab} setTab={setTab} label="Escalated" />
            <TabBtn id="done" tab={tab} setTab={setTab} label="Done (24h)" />
          </>
        )}
      </nav>

      <section>
        {roleView === "HCA" && tab === "mine" && (
          <TaskList roleView="HCA" currentUserId={currentUserId} filter={{ myTasks: true }} onSelectPatient={onSelectPatient} onSelectTaskId={onSelectTaskId} />
        )}
        {roleView === "HCA" && tab === "pool" && (
          <TaskList roleView="HCA" currentUserId={currentUserId} filter={{ pool: true }} onSelectPatient={onSelectPatient} onSelectTaskId={onSelectTaskId} />
        )}
        {roleView === "HCA" && tab === "done" && (
          <TaskList roleView="HCA" currentUserId={currentUserId} filter={{ status: "done" }} onSelectPatient={onSelectPatient} onSelectTaskId={onSelectTaskId} />
        )}

        {(roleView === "RN" || roleView === "Charge") && tab === "all" && (
          <TaskList roleView={roleView} onSelectPatient={onSelectPatient} onSelectTaskId={onSelectTaskId} />
        )}
        {(roleView === "RN" || roleView === "Charge") && tab === "overdue" && (
          <TaskList roleView={roleView} filter={{ status: "overdue" }} onSelectPatient={onSelectPatient} onSelectTaskId={onSelectTaskId} />
        )}
        {(roleView === "RN" || roleView === "Charge") && tab === "escalated" && (
          <TaskList roleView={roleView} filter={{ status: "escalated" }} onSelectPatient={onSelectPatient} onSelectTaskId={onSelectTaskId} />
        )}
        {(roleView === "RN" || roleView === "Charge") && tab === "done" && (
          <TaskList roleView={roleView} filter={{ status: "done" }} onSelectPatient={onSelectPatient} onSelectTaskId={onSelectTaskId} />
        )}
      </section>

      <CreateTaskDrawer isOpen={open} onClose={() => setOpen(false)} defaultOrigin={roleView === "Charge" ? "Charge" : "RN"} />
    </div>
  );
}

function TabBtn<T extends string>({ id, tab, setTab, label }:{
  id: T; tab: T; setTab: (t: T) => void; label: string;
}) {
  const active = id === tab;
  return (
    <button onClick={() => setTab(id)} className={`px-3 py-1.5 rounded border ${active ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-100"}`} data-testid={`tab-${id}`}>
      {label}
    </button>
  );
}