import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

export type LanePill = {
  id: string;      // DOM id of the lane <section id="...">
  label: string;   // e.g. "Waiting"
  count: number;   // number badge
};

export default function RNMobileLaneNav({
  lanes,
  stickyOffset = 88,   // px; sits under your app header on iOS
}: {
  lanes: LanePill[];
  stickyOffset?: number;
}) {
  const [active, setActive] = useState(lanes[0]?.id);
  const observers = useRef<IntersectionObserver | null>(null);

  // Observe lane sections to highlight active pill
  useEffect(() => {
    observers.current?.disconnect();
    const io = new IntersectionObserver(
      (entries) => {
        // Find the section that's most prominently visible (closest to top)
        const intersectingEntries = entries.filter(e => e.isIntersecting);
        if (intersectingEntries.length === 0) return;
        
        let closestEntry = intersectingEntries[0];
        let minDistance = Math.abs(intersectingEntries[0].boundingClientRect.top);
        
        for (let i = 1; i < intersectingEntries.length; i++) {
          const distance = Math.abs(intersectingEntries[i].boundingClientRect.top);
          if (distance < minDistance) {
            minDistance = distance;
            closestEntry = intersectingEntries[i];
          }
        }
        
        if (closestEntry.target instanceof HTMLElement) {
          setActive(closestEntry.target.id);
        }
      },
      { 
        rootMargin: `-${stickyOffset + 48 + 20}px 0px -60% 0px`, 
        threshold: 0.1
      }
    );
    lanes.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) io.observe(el);
    });
    observers.current = io;
    return () => io.disconnect();
  }, [lanes, stickyOffset]);

  return (
    <div
      className="sticky z-30 bg-background border-b border-border -mt-px"
      style={{ top: `calc(env(safe-area-inset-top) + ${stickyOffset}px)` }}
    >
      <div className="flex gap-3 overflow-x-auto px-3 py-3 no-scrollbar">
        {lanes.map((l) => (
          <button
            key={l.id}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              "flex items-center gap-2 border min-h-[36px]",
              active === l.id 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background hover:bg-muted border-border"
            )}
            onClick={() => {
              const element = document.getElementById(l.id);
              if (element) {
                const headerHeight = stickyOffset + 48; // header + nav height
                const elementPosition = element.offsetTop - headerHeight;
                window.scrollTo({ 
                  top: elementPosition, 
                  behavior: "smooth" 
                });
              }
            }}
            aria-label={`Go to ${l.label}`}
          >
            <span className="whitespace-nowrap">{l.label}</span>
            <span className="text-xs rounded-full bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 min-w-[20px] text-center">
              {l.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}