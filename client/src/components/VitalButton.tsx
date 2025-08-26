import { useState } from "react";
import NumberPad from "./ui/NumberPad";

interface VitalButtonProps {
  label: string;
  unit?: string;
  value?: string | number | null;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
  maxLen?: number;
}

export default function VitalButton({ 
  label, 
  unit = "", 
  value, 
  onChange, 
  allowDecimal = false, 
  maxLen = 4 
}: VitalButtonProps) {
  const [open, setOpen] = useState(false);
  const hasVal = value !== undefined && value !== null && value !== "";

  return (
    <div className="flex flex-col items-stretch">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`px-4 py-3 rounded-xl border text-sm font-medium w-full min-h-[44px] ${
          hasVal 
            ? "bg-blue-50 border-blue-300 text-blue-700" 
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
        />
      )}
    </div>
  );
}