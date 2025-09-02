import React, { useEffect, useId, useRef, useState } from "react";

/** A single-layer popover that shows the existing RoleSelector control. */
export default function RoleMenu({ RoleSelector }: { RoleSelector: React.ReactNode }) {
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
          <div className="rounded-xl border p-2">
            {RoleSelector}
          </div>
        </div>
      )}
    </div>
  );
}