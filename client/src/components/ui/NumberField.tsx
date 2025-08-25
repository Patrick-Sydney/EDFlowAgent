interface NumberFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
}

export default function NumberField({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  suffix,
  placeholder 
}: NumberFieldProps) {
  const increment = () => {
    const n = Number(value || 0);
    const next = isFinite(n) ? n + step : step;
    if (max != null && next > max) return;
    onChange(String(next));
  };

  const decrement = () => {
    const n = Number(value || 0);
    const next = isFinite(n) ? n - step : 0;
    if (min != null && next < min) return;
    onChange(String(next));
  };

  return (
    <label className="text-sm block">
      {label}
      <div className="mt-1 flex items-stretch rounded-xl border overflow-hidden bg-white">
        <button 
          type="button" 
          onClick={decrement} 
          className="px-3 py-2 text-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 min-w-[44px] font-mono"
          data-testid={`button-decrement-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          –
        </button>
        <input
          className="w-full px-3 py-3 text-base outline-none text-center"
          value={value ?? ""}
          inputMode="decimal"
          pattern="[0-9.]*"
          enterKeyHint="next"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <button 
          type="button" 
          onClick={increment} 
          className="px-3 py-2 text-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 min-w-[44px] font-mono"
          data-testid={`button-increment-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          +
        </button>
      </div>
      {suffix && <span className="text-xs text-gray-500 mt-1 block">{suffix}</span>}
    </label>
  );
}