import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * BoardExpandOverlay
 * - Animates a card from its on-board position to a floating panel sized to ~2 lane widths.
 * - Uses a FLIP-style transform for smooth expand/contract.
 * - Desktop only; callers should gate with a media query check.
 *
 * Assumptions:
 * - Each lane column has className "lane-col" (width is measured from the first one).
 * - Horizontal lane gap approximated from computed styles.
 */
export default function BoardExpandOverlay({
  anchorEl,
  open,
  onOpenChange,
  children,
  title,
}: {
  anchorEl: HTMLElement | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  children: React.ReactNode;
  title?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Measure lane width to target ~2 columns, but keep a clinically-usable min width.
  const targetGeom = useMemo(() => {
    if (typeof window === "undefined") return null;
    const firstLane = document.querySelector<HTMLElement>(".lane-col");
    const laneWidth = firstLane
      ? firstLane.getBoundingClientRect().width
      : Math.min(520, window.innerWidth - 48);
    const gap = (() => {
      if (!firstLane || !firstLane.parentElement) return 16;
      const s = window.getComputedStyle(firstLane.parentElement);
      const g = parseFloat(s.columnGap || s.gap || "16");
      return isNaN(g) ? 16 : g;
    })();
    const target = Math.round(laneWidth * 2 + gap);
    const MIN = 960;                          // ✅ clinically meaningful minimum width
    const MAX = Math.min(1280, window.innerWidth - 32);
    const width = Math.max(MIN, Math.min(target, MAX));
    const left = Math.max(16, Math.round((window.innerWidth - width) / 2));
    return { width, left };
  }, [open]);

  // ESC & scrim close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // FLIP animation
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!open || !el || !anchorEl || !targetGeom) return;
    const from = anchorEl.getBoundingClientRect();
    const to = {
      top: Math.max(16, Math.min(from.top - 8, window.innerHeight - 100)), // keep near origin, in viewport
      left: targetGeom.left,
      width: targetGeom.width,
    };
    // Position at final, then invert to from
    el.style.position = "fixed";
    el.style.top = `${to.top}px`;
    el.style.left = `${to.left}px`;
    el.style.width = `${to.width}px`;
    el.style.maxHeight = `${Math.round(window.innerHeight - to.top - 16)}px`;
    el.style.overflow = "auto";
    el.style.transformOrigin = "top left";
    // Invert
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sx = from.width / to.width;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sx})`;
    el.style.opacity = "0.98";
    // Play
    requestAnimationFrame(() => {
      el.style.transition = "transform 180ms ease, opacity 180ms ease";
      el.style.transform = "translate(0px, 0px) scale(1,1)";
      el.style.opacity = "1";
    });
    // Cleanup transition after
    const t = setTimeout(() => { if (el) el.style.transition = ""; }, 220);
    return () => clearTimeout(t);
  }, [open, anchorEl, targetGeom]);

  // Contract animation on close
  const onClose = () => {
    const el = cardRef.current;
    if (!el || !anchorEl) { onOpenChange(false); return; }
    const to = anchorEl.getBoundingClientRect();
    const from = el.getBoundingClientRect();
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = to.width / from.width;
    el.style.transition = "transform 160ms ease, opacity 160ms ease";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sx})`;
    el.style.opacity = "0.98";
    setTimeout(() => onOpenChange(false), 160);
  };

  if (!mounted) return null;
  const portalRoot = document.body; // no special mount required
  if (!open) return null;

  return createPortal(
    <div ref={hostRef} className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div ref={cardRef} className="absolute bg-background rounded-2xl shadow-xl border overflow-hidden">
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 cursor-pointer"
          onClick={onClose}
          role="button"
          aria-label="Collapse"
        >
          <div className="font-semibold truncate pr-3 select-none">{title ?? "Patient"}</div>
          <button aria-label="Close" onClick={(e)=>{ e.stopPropagation(); onClose(); }} className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3">
          {children}
        </div>
      </div>
    </div>,
    portalRoot
  );
}