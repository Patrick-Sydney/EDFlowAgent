import React from "react";
import clsx from "clsx";

type SimpleSegmentedProps = {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
};
export default function Segmented({ options, value, onChange, className }: SimpleSegmentedProps) {
  return (
    <div className={clsx("inline-flex rounded-lg border bg-white p-0.5", className)}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={clsx(
            "px-3 py-1.5 rounded-md text-sm",
            value === opt ? "bg-slate-900 text-white" : "hover:bg-slate-100"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedPropsOld {
  value: string;
  onChange: (value: string) => void;
  options: (string | SegmentedOption)[];
  className?: string;
}

// Export the default as a named export for backward compatibility
const SegmentedDefault = Segmented;
export { SegmentedDefault as Segmented };

export function SegmentedOld({ value, onChange, options, className = "" }: SegmentedPropsOld) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const selected = value === val;
        return (
          <button
            key={val}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(val)}
            className={`px-3 py-3 rounded-xl border text-base min-w-[48px] min-h-[44px] ${
              selected ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

interface ChipsProps {
  values?: string[];
  onToggle: (value: string, enabled: boolean) => void;
  options: (string | SegmentedOption)[];
  className?: string;
}

export function Chips({ values = [], onToggle, options, className = "" }: ChipsProps) {
  const set = new Set(values);
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const selected = set.has(val);
        return (
          <button
            key={val}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(val, !selected)}
            className={`px-3 py-2 rounded-full border text-sm min-h-[44px] ${
              selected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}