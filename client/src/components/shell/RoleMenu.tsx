import React, { useEffect, useId, useRef, useState } from "react";

type RoleKey = "rn" | "charge" | "md";
const LABEL: Record<RoleKey,string> = { rn: "RN view", charge: "Charge view", md: "MD view" };
const ORDER: RoleKey[] = ["rn","charge","md"];

/** A single-layer popover with pill buttons (no nested select). */
export default function RoleMenu({ RoleSelector }: { RoleSelector?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement|null>(null);
  const popRef = useRef<HTMLDivElement|null>(null);
  const id = useId();
  const [role, setRole] = useState<RoleKey>(() => {
    const saved = (localStorage.getItem("edflow.role") || "").toLowerCase();
    return (["rn","charge","md"] as RoleKey[]).includes(saved as RoleKey) ? (saved as RoleKey) : "charge";
  });

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
        Role
      </button>
      {open && (
        <div
          ref={popRef}
          id={id}
          role="menu"
          className="absolute z-[1200] mt-2 w-[min(92vw,320px)] rounded-2xl border bg-background shadow-xl p-3 right-0"
        >
          <div className="text-xs font-medium text-muted-foreground px-1 pb-2">Role view</div>
          <div className="flex items-center gap-1 flex-wrap">
            {ORDER.map(k => (
              <button
                key={k}
                role="menuitemradio"
                aria-checked={role===k}
                className={`rounded-full border px-3 py-1 text-sm ${role===k ? "bg-background shadow" : "opacity-80"}`}
                onClick={() => {
                  setRole(k);
                  localStorage.setItem("edflow.role", k);
                  window.dispatchEvent(new CustomEvent("role:change", { detail: { role: k }}));
                  setOpen(false);
                }}
              >
                {LABEL[k]}
              </button>
            ))}
          </div>
          {/* If you still want to expose your legacy RoleSelector, keep it below but hidden by default. */}
          {!!RoleSelector && <div className="sr-only">{RoleSelector}</div>}
        </div>
      )}
    </div>
  );
}