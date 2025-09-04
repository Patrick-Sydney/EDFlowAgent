import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;              // e.g. 520 or "32rem"
  children: React.ReactNode;
  headerClickableToClose?: boolean;     // default true (tap header to close)
  closeOnBackdrop?: boolean;            // default true
  closeOnEsc?: boolean;                 // default true
  className?: string;                   // extra classes for panel
};

export default function RightDrawer({
  open,
  onClose,
  title,
  width = 520,
  children,
  headerClickableToClose = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [dragX, setDragX] = useState(0);          // swipe-to-close (px)
  const startX = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => (closeOnEsc && e.key === "Escape") && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";      // lock scroll
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open, closeOnEsc, onClose]);

  // touch swipe handlers (drag to the right to close)
  const onTouchStart: React.TouchEventHandler = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchMove: React.TouchEventHandler = (e) => {
    if (startX.current == null) return;
    const dx = startX.current - e.touches[0].clientX;   // >0 = moving right-to-left; we want left-to-right to close
    const closeDx = -dx;                                 // convert so positive = closing
    setDragX(Math.max(0, Math.min(closeDx, 200)));       // clamp
  };
  const onTouchEnd: React.TouchEventHandler = () => {
    if (dragX > 80) onClose();                           // threshold to close
    setDragX(0);                                         // snap back
    startX.current = null;
  };

  if (!mounted) return null;
  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-[98] flex justify-end pointer-events-none",
        // backdrop fade (motion-safe to respect prefers-reduced-motion)
        open ? "motion-safe:bg-black/40 bg-black/20" : "bg-transparent",
        "transition-colors duration-200"
      )}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <div
        className={clsx("absolute inset-0 pointer-events-auto", open ? "cursor-pointer" : "pointer-events-none")}
        onClick={() => closeOnBackdrop && onClose()}
      />
      {/* panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Drawer"}
        className={clsx(
          "relative h-full bg-white border-l shadow-2xl pointer-events-auto flex flex-col",
          "will-change-transform motion-safe:transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          transform: `translateX(${open ? 0 : 100}%) translateX(${dragX}px)`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* header (tap to close on touch) */}
        <header
          className={clsx(
            "sticky top-0 px-4 py-3 border-b bg-white",
            headerClickableToClose && "cursor-pointer select-none hover:bg-gray-50 transition-colors"
          )}
          onClick={() => headerClickableToClose && onClose()}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold truncate">{title}</div>
            <button
              type="button"
              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
              aria-label="Close"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body
  );
}