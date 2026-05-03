"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Fuel, Calendar, Gauge, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, formatMileage, fuelTypeLabel } from "@/lib/auto-format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { VoiceButton, VoiceResultCard } from "@/components/ui/voice-button";

const FUEL_TYPES = [
  { value: "GASOLINE", label: "Gasolina" },
  { value: "ETHANOL", label: "Etanol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "FLEX", label: "Flex" },
];

const schema = z.object({
  date: z.string().min(1),
  fuelType: z.enum(["GASOLINE", "ETHANOL", "DIESEL", "FLEX"]),
  liters: z.number({ invalid_type_error: "Litros inválido" }).min(0),
  pricePerLiter: z.number({ invalid_type_error: "Preço inválido" }).min(0),
  totalCost: z.number({ invalid_type_error: "Total inválido" }).min(0),
  mileage: z.number({ invalid_type_error: "Km inválido" }).int().min(0),
  stationName: z.string().optional(),
  fullTank: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;
type ActiveVoiceField = "liters" | "pricePerLiter" | "totalCost" | "mileage" | null;

interface FuelLog {
  id: string;
  date: string;
  fuelType: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  stationName?: string;
  fullTank: boolean;
}

export function FuelTab({ vehicleId, isOwner, onUpdate }: { vehicleId: string; isOwner: boolean; onUpdate: () => void }) {
  const [items, setItems] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeField, setActiveField] = useState<ActiveVoiceField>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fuelType: "GASOLINE", liters: 0, pricePerLiter: 0, totalCost: 0, mileage: 0, fullTank: true },
  });

  const { watch, setValue } = form;
  const litersVal = watch("liters");
  const priceVal = watch("pricePerLiter");

  useEffect(() => {
    if (litersVal && priceVal) {
      setValue("totalCost", parseFloat((litersVal * priceVal).toFixed(2)));
    }
  }, [litersVal, priceVal, setValue]);

  // One hook per numeric field — hooks must be at the top level, never conditionally
  const litersVoice = useVoiceInput({ field: "decimal", onError: (e) => toast.error(e) });
  const priceVoice  = useVoiceInput({ field: "decimal", onError: (e) => toast.error(e) });
  const totalVoice  = useVoiceInput({ field: "decimal", onError: (e) => toast.error(e) });
  const kmVoice     = useVoiceInput({ field: "integer", onError: (e) => toast.error(e) });

  const resetAllVoice = useCallback(() => {
    litersVoice.reset(); priceVoice.reset(); totalVoice.reset(); kmVoice.reset();
    setActiveField(null);
  }, [litersVoice, priceVoice, totalVoice, kmVoice]);

  function applyVoiceValue(field: Exclude<ActiveVoiceField, null>, value: number, isInt = false) {
    const finalVal = isInt ? Math.round(value) : value;
    setValue(field, finalVal);
    setActiveField(null);
    // Recalculate total when liters or price changes
    if (field === "liters" || field === "pricePerLiter") {
      const l = field === "liters"        ? finalVal : form.getValues("liters");
      const p = field === "pricePerLiter" ? finalVal : form.getValues("pricePerLiter");
      if (l && p) setValue("totalCost", parseFloat((l * p).toFixed(2)));
    }
    const labels: Record<Exclude<ActiveVoiceField, null>, string> = {
      liters: "Litros", pricePerLiter: "Preço/litro", totalCost: "Total", mileage: "Quilometragem",
    };
    toast.success(`${labels[field]} preenchido por voz!`);
  }

  const load = useCallback(() => {
    fetch(`/api/vehicles/${vehicleId}/fuel-logs`)
      .then((r) => r.json())
      .then((d) => setItems(d.fuelLogs ?? []))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  useEffect(() => { load(); }, [load]);

  const avgConsumption = (() => {
    const withKm = items.filter((f) => f.fullTank);
    if (withKm.length < 2) return null;
    const sorted = [...withKm].sort((a, b) => a.mileage - b.mileage);
    let totalKm = 0, totalL = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalKm += sorted[i].mileage - sorted[i - 1].mileage;
      totalL += sorted[i].liters;
    }
    return totalL > 0 ? (totalKm / totalL).toFixed(1) : null;
  })();

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/fuel-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }
      toast.success("Abastecimento registrado!");
      setOpen(false);
      form.reset({ fuelType: "GASOLINE", liters: 0, pricePerLiter: 0, totalCost: 0, mileage: 0, fullTank: true });
      resetAllVoice();
      load();
      onUpdate();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  const totalSpent    = items.reduce((sum, f) => sum + f.totalCost, 0);
  const totalLitersSum = items.reduce((sum, f) => sum + f.liters, 0);
  const voiceSupported = litersVoice.supported;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total gasto",    value: formatCurrency(totalSpent) },
            { label: "Total litros",   value: `${totalLitersSum.toFixed(1)}L` },
            { label: "Consumo médio",  value: avgConsumption ? `${avgConsumption} km/L` : "—" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="font-bold text-sm">{s.value}</p>
              <p className="text-muted-foreground text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{items.length} abastecimentos</p>

        {isOwner && (
          <Dialog
            open={open}
            onOpenChange={(o) => { setOpen(o); if (!o) resetAllVoice(); }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Abastecer
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Novo Abastecimento
                </DialogTitle>
              </DialogHeader>

              {voiceSupported && (
                <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary">
                  <span>🎤</span>
                  Toque no microfone ao lado de cada campo para falar o valor
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-1">

                {/* Combustível */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Combustível *</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {FUEL_TYPES.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => form.setValue("fuelType", f.value as FormData["fuelType"])}
                        className={`rounded-lg border py-2 text-[11px] font-medium transition-all ${form.watch("fuelType") === f.value ? "border-primary bg-primary/10 text-primary" : "border-border/40"}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data + Quilometragem */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data *</Label>
                    <Input type="date" {...form.register("date")} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quilometragem *</Label>
                    <div className="flex gap-1.5">
                      <Input type="number" step="1" {...form.register("mileage", { valueAsNumber: true })} placeholder="0" className="h-9 flex-1" />
                      <VoiceButton state={kmVoice.state} onStart={() => { setActiveField("mileage"); kmVoice.start(); }} onStop={kmVoice.stop} supported={voiceSupported} size="sm" />
                    </div>
                    {activeField === "mileage" && (
                      <VoiceResultCard
                        label="Quilometragem" state={kmVoice.state}
                        rawText={kmVoice.result?.raw} parsedNumber={kmVoice.result?.number} unit="km"
                        onConfirm={(v) => { applyVoiceValue("mileage", v, true); kmVoice.reset(); }}
                        onRetry={() => { kmVoice.reset(); setTimeout(() => { setActiveField("mileage"); kmVoice.start(); }, 200); }}
                        onDismiss={() => { kmVoice.reset(); setActiveField(null); }}
                      />
                    )}
                  </div>
                </div>

                {/* Litros + Preço/litro */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Litros *</Label>
                    <div className="flex gap-1.5">
                      <Input type="number" step="0.001" {...form.register("liters", { valueAsNumber: true })} placeholder="0,000" className="h-9 flex-1" />
                      <VoiceButton state={litersVoice.state} onStart={() => { setActiveField("liters"); litersVoice.start(); }} onStop={litersVoice.stop} supported={voiceSupported} size="sm" />
                    </div>
                    {activeField === "liters" && (
                      <VoiceResultCard
                        label="Litros" state={litersVoice.state}
                        rawText={litersVoice.result?.raw} parsedNumber={litersVoice.result?.number} unit="L"
                        onConfirm={(v) => { applyVoiceValue("liters", v); litersVoice.reset(); }}
                        onRetry={() => { litersVoice.reset(); setTimeout(() => { setActiveField("liters"); litersVoice.start(); }, 200); }}
                        onDismiss={() => { litersVoice.reset(); setActiveField(null); }}
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Preço/litro (R$) *</Label>
                    <div className="flex gap-1.5">
                      <Input type="number" step="0.001" {...form.register("pricePerLiter", { valueAsNumber: true })} placeholder="0,000" className="h-9 flex-1" />
                      <VoiceButton state={priceVoice.state} onStart={() => { setActiveField("pricePerLiter"); priceVoice.start(); }} onStop={priceVoice.stop} supported={voiceSupported} size="sm" />
                    </div>
                    {activeField === "pricePerLiter" && (
                      <VoiceResultCard
                        label="Preço/litro" state={priceVoice.state}
                        rawText={priceVoice.result?.raw} parsedNumber={priceVoice.result?.number} unit="R$/L"
                        onConfirm={(v) => { applyVoiceValue("pricePerLiter", v); priceVoice.reset(); }}
                        onRetry={() => { priceVoice.reset(); setTimeout(() => { setActiveField("pricePerLiter"); priceVoice.start(); }, 200); }}
                        onDismiss={() => { priceVoice.reset(); setActiveField(null); }}
                      />
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Total (R$) — calculado automaticamente</Label>
                  <div className="flex gap-1.5">
                    <Input type="number" step="0.01" {...form.register("totalCost", { valueAsNumber: true })} placeholder="0,00" className="h-9 flex-1" />
                    <VoiceButton state={totalVoice.state} onStart={() => { setActiveField("totalCost"); totalVoice.start(); }} onStop={totalVoice.stop} supported={voiceSupported} size="sm" />
                  </div>
                  {activeField === "totalCost" && (
                    <VoiceResultCard
                      label="Total" state={totalVoice.state}
                      rawText={totalVoice.result?.raw} parsedNumber={totalVoice.result?.number} unit="R$"
                      onConfirm={(v) => { applyVoiceValue("totalCost", v); totalVoice.reset(); }}
                      onRetry={() => { totalVoice.reset(); setTimeout(() => { setActiveField("totalCost"); totalVoice.start(); }, 200); }}
                      onDismiss={() => { totalVoice.reset(); setActiveField(null); }}
                    />
                  )}
                </div>

                {/* Posto */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Posto (opcional)</Label>
                  <Input {...form.register("stationName")} placeholder="Nome do posto" className="h-9" />
                </div>

                {/* Tanque cheio */}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="fullTank" {...form.register("fullTank")} className="h-4 w-4 rounded border-border" />
                  <Label htmlFor="fullTank" className="text-xs cursor-pointer">Tanque cheio (usado para calcular consumo médio)</Label>
                </div>

                <Button type="submit" disabled={saving} className="w-full h-9">
                  {saving ? "Salvando..." : "Registrar Abastecimento"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Fuel className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum abastecimento registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                <Fuel className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{fuelTypeLabel(f.fuelType)}</p>
                  <span className="text-[10px] text-muted-foreground">{f.liters.toFixed(3)}L</span>
                  {f.stationName && <span className="text-[10px] text-muted-foreground truncate">· {f.stationName}</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(f.date)}</span>
                  <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{formatMileage(f.mileage)}</span>
                  <span>R$ {f.pricePerLiter.toFixed(3)}/L</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-sm">{formatCurrency(f.totalCost)}</span>
                {isOwner && (
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={async () => {
                      if (!confirm("Excluir este abastecimento?")) return;
                      await fetch(`/api/vehicles/${vehicleId}/fuel-logs/${f.id}`, { method: "DELETE" });
                      toast.success("Abastecimento excluído");
                      load();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
