import React, { useId, useState, useRef, useEffect } from "react";

/**
 * Combined dropdown for Role & Scenarios, opened from app logo.
 * Shown on phone/tablet; desktop keeps separate controls.
 *
 * Usage:
 *   <CombinedAppMenu
 *     Logo={<AppLogo />}
 *     RoleSelector={<RoleSelector compact />}
 *     onOpenScenarios={() => window.dispatchEvent(new CustomEvent("ui:open-scenarios"))}
 *   />
 */
export default function CombinedAppMenu({
  Logo,
  RoleSelector,
  onOpenScenarios,
}: {
  Logo: React.ReactNode;
  RoleSelector: React.ReactNode;     // pass your existing Role control here
  onOpenScenarios: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement|null>(null);
  const popRef = useRef<HTMLDivElement|null>(null);
  const labelId = useId();

  // Close on outside click / ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (!popRef.current || !btnRef.current) return;
      if (popRef.current.contains(e.target as Node) || btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={labelId}
        className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
        onClick={() => setOpen(v => !v)}
      >
        {Logo}
        <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-70">
          <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          ref={popRef}
          id={labelId}
          role="menu"
          className="absolute z-[1200] mt-2 w-[min(92vw,360px)] rounded-2xl border bg-background shadow-xl p-3 right-0 md:left-0 md:right-auto"
        >
          <div className="text-xs font-medium text-muted-foreground px-1 pb-2">Quick settings</div>
          <div className="rounded-xl border p-2 mb-2">
            <div className="text-xs text-muted-foreground px-1 pb-1">Role view</div>
            {/* Reuse your existing role selector control */}
            {RoleSelector}
          </div>
          <button
            role="menuitem"
            className="w-full rounded-xl border px-3 py-2 text-left hover:bg-muted/60"
            onClick={() => { setOpen(false); onOpenScenarios(); }}
          >
            Scenarios
          </button>
        </div>
      )}
    </div>
  );
}