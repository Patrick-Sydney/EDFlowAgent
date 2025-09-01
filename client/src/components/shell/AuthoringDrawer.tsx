import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthPx?: number;   // desktop width
  dirty?: boolean;    // show discard guard if true
};

export default function AuthoringDrawer({
  title, open, onClose, children, widthPx = 920, dirty = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1100]">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/35"
        onClick={() => { if (!dirty || confirm("Discard changes?")) onClose(); }}
      />
      {/* Panel */}
      <div
        className="absolute right-0 top-0 h-full bg-background border-l shadow-2xl flex flex-col"
        style={{ width: Math.min(widthPx, window.innerWidth) }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="font-semibold">{title}</div>
          <button
            className="rounded-full p-2 hover:bg-muted"
            onClick={() => { if (!dirty || confirm("Discard changes?")) onClose(); }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3 overflow-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}