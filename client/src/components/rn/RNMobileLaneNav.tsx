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
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive((vis.target as HTMLElement).id);
      },
      { rootMargin: `-${Math.max(stickyOffset - 12, 0)}px 0px -60% 0px`, threshold: 0.01 }
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
      className="sticky z-30 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      style={{ top: `calc(env(safe-area-inset-top) + ${stickyOffset}px)` }}
    >
      <div className="flex gap-8 overflow-x-auto px-3 py-2 no-scrollbar">
        {lanes.map((l) => (
          <button
            key={l.id}
            className={clsx(
              "shrink-0 rounded-full px-3 py-2 text-sm border",
              active === l.id ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
            onClick={() =>
              document.getElementById(l.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            aria-label={`Go to ${l.label}`}
          >
            <span>{l.label}</span>
            <span className="ml-2 text-xs rounded-full bg-background/60 px-1.5">{l.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}