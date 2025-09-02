// components/tasks/TaskList.tsx
import React, { useMemo } from "react";
import { useTaskStore } from "../../stores/taskStore";
import TaskItem from "./TaskItem";
import { Task, isOverdue } from "../../tasks/types";

type Props = {
  roleView: "RN" | "Charge" | "HCA";
  currentUserId?: string;
  filter?: {
    myTasks?: boolean;             // HCA "My Tasks"
    pool?: boolean;                // HCA "Unassigned"
    patientId?: string;            // per-patient list
    status?: Task["status"] | "overdue";
    kinds?: Task["kind"][];
  };
  onSelectPatient?: (patientId: string) => void;
};

export default function TaskList({ roleView, currentUserId, filter, onSelectPatient }: Props) {
  const list = useTaskStore(s => s.list);

  const tasks = useMemo(() => {
    const f: any = {};
    if (filter?.patientId) f.patientId = filter.patientId;
    if (filter?.status) f.status = filter.status;
    if (filter?.kinds) f.kinds = filter.kinds;

    let arr = list(f);

    // HCA dashboards
    if (roleView === "HCA") {
      if (filter?.myTasks) arr = arr.filter(t => t.assignedTo === currentUserId && t.status === "pending");
      if (filter?.pool) arr = arr.filter(t => !t.assignedTo && t.status === "pending");
    }

    // Sort: overdue first, then nearest due, then newest
    arr.sort((a, b) => {
      const aOver = isOverdue(a), bOver = isOverdue(b);
      if (aOver !== bOver) return aOver ? -1 : 1;
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return arr;
  }, [list, roleView, filter, currentUserId]);

  return (
    <div className="flex flex-col gap-2">
      {tasks.length === 0 && (
        <div className="text-sm text-slate-500 italic">No tasks here.</div>
      )}
      {tasks.map(t => (
        <TaskItem key={t.id} task={t} roleView={roleView} currentUserId={currentUserId} onSelectPatient={onSelectPatient} />
      ))}
    </div>
  );
}