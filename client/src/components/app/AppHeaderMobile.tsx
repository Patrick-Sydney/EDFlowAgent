import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hospital, FlaskConical } from "lucide-react";

export type Role = "RN view" | "Charge view" | "MD view";

export default function AppHeaderMobile({
  role,
  onChangeRole,
  onScenarios,
}: {
  role: Role;
  onChangeRole: (r: Role) => void;
  onScenarios?: () => void;
}) {
  const [now, setNow] = useState<string>(() => new Date().toLocaleTimeString());
  const [openRole, setOpenRole] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="h-12 flex items-center justify-between px-2">
        {/* Left: App icon doubles as Role switcher */}
        <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Change role" onClick={() => setOpenRole(true)}>
          <Hospital className="h-5 w-5" />
        </Button>

        {/* Center: Live + local time */}
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Live
          </span>
          <span className="tabular-nums text-muted-foreground">{now}</span>
        </div>

        {/* Right: Scenarios icon (optional) */}
        <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Scenarios" onClick={onScenarios}>
          <FlaskConical className="h-5 w-5" />
        </Button>
      </div>

      {/* Role picker (simple dialog for reliability) */}
      <Dialog open={openRole} onOpenChange={setOpenRole}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Select view</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {["RN view", "Charge view", "MD view"].map((r) => (
              <Button key={r} variant={role === r ? "default" : "outline"} className="justify-start" onClick={() => { onChangeRole(r as Role); setOpenRole(false); }}>
                {r}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}