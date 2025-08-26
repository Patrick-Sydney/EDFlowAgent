import { useState } from "react";

interface ScenarioMenuProps {
  runScenario: (key: string) => void;
}

export default function ScenarioMenu({ runScenario }: ScenarioMenuProps) {
  const [open, setOpen] = useState(false);

  const items = [
    { key: "surge", label: "Surge", icon: "⚡", cls: "text-red-600" },
    { key: "stroke", label: "Stroke", icon: "🧠", cls: "text-purple-600" },
    { key: "boarding", label: "Boarding", icon: "🛏️", cls: "text-amber-600" },
    { key: "reset", label: "Reset Demo", icon: "🔄", cls: "text-gray-600" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded-lg border text-xs bg-white hover:bg-gray-50 transition-colors flex items-center gap-1.5"
        data-testid="button-scenarios"
      >
        🧪 Scenarios
      </button>
      {open && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 w-40">
            {items.map(i => (
              <button
                key={i.key}
                onClick={() => { 
                  setOpen(false); 
                  runScenario(i.key); 
                }}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${i.cls}`}
                data-testid={`button-scenario-${i.key}`}
              >
                <span>{i.icon}</span>
                {i.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}