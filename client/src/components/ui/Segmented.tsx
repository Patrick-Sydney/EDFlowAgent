interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SegmentedOption)[];
  className?: string;
}

export function Segmented({ value, onChange, options, className = "" }: SegmentedProps) {
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