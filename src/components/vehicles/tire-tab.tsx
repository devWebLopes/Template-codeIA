"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Shield, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, formatMileage, tirePositionLabel } from "@/lib/auto-format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const POSITIONS = ["FRONT_LEFT", "FRONT_RIGHT", "REAR_LEFT", "REAR_RIGHT", "SPARE"];

const schema = z.object({
  position: z.enum(["FRONT_LEFT", "FRONT_RIGHT", "REAR_LEFT", "REAR_RIGHT", "SPARE"]),
  brand: z.string().min(1, "Marca obrigatória"),
  model: z.string().min(1, "Modelo obrigatório"),
  size: z.string().optional(),
  purchaseDate: z.string().min(1),
  purchaseMileage: z.number({ invalid_type_error: "Km inválido" }).int().min(0),
  cost: z.number({ invalid_type_error: "Custo inválido" }).min(0),
  lastRotationDate: z.string().optional(),
  lastRotationMileage: z.number().int().optional().nullable(),
  expectedLifespanKm: z.number().int().optional().nullable(),
  expectedLifespanMonths: z.number().int().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Tire {
  id: string;
  position: string;
  brand: string;
  model: string;
  size?: string;
  purchaseDate: string;
  purchaseMileage: number;
  cost: number;
  lastRotationDate?: string;
  lastRotationMileage?: number;
  expectedLifespanKm?: number;
  expectedLifespanMonths?: number;
}

export function TireTab({ vehicleId, isOwner, onUpdate }: { vehicleId: string; isOwner: boolean; onUpdate: () => void }) {
  const [items, setItems] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { position: "FRONT_LEFT", purchaseMileage: 0, cost: 0 },
  });

  const load = () => {
    fetch(`/api/vehicles/${vehicleId}/tires`)
      .then((r) => r.json())
      .then((d) => setItems(d.tires ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [vehicleId]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este pneu?")) return;
    await fetch(`/api/vehicles/${vehicleId}/tires/${id}`, { method: "DELETE" });
    toast.success("Pneu excluído");
    load();
    onUpdate();
  }

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/tires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }
      toast.success("Pneu registrado!");
      setOpen(false);
      form.reset();
      load();
      onUpdate();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{items.length} pneus registrados</p>
        {isOwner && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Novo Pneu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Registrar Pneu
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Posição *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {POSITIONS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => form.setValue("position", p as FormData["position"])}
                        className={`rounded-lg border py-2 text-[11px] transition-all ${form.watch("position") === p ? "border-primary bg-primary/10 text-primary" : "border-border/40"}`}
                      >
                        {tirePositionLabel(p)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Marca *</Label>
                    <Input {...form.register("brand")} placeholder="Ex: Michelin" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Modelo *</Label>
                    <Input {...form.register("model")} placeholder="Ex: Energy XM2" className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Medida</Label>
                    <Input {...form.register("size")} placeholder="195/60R15" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Custo (R$) *</Label>
                    <Input type="number" step="0.01" {...form.register("cost", { valueAsNumber: true })} placeholder="0,00" className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data de compra *</Label>
                    <Input type="date" {...form.register("purchaseDate")} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Km na compra *</Label>
                    <Input type="number" {...form.register("purchaseMileage", { valueAsNumber: true })} className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vida útil (km)</Label>
                    <Input type="number" {...form.register("expectedLifespanKm", { valueAsNumber: true })} placeholder="60000" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vida útil (meses)</Label>
                    <Input type="number" {...form.register("expectedLifespanMonths", { valueAsNumber: true })} placeholder="48" className="h-9" />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="w-full h-9">
                  {saving ? "Salvando..." : "Registrar Pneu"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tire Diagram */}
      <div className="rounded-xl border border-border/40 bg-card/20 p-4">
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {["FRONT_LEFT", "FRONT_RIGHT", "REAR_LEFT", "REAR_RIGHT"].map((pos) => {
            const tire = items.find((t) => t.position === pos);
            return (
              <div key={pos} className={`rounded-lg border p-3 text-center ${tire ? "border-primary/30 bg-primary/5" : "border-dashed border-border/40"}`}>
                <p className="text-[10px] text-muted-foreground mb-1">{tirePositionLabel(pos)}</p>
                {tire ? (
                  <>
                    <p className="font-medium text-xs">{tire.brand}</p>
                    <p className="text-[10px] text-muted-foreground">{tire.model}</p>
                    {tire.size && <p className="text-[10px] text-primary mt-0.5">{tire.size}</p>}
                  </>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Não cadastrado</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">Nenhum pneu registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="rounded-xl border border-border/40 bg-card/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{t.brand} {t.model}</span>
                    {t.size && <span className="text-xs text-muted-foreground">{t.size}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{tirePositionLabel(t.position)}</p>
                  <div className="flex gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span>Compra: {formatDate(t.purchaseDate)}</span>
                    <span>{formatMileage(t.purchaseMileage)}</span>
                    <span className="font-medium text-foreground">{formatCurrency(t.cost)}</span>
                  </div>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(t.id)}>
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
