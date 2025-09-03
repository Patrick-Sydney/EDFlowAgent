import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import TaskBoard from "@/components/tasks/TaskBoard";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  roleView: "RN" | "Charge" | "HCA";
};

export default function TaskSheet({ open, onClose, roleView }: Props) {
  const [show, setShow] = useState(open);
  useEffect(() => setShow(open), [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={clsx(
        "relative w-full bg-white border-t shadow-2xl transition-transform duration-150",
        show ? "translate-y-0" : "translate-y-full",
        "max-h-[90vh]"
      )}>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="h-1.5 w-10 rounded-full bg-slate-300 md:hidden" />
          <div className="text-sm font-semibold">Tasks</div>
          <button onClick={onClose} className="px-3 py-1.5 rounded hover:bg-slate-100 text-sm">Close</button>
        </div>
        <div className="p-2 overflow-y-auto">
          <TaskBoard roleView={roleView} />
        </div>
      </div>
    </div>,
    document.body
  );
}