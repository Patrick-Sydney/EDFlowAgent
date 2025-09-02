// components/tasks/TaskCardSheet.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTaskStore } from "@/stores/taskStore";
import { Task } from "@/tasks/types";
import TaskKindIcon from "./TaskKindIcon";
import clsx from "clsx";

type PatientSummary = {
  id: string;
  displayName: string;
  age?: number | string;
  sex?: string;
  room?: string;
  ats?: string | number;
  ews?: string | number;
  arrivalTs?: string; // ISO
};

type Props = {
  /** The task we want to open */
  taskId: string;
  /** Close the sheet */
  onClose: () => void;
  /** Provide a patient summary fetcher; if undefined and task has no patient, that section is hidden */
  getPatientSummary?: (patientId: string) => PatientSummary | undefined;
  /** Optional: current user id (HCA/RN) for claim logic if you extend actions later */
  currentUserId?: string;
  /** Read-only (e.g., RN viewing) */
  readOnly?: boolean;
  /** Height percentage on desktop; default 0.55 (55%) */
  desktopHeightPct?: number;
};

export default function TaskCardSheet({
  taskId,
  onClose,
  getPatientSummary,
  currentUserId,
  readOnly = false,
  desktopHeightPct = 0.55,
}: Props) {
  // Grab task live from store
  const { tasks, complete, escalate } = useTaskStore(s => ({
    tasks: s.tasks,
    complete: s.complete,
    escalate: s.escalate,
  }));
  const task = tasks[taskId];

  // Derive patient summary if available
  const patient = useMemo<PatientSummary | undefined>(() => {
    if (!task?.patientId || !getPatientSummary) return undefined;
    return getPatientSummary(task.patientId);
  }, [task?.patientId, getPatientSummary]);

  // Local UI state
  const [show, setShow] = useState(true);
  const [escalating, setEscalating] = useState(false);
  const [note, setNote] = useState("");

  // Close with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!task) return null;

  const overdue =
    !!task.dueAt && task.status === "pending" && new Date(task.dueAt).getTime() < Date.now();

  function handleClose() {
    // small exit animation opportunity
    setShow(false);
    setTimeout(onClose, 140);
  }

  function onComplete() {
    if (readOnly) return;
    complete(task.id);
    handleClose();
  }

  function onEscalate() {
    if (readOnly) return;
    if (!note.trim()) return; // mandatory note
    escalate(task.id, note.trim());
    handleClose();
  }

  // Accessibility: focus trap basics
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    firstBtnRef.current?.focus();
  }, []);

  // Mount to body (portal)
  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      className={clsx(
        "fixed inset-0 z-[95]",
        "flex flex-col justify-end",
      )}
    >
      {/* Backdrop */}
      <div
        className={clsx(
          "absolute inset-0 bg-black/40 transition-opacity",
          show ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={clsx(
          "relative w-full bg-white shadow-2xl border-t",
          "transition-transform duration-150 ease-out",
          show ? "translate-y-0" : "translate-y-full",
          // height rules: desktop ~55%, tablet ~70%, mobile ~90%
          "max-h-[90vh]",
          "md:[--h:70vh]",
          "lg:[--h:calc(var(--pct,55)*1vh)]",
        )}
        style={
          {
            height: "min(90vh, 100%)",
            "--pct": `${desktopHeightPct * 100}`,
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-10 rounded-full bg-slate-300 mx-1 md:hidden" />
            <span className="inline-flex items-center gap-2 text-sm text-slate-600">
              <TaskKindIcon kind={task.kind} className="text-slate-600" />
              <span className="uppercase tracking-wide">{task.kind}</span>
            </span>
          </div>
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded hover:bg-slate-100 text-sm"
            aria-label="Close"
            ref={firstBtnRef}
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-lg font-semibold leading-tight">{task.label}</h2>
            {task.detail && <p className="text-sm text-slate-600 mt-1">{task.detail}</p>}
          </div>

          {/* Patient Summary */}
          {patient && (
            <section className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium">{patient.displayName}</span>
                {patient.age !== undefined && <span>• Age {patient.age}</span>}
                {patient.sex && <span>• {patient.sex}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-700">
                {patient.room && (
                  <span className="px-2 py-0.5 rounded bg-slate-100">Room {patient.room}</span>
                )}
                {patient.ats !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-slate-100">ATS {patient.ats}</span>
                )}
                {patient.ews !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-slate-100">EWS {patient.ews}</span>
                )}
                {patient.arrivalTs && (
                  <span className="px-2 py-0.5 rounded bg-slate-100">
                    Arrived {new Date(patient.arrivalTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Due & status */}
          <section className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded bg-slate-100">
              {task.dueAt
                ? `Due ${new Date(task.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "No due time"}
            </span>
            <span
              className={clsx(
                "px-2 py-0.5 rounded",
                overdue
                  ? "bg-red-100 text-red-700"
                  : task.status === "pending"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              {overdue ? "Overdue" : task.status}
            </span>
            {task.assignedTo && (
              <span className="px-2 py-0.5 rounded bg-slate-100">Assigned: {task.assignedTo}</span>
            )}
          </section>

          {/* Actions */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              disabled={readOnly || task.status !== "pending"}
              onClick={onComplete}
              className={clsx(
                "h-12 rounded-lg font-medium",
                readOnly || task.status !== "pending"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
              data-testid="button-complete-task"
            >
              Complete
            </button>

            {!escalating ? (
              <button
                disabled={readOnly || task.status !== "pending"}
                onClick={() => setEscalating(true)}
                className={clsx(
                  "h-12 rounded-lg font-medium border",
                  readOnly || task.status !== "pending"
                    ? "text-slate-400 border-slate-200 cursor-not-allowed"
                    : "text-red-600 border-red-400 hover:bg-red-50"
                )}
                data-testid="button-escalate-task"
              >
                Escalate
              </button>
            ) : (
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="block text-sm font-medium">Escalation note (required)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg p-2"
                  placeholder="What did you observe?"
                  data-testid="input-escalation-note"
                />
                <div className="flex gap-2">
                  <button
                    onClick={onEscalate}
                    disabled={readOnly || !note.trim()}
                    className={clsx(
                      "h-10 px-4 rounded-lg font-medium",
                      readOnly || !note.trim()
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    )}
                    data-testid="button-send-escalation"
                  >
                    Send escalation
                  </button>
                  <button
                    onClick={() => setEscalating(false)}
                    className="h-10 px-4 rounded-lg border"
                    data-testid="button-cancel-escalation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Spacer to avoid button overlap on small screens */}
          <div className="h-2" />
        </div>
      </div>
    </div>,
    document.body
  );
}