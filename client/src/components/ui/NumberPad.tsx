import { useState, useEffect } from "react";

interface NumberPadProps {
  value?: string | number | null;
  onChange: (value: string) => void;
  onClose?: () => void;
  allowDecimal?: boolean;
  maxLen?: number;
  confirmLabel?: string;
}

export default function NumberPad({ 
  value, 
  onChange, 
  onClose, 
  allowDecimal = false, 
  maxLen = 4, 
  confirmLabel = "Confirm" 
}: NumberPadProps) {
  const [local, setLocal] = useState(value?.toString() ?? "");
  
  useEffect(() => { 
    setLocal(value?.toString() ?? ""); 
  }, [value]);

  const tap = (ch: string) => {
    if (ch === "." && (!allowDecimal || local.includes("."))) return;
    const next = (local + ch).slice(0, maxLen);
    setLocal(next);
  };

  const back = () => setLocal((s) => s.slice(0, -1));
  const clear = () => setLocal("");
  const confirm = () => { 
    onChange(local); 
    onClose?.(); 
  };

  return (
    <div className="mt-2 border rounded-lg bg-white shadow-md p-2 grid grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button 
          key={n}
          type="button"
          className="px-4 py-3 rounded bg-gray-100 text-lg active:bg-gray-200 min-h-[44px]"
          onClick={() => tap(String(n))}
          data-testid={`digit-${n}`}
        >
          {n}
        </button>
      ))}
      {allowDecimal ? (
        <button 
          type="button" 
          className="px-4 py-3 rounded bg-gray-100 text-lg active:bg-gray-200 min-h-[44px]" 
          onClick={() => tap(".")}
          data-testid="digit-decimal"
        >
          .
        </button>
      ) : (
        <span />
      )}
      <button 
        type="button" 
        className="px-4 py-3 rounded bg-gray-100 text-lg active:bg-gray-200 min-h-[44px]" 
        onClick={() => tap("0")}
        data-testid="digit-0"
      >
        0
      </button>
      <button 
        type="button" 
        className="px-4 py-3 rounded bg-gray-100 text-lg active:bg-gray-200 min-h-[44px]" 
        onClick={back}
        data-testid="button-backspace"
      >
        ⌫
      </button>

      <button 
        type="button" 
        className="col-span-2 px-3 py-2 bg-blue-600 text-white rounded min-h-[44px]" 
        onClick={confirm}
        data-testid="button-confirm"
      >
        {confirmLabel}
      </button>
      <button 
        type="button" 
        className="px-3 py-2 bg-rose-100 text-rose-700 rounded min-h-[44px]" 
        onClick={clear}
        data-testid="button-clear"
      >
        Clear
      </button>
    </div>
  );
}