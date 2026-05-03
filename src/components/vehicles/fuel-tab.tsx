"use client";

import { useEffect, useState } from "react";
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fuelType: "GASOLINE", liters: 0, pricePerLiter: 0, totalCost: 0, mileage: 0, fullTank: true },
  });

  const { watch, setValue } = form;
  const liters = watch("liters");
  const pricePerLiter = watch("pricePerLiter");

  useEffect(() => {
    if (liters && pricePerLiter) {
      setValue("totalCost", parseFloat((liters * pricePerLiter).toFixed(2)));
    }
  }, [liters, pricePerLiter, setValue]);

  const load = () => {
    fetch(`/api/vehicles/${vehicleId}/fuel-logs`)
      .then((r) => r.json())
      .then((d) => setItems(d.fuelLogs ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [vehicleId]);

  // Calculate average consumption
  const avgConsumption = (() => {
    const withKm = items.filter((f) => f.fullTank);
    if (withKm.length < 2) return null;
    const sorted = [...withKm].sort((a, b) => a.mileage - b.mileage);
    let totalKm = 0, totalLiters = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalKm += sorted[i].mileage - sorted[i - 1].mileage;
      totalLiters += sorted[i].liters;
    }
    return totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : null;
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
      load();
      onUpdate();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  const totalSpent = items.reduce((sum, f) => sum + f.totalCost, 0);
  const totalLiters = items.reduce((sum, f) => sum + f.liters, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total gasto", value: formatCurrency(totalSpent) },
            { label: "Total litros", value: `${totalLiters.toFixed(1)}L` },
            { label: "Consumo médio", value: avgConsumption ? `${avgConsumption} km/L` : "—" },
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Abastecer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Novo Abastecimento
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-2">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data *</Label>
                    <Input type="date" {...form.register("date")} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quilometragem *</Label>
                    <Input type="number" {...form.register("mileage", { valueAsNumber: true })} placeholder="0" className="h-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Litros *</Label>
                    <Input type="number" step="0.01" {...form.register("liters", { valueAsNumber: true })} placeholder="0,00" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preço/litro (R$) *</Label>
                    <Input type="number" step="0.01" {...form.register("pricePerLiter", { valueAsNumber: true })} placeholder="0,00" className="h-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Total (R$) — calculado automaticamente</Label>
                  <Input type="number" step="0.01" {...form.register("totalCost", { valueAsNumber: true })} placeholder="0,00" className="h-9" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Posto (opcional)</Label>
                  <Input {...form.register("stationName")} placeholder="Nome do posto" className="h-9" />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="fullTank" {...form.register("fullTank")} className="h-4 w-4 rounded border-border" />
                  <Label htmlFor="fullTank" className="text-xs cursor-pointer">Tanque cheio</Label>
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
                  <span className="text-[10px] text-muted-foreground">{f.liters.toFixed(1)}L</span>
                  {f.stationName && <span className="text-[10px] text-muted-foreground truncate">· {f.stationName}</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(f.date)}</span>
                  <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{formatMileage(f.mileage)}</span>
                  <span>R$ {f.pricePerLiter.toFixed(3)}/L</span>
                </div>
              </div>
              <span className="font-semibold text-sm shrink-0">{formatCurrency(f.totalCost)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
