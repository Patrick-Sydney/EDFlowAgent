// components/tasks/CreateTaskDrawer.tsx
import React, { useMemo, useState } from "react";
import { useTaskStore } from "../../stores/taskStore";
import { TaskKind } from "../../tasks/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  defaultPatientId?: string;
  defaultOrigin?: "RN" | "Charge";
};

const KIND_OPTIONS: { value: TaskKind; label: string }[] = [
  { value: "comfort", label: "Comfort" },
  { value: "hygiene", label: "Hygiene" },
  { value: "mobility", label: "Mobility" },
  { value: "escort", label: "Escort" },
  { value: "environment", label: "Environment" },
];

const DUE_PRESETS = [10, 15, 30, 60];

export default function CreateTaskDrawer({
  isOpen,
  onClose,
  defaultPatientId,
  defaultOrigin = "RN",
}: Props) {
  const upsert = useTaskStore((s) => s.upsert);
  const [kind, setKind] = useState<TaskKind>("comfort");
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [dueMins, setDueMins] = useState<number | "">("");
  const [assignTo, setAssignTo] = useState<string | undefined>(undefined);

  const dueAt = useMemo(() => {
    if (dueMins === "" || !Number.isFinite(Number(dueMins))) return undefined;
    const t = new Date();
    t.setMinutes(t.getMinutes() + Number(dueMins));
    return t.toISOString();
  }, [dueMins]);

  if (!isOpen) return null;

  const create = () => {
    if (!label.trim()) return;
    upsert({
      label: label.trim(),
      detail: detail.trim() || undefined,
      kind,
      patientId: defaultPatientId,
      dueAt,
      assignedTo: assignTo,
      origin: defaultOrigin,
      actorId: "current-user", // TODO: wire to auth/user store
    });
    // defer close to avoid nested updates during this render wave
    queueMicrotask(onClose);
  };

  return (
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between border-b cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onClose}
          data-testid="header-close-drawer"
        >
          <h2 className="text-lg font-semibold">New Task</h2>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="px-3 py-2 rounded hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
          {/* Kind grid chips */}
          <label className="block text-sm font-medium">Kind</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {KIND_OPTIONS.map((k) => (
              <button
                key={k.value}
                onClick={() => setKind(k.value)}
                className={`h-12 rounded-lg border text-sm ${
                  kind === k.value ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-100"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Label */}
          <label className="block mt-5 text-sm font-medium">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-2 w-full border rounded-lg p-3 h-12"
            placeholder="Assist to toilet"
            data-testid="input-task-label"
          />

          {/* Detail */}
          <label className="block mt-5 text-sm font-medium">Detail (optional)</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="mt-2 w-full border rounded-lg p-3"
            rows={4}
            placeholder="Add specifics or safety notes"
            data-testid="input-task-detail"
          />

          {/* Due quick-picks */}
          <label className="block mt-5 text-sm font-medium">Due</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DUE_PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => setDueMins(m)}
                className={`h-10 px-3 rounded-lg border text-sm ${
                  dueMins === m ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-100"
                }`}
              >
                {m} min
              </button>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={dueMins === "" ? "" : Number(dueMins)}
                onChange={(e) =>
                  setDueMins(e.target.value === "" ? "" : Number(e.target.value))
                }
                inputMode="numeric"
                min={0}
                className="h-10 w-24 border rounded-lg p-2"
                placeholder="Custom"
                data-testid="input-task-due"
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </div>

          {/* Assign */}
          <label className="block mt-5 text-sm font-medium">Assign (optional)</label>
          <input
            value={assignTo ?? ""}
            onChange={(e) => setAssignTo(e.target.value || undefined)}
            className="mt-2 w-full border rounded-lg p-3 h-12"
            placeholder="HCA user id or leave blank"
            data-testid="input-task-assign"
          />
        </div>

        {/* Sticky footer actions (touch-first) */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-3 flex gap-2">
          <button
            onClick={create}
            className="flex-1 h-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
            data-testid="button-create-task"
          >
            Create task
          </button>
          <button
            onClick={onClose}
            className="h-12 px-4 rounded-lg border font-medium"
            data-testid="button-cancel-task"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}