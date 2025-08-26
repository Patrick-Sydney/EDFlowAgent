import { useState, useMemo } from "react";
import NumberPad from "./ui/NumberPad";

interface VitalButtonProps {
  label: string;
  unit?: string;
  value?: string | number | null;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
  maxLen?: number;
  min?: number;
  max?: number;
}

export default function VitalButton({ 
  label, 
  unit = "", 
  value, 
  onChange, 
  allowDecimal = false, 
  maxLen = 4,
  min = -Infinity,
  max = Infinity
}: VitalButtonProps) {
  const [open, setOpen] = useState(false);
  const hasVal = value !== undefined && value !== null && value !== "";
  const numVal = useMemo(() => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }, [value]);
  const inRange = numVal === null ? true : (numVal >= min && numVal <= max);

  return (
    <div className="flex flex-col items-stretch">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`px-4 py-3 rounded-xl border text-sm font-medium w-full min-h-[44px] ${
          hasVal
            ? (inRange ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-rose-50 border-rose-300 text-rose-700")
            : "bg-gray-50 border-gray-200 text-gray-500"
        }`}
        data-testid={`button-vital-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      >
        {hasVal ? `${label}: ${value}${unit}` : label}
      </button>
      {open && (
        <NumberPad
          value={value}
          allowDecimal={allowDecimal}
          maxLen={maxLen}
          onChange={(val) => onChange(val)}
          onClose={() => setOpen(false)}
          validator={(str) => {
            if (str === "" || str === ".") return { ok: false, message: "Enter a number" };
            const n = Number(str);
            if (!Number.isFinite(n)) return { ok: false, message: "Invalid number" };
            if (n < min) return { ok: false, message: `Must be ≥ ${min}${unit}` };
            if (n > max) return { ok: false, message: `Must be ≤ ${max}${unit}` };
            return { ok: true };
          }}
        />
      )}
    </div>
  );
}