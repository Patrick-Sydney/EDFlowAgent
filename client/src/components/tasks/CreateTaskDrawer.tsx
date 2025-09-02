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

export default function CreateTaskDrawer({ isOpen, onClose, defaultPatientId, defaultOrigin = "RN" }: Props) {
  const upsert = useTaskStore(s => s.upsert);
  const [kind, setKind] = useState<TaskKind>("comfort");
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [dueMins, setDueMins] = useState<number | "">("");
  const [assignTo, setAssignTo] = useState<string | undefined>(undefined);

  const dueAt = useMemo(() => {
    if (dueMins === "" || !Number.isFinite(Number(dueMins))) return undefined;
    const t = new Date(); t.setMinutes(t.getMinutes() + Number(dueMins)); return t.toISOString();
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
      actorId: "current-user", // TODO: wire actual user id
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Task</h2>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded hover:bg-slate-100" data-testid="button-close-task">Close</button>
        </div>

        <label className="block mt-4 text-sm font-medium">Kind</label>
        <select value={kind} onChange={e => setKind(e.target.value as TaskKind)} className="mt-1 w-full border rounded p-2" data-testid="select-task-kind">
          {KIND_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>

        <label className="block mt-4 text-sm font-medium">Label</label>
        <input value={label} onChange={e => setLabel(e.target.value)} className="mt-1 w-full border rounded p-2" placeholder="Assist to toilet" data-testid="input-task-label" />

        <label className="block mt-4 text-sm font-medium">Detail (optional)</label>
        <textarea value={detail} onChange={e => setDetail(e.target.value)} className="mt-1 w-full border rounded p-2" rows={3} placeholder="Add specifics or safety notes" data-testid="input-task-detail" />

        <label className="block mt-4 text-sm font-medium">Due in (minutes)</label>
        <input value={dueMins} onChange={e => setDueMins(e.target.value === "" ? "" : Number(e.target.value))} type="number" min={0} className="mt-1 w-full border rounded p-2" placeholder="e.g. 15" data-testid="input-task-due" />

        {/* TODO: replace with staff picker once users are modeled */}
        <label className="block mt-4 text-sm font-medium">Assign (optional)</label>
        <input value={assignTo ?? ""} onChange={e => setAssignTo(e.target.value || undefined)} className="mt-1 w-full border rounded p-2" placeholder="HCA user id or leave blank" data-testid="input-task-assign" />

        <div className="mt-6 flex gap-2">
          <button onClick={create} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" data-testid="button-create-task">Create task</button>
          <button onClick={onClose} className="px-4 py-2 rounded border" data-testid="button-cancel-task">Cancel</button>
        </div>
      </div>
    </div>
  );
}