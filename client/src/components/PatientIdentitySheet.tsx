import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Fingerprint, Copy, Eye, EyeOff, QrCode, ShieldAlert, Info, CalendarDays, User2 } from "lucide-react";

// QR Code functionality - would need to install qrcode.react if used
// import { QRCodeSVG } from "qrcode.react";

export type Role = "RN" | "Charge" | "MD" | "Clerical";

export type PatientIdentity = {
  id: string;
  legalName: string;
  preferredName?: string | null;
  age?: number;
  sex?: string;
  dob?: string;
  nhi?: string | null;
  mrn?: string | null;
  otherIds?: Array<{ system: string; value: string }>;
  allergies?: string[];
  alerts?: string[];
};

export function maskTail(value: string, visible = 3) {
  if (!value) return "";
  const vis = value.slice(-visible);
  const mask = "•".repeat(Math.max(0, value.length - visible));
  return `${mask}${vis}`;
}

export default function PatientIdentitySheet({
  open,
  onOpenChange,
  patient,
  role = "RN",
  onAudit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patient: PatientIdentity;
  role?: Role;
  onAudit?: (evt: { action: "reveal" | "copy" | "qr_open"; field: string; patientId: string }) => void;
}) {
  const [revealNHI, setRevealNHI] = useState(false);
  const [revealMRN, setRevealMRN] = useState(role === "Clerical");

  const ageSex = useMemo(() => {
    const a = patient.age != null ? `${patient.age}` : undefined;
    return [a, patient.sex].filter(Boolean).join(" ");
  }, [patient.age, patient.sex]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onAudit?.({ action: "copy", field, patientId: patient.id });
    } catch {
      /* noop */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[100vw] w-[100vw] sm:max-w-[420px] sm:rounded-2xl rounded-none h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Fingerprint className="h-5 w-5" /> Identity
          </DialogTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <User2 className="h-4 w-4" />
            <span className="font-medium truncate" title={patient.legalName}>{patient.legalName}</span>
            {patient.preferredName && (
              <Badge variant="outline" className="ml-1">Preferred: {patient.preferredName}</Badge>
            )}
          </div>
        </DialogHeader>
        <Separator />

        <ScrollArea className="flex-1 px-4">
          <div className="py-3 space-y-4">
            {/* Demographics row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">Age / Sex</div>
                <div className="text-base font-medium">{ageSex || "—"}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/>DOB</div>
                <div className="text-base font-medium">{patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"}</div>
              </div>
            </div>

            {/* Identifiers */}
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Identifiers</div>
              <div className="rounded-xl border divide-y">
                {/* NHI */}
                <div className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">NHI</div>
                    <div className="font-mono tabular-nums text-base">
                      {patient.nhi ? (revealNHI ? patient.nhi : maskTail(patient.nhi)) : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.nhi && (
                      <Button
                        variant="outline" size="sm" className="rounded-full"
                        onClick={() => {
                          const next = !revealNHI; setRevealNHI(next);
                          onAudit?.({ action: "reveal", field: "NHI", patientId: patient.id });
                        }}
                      >
                        {revealNHI ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </Button>
                    )}
                    {patient.nhi && (
                      <Button variant="outline" size="sm" className="rounded-full"
                        onClick={() => copyToClipboard(patient.nhi!, "NHI")}
                      >
                        <Copy className="h-4 w-4"/>
                      </Button>
                    )}
                    {patient.nhi && (
                      <Button variant="outline" size="sm" className="rounded-full"
                        onClick={() => onAudit?.({ action: "qr_open", field: "NHI", patientId: patient.id })}
                      >
                        <QrCode className="h-4 w-4"/>
                      </Button>
                    )}
                  </div>
                </div>

                {/* MRN */}
                <div className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">MRN</div>
                    <div className="font-mono tabular-nums text-base">
                      {patient.mrn ? (revealMRN ? patient.mrn : maskTail(patient.mrn)) : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.mrn && (
                      <Button variant="outline" size="sm" className="rounded-full"
                        onClick={() => { const n = !revealMRN; setRevealMRN(n); onAudit?.({ action: "reveal", field: "MRN", patientId: patient.id }); }}
                      >
                        {revealMRN ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </Button>
                    )}
                    {patient.mrn && (
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => copyToClipboard(patient.mrn!, "MRN")}>
                        <Copy className="h-4 w-4"/>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Other IDs */}
                {patient.otherIds?.map((id, i) => (
                  <div key={`${id.system}-${i}`} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">{id.system}</div>
                      <div className="font-mono tabular-nums text-base">{id.value}</div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => copyToClipboard(id.value, id.system)}>
                      <Copy className="h-4 w-4"/>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts / Allergies */}
            {(patient.alerts?.length || patient.allergies?.length) ? (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Clinical Flags</div>
                <div className="rounded-xl border p-3 space-y-2">
                  {patient.allergies?.length ? (
                    <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-rose-600"/><span className="text-sm">Allergies:</span>
                      <div className="flex flex-wrap gap-1">{patient.allergies.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}</div>
                    </div>
                  ) : null}
                  {patient.alerts?.length ? (
                    <div className="flex items-center gap-2"><Info className="h-4 w-4 text-amber-600"/><span className="text-sm">Alerts:</span>
                      <div className="flex flex-wrap gap-1">{patient.alerts.map(a => <Badge key={a} variant="outline">{a}</Badge>)}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* QR section (would need qrcode.react installed) */}
            {patient.nhi && revealNHI && (
              <div className="rounded-xl border p-3 grid place-items-center">
                <div className="w-[180px] h-[180px] bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  QR Code
                  <br />
                  (qrcode.react needed)
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Scan for labels / wristband</div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions (role-aware) */}
        <div className="sticky bottom-0 w-full p-4 border-t bg-background">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// IDChip component for patient cards
export function IDChip({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs active:scale-[0.98] hover:bg-muted/50 transition-colors" 
      aria-label="Open identity"
    >
      <Fingerprint className="h-3.5 w-3.5" /> ID
    </button>
  );
}