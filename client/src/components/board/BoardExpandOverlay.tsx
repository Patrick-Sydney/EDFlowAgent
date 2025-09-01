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
  const [recalcTick, setRecalcTick] = useState(0);

  // Layout knobs for desktop feel
  const TOP_FRACTION = 0.12;         // 12% from top (more space for content below)
  const BOTTOM_MARGIN = 24;          // px margin at bottom

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
    // 80% of viewport width for comprehensive clinical workspace
    const target = Math.round(window.innerWidth * 0.8);
    const MIN = 1100;                         // wider min for desktop readability
    const MAX = Math.min(target, window.innerWidth - 32);
    const width = Math.max(MIN, Math.min(target, MAX));
    const left = Math.max(16, Math.round((window.innerWidth - width) / 2));
    return { width, left };
  }, [open, recalcTick]);

  // ESC & scrim close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Keep centered on resize
  useEffect(() => {
    if (!open) return;
    const onResize = () => setRecalcTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  // FLIP animation
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!open || !el || !anchorEl || !targetGeom) return;

    // 1) Set final geometry (top-offset; width as computed)
    el.style.position = "fixed";
    el.style.left = `${targetGeom.left}px`;
    el.style.width = `${targetGeom.width}px`;
    const top = Math.max(16, Math.round(window.innerHeight * TOP_FRACTION));
    const finalH = Math.max(
      420,
      Math.min(window.innerHeight - top - BOTTOM_MARGIN, window.innerHeight - 32)
    );
    el.style.top = `${top}px`;
    el.style.height = `${finalH}px`;
    el.style.maxHeight = `${finalH}px`;
    el.style.transform = "none";
    el.style.opacity = "0.98";
    el.style.overflow = "auto";
    el.style.transformOrigin = "top left";

    // 2) FLIP: invert from anchor card rect to final rect (scaleX + scaleY)
    const from = anchorEl.getBoundingClientRect();
    const dx = from.left - targetGeom.left;
    const dy = from.top - top;
    const sx = from.width / targetGeom.width;
    const sy = from.height / finalH;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

    // 3) Play animation to identity (center-stage)
    requestAnimationFrame(() => {
      el.style.transition = "transform 220ms ease, opacity 220ms ease";
      el.style.transform = "translate(0px, 0px) scale(1, 1)";
      el.style.opacity = "1";
    });

    // Cleanup transition after play
    const t = setTimeout(() => { if (el) el.style.transition = ""; }, 260);
    return () => clearTimeout(t);
  }, [open, anchorEl, targetGeom, recalcTick]);

  // Contract animation on close
  const onClose = () => {
    const el = cardRef.current;
    if (!el || !anchorEl) { onOpenChange(false); return; }
    const to = anchorEl.getBoundingClientRect();
    const from = el.getBoundingClientRect();
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = to.width / from.width;
    const sy = to.height / from.height;
    el.style.transition = "transform 180ms ease, opacity 180ms ease";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    el.style.opacity = "0.98";
    setTimeout(() => onOpenChange(false), 180);
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