// stores/taskStore.ts
import { create } from "zustand";
import { nanoid } from "nanoid";
import { Task } from "../tasks/types";
import { journeyStore } from "@/stores/journeyStore";

type TaskFilter = {
  assignedTo?: string;
  patientId?: string;
  status?: Task["status"] | "overdue";
  kinds?: Task["kind"][];
};

type TaskState = {
  tasks: Record<string, Task>;
  // CRUD
  upsert: (input: Omit<Task, "id" | "createdAt" | "status"> & { id?: string; status?: Task["status"] }) => string;
  setStatus: (id: string, status: Task["status"]) => void;
  assign: (id: string, hcaUserId?: string) => void;
  claim: (id: string, hcaUserId: string) => void;
  escalate: (id: string, note?: string) => void;
  complete: (id: string, note?: string) => void;
  list: (filter?: TaskFilter) => Task[];
  hydrateFromCache: () => void;
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: {},

  upsert: (input) => {
    const id = input.id ?? nanoid();
    const createdAt = new Date().toISOString();
    const task: Task = {
      id,
      label: input.label,
      detail: input.detail,
      kind: input.kind,
      patientId: input.patientId,
      dueAt: input.dueAt,
      assignedTo: input.assignedTo,
      origin: input.origin,
      actorId: input.actorId,
      createdAt,
      status: input.status ?? "pending",
    };
    set(s => ({ tasks: { ...s.tasks, [id]: task } }));
    // persist minimal
    localStorage.setItem("edflow.tasks", JSON.stringify(get().tasks));
    return id;
  },

  setStatus: (id, status) => {
    set(s => ({ tasks: { ...s.tasks, [id]: { ...s.tasks[id], status } } }));
    localStorage.setItem("edflow.tasks", JSON.stringify(get().tasks));
  },

  assign: (id, hcaUserId) => {
    set(s => ({ tasks: { ...s.tasks, [id]: { ...s.tasks[id], assignedTo: hcaUserId } } }));
    localStorage.setItem("edflow.tasks", JSON.stringify(get().tasks));
  },

  claim: (id, hcaUserId) => {
    get().assign(id, hcaUserId);
  },

  escalate: (id, note) => {
    const { tasks } = get(); const t = tasks[id]; if (!t) return;
    journeyStore.add(t.patientId ?? "", {
      kind: "alert",
      label: `HCA escalated: ${t.label}`,
      detail: note ?? t.detail,
    });
    get().setStatus(id, "escalated");
  },

  complete: (id, note) => {
    const { tasks } = get(); const t = tasks[id]; if (!t) return;
    journeyStore.add(t.patientId ?? "", {
      kind: "task",
      label: `HCA task completed: ${t.label}`,
      detail: note ?? t.detail,
    });
    get().setStatus(id, "done");
  },

  list: (filter) => {
    const arr = Object.values(get().tasks);
    if (!filter) return arr;
    return arr.filter(t => {
      if (filter.assignedTo && t.assignedTo !== filter.assignedTo) return false;
      if (filter.patientId && t.patientId !== filter.patientId) return false;
      if (filter.status) {
        if (filter.status === "overdue") {
          const overdue = t.dueAt ? new Date(t.dueAt).getTime() < Date.now() && t.status === "pending" : false;
          if (!overdue) return false;
        } else if (t.status !== filter.status) return false;
      }
      if (filter.kinds && !filter.kinds.includes(t.kind)) return false;
      return true;
    });
  },

  hydrateFromCache: () => {
    try {
      const cached = localStorage.getItem("edflow.tasks");
      if (!cached) return;
      const parsed = JSON.parse(cached);
      const now = get().tasks;
      // shallow compare to avoid unnecessary set (prevents render churn)
      const same = Object.keys(parsed).length === Object.keys(now).length &&
        Object.keys(parsed).every(id => now[id]);
      if (same) return;
      set({ tasks: parsed });
    } catch { /* noop */ }
  },
}));