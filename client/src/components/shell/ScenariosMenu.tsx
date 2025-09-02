import React, { useEffect, useId, useRef, useState } from "react";
import { runScenario } from "../../demo/scenarioEngine";

type Scenario = { key: string; label: string; subtitle?: string };

const SCENARIOS: Scenario[] = [
  { key: "baseline", label: "Baseline", subtitle: "Normal load" },
  { key: "surge", label: "Surge", subtitle: "High volume" },
  { key: "cohort-sepsis", label: "Sepsis cohort", subtitle: "Sepsis/abx timing" },
  { key: "cohort-stroke", label: "Stroke cohort", subtitle: "FAST/CT flow" },
  { key: "cohort-chestpain", label: "Chest pain cohort", subtitle: "ACS workup" },
];

export default function ScenariosMenu({ onRun }: { onRun?: (key: string)=>void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement|null>(null);
  const popRef = useRef<HTMLDivElement|null>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!popRef.current || !btnRef.current) return;
      if (popRef.current.contains(e.target as Node) || btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, [open]);

  const run = (key: string) => {
    try { runScenario(key); } catch {}
    onRun?.(key);
    window.dispatchEvent(new CustomEvent("scenario:run", { detail: { key } }));
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-muted/60"
        onClick={() => setOpen(v => !v)}
      >
        Scenarios
      </button>
      {open && (
        <div
          ref={popRef}
          id={id}
          role="menu"
          className="absolute z-[1200] mt-2 w-[min(92vw,360px)] rounded-2xl border bg-background shadow-xl p-2 right-0 origin-top-right"
          style={{ right: 0, left: "auto", transformOrigin: "top right" }}
        >
          <ul className="max-h-[60vh] overflow-auto">
            {SCENARIOS.map(s => (
              <li key={s.key}>
                <button
                  role="menuitem"
                  className="w-full text-left rounded-xl px-3 py-2 hover:bg-muted/60"
                  onClick={() => run(s.key)}
                >
                  <div className="text-sm">{s.label}</div>
                  {s.subtitle && <div className="text-xs text-muted-foreground">{s.subtitle}</div>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}