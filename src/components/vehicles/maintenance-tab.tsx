"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Wrench, Calendar, Gauge, DollarSign, Trash2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency, formatDate, formatMileage } from "@/lib/auto-format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const MAINTENANCE_TYPES = [
  "Troca de óleo", "Revisão geral", "Alinhamento e balanceamento", "Troca de pneus",
  "Freios", "Filtro de ar", "Filtro de combustível", "Correias", "Velas de ignição",
  "Suspensão", "Fluido de freio", "Ar condicionado", "Bateria", "Outro"
];

const schema = z.object({
  date: z.string().min(1, "Data obrigatória"),
  type: z.string().min(1, "Tipo obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  cost: z.number({ invalid_type_error: "Valor inválido" }).min(0),
  mileage: z.number({ invalid_type_error: "Quilometragem inválida" }).int().min(0),
  nextMaintenanceDate: z.string().optional(),
  nextMaintenanceMileage: z.number().int().optional().nullable(),
  invoiceUrl: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Maintenance {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  nextMaintenanceDate?: string;
  nextMaintenanceMileage?: number;
  invoiceUrl?: string;
}

function getNextStatus(m: Maintenance): "overdue" | "upcoming" | "ok" | null {
  if (!m.nextMaintenanceDate) return null;
  const next = new Date(m.nextMaintenanceDate);
  const now = new Date();
  const daysUntil = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 30) return "upcoming";
  return "ok";
}

export function MaintenanceTab({ vehicleId, isOwner, onUpdate }: { vehicleId: string; isOwner: boolean; onUpdate: () => void }) {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cost: 0, mileage: 0 },
  });

  const load = () => {
    fetch(`/api/vehicles/${vehicleId}/maintenances`)
      .then((r) => r.json())
      .then((d) => setItems(d.maintenances ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [vehicleId]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/maintenances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: data.type || selectedType }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }
      toast.success("Manutenção registrada!");
      setOpen(false);
      form.reset();
      setSelectedType("");
      load();
      onUpdate();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta manutenção?")) return;
    await fetch(`/api/vehicles/${vehicleId}/maintenances/${id}`, { method: "DELETE" });
    toast.success("Manutenção excluída");
    load();
    onUpdate();
  }

  const totalCost = items.reduce((sum, m) => sum + m.cost, 0);
  const overdueCount = items.filter((m) => getNextStatus(m) === "overdue").length;
  const upcomingCount = items.filter((m) => getNextStatus(m) === "upcoming").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{items.length} revisões · {formatCurrency(totalCost)}</p>
          <div className="flex items-center gap-2 mt-1">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                <AlertTriangle className="h-3 w-3" />{overdueCount} vencida{overdueCount > 1 ? "s" : ""}
              </span>
            )}
            {upcomingCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-orange-500 font-medium">
                <Clock className="h-3 w-3" />{upcomingCount} próxima{upcomingCount > 1 ? "s" : ""}
              </span>
            )}
            {overdueCount === 0 && upcomingCount === 0 && items.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                <CheckCircle2 className="h-3 w-3" />Em dia
              </span>
            )}
          </div>
        </div>
        {(isOwner || true) && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Nova Revisão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Nova Manutenção
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Serviço *</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MAINTENANCE_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setSelectedType(t); form.setValue("type", t); }}
                        className={`rounded-lg border px-2 py-1.5 text-[11px] text-left transition-all ${selectedType === t ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:border-border"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {form.formState.errors.type && <p className="text-destructive text-[11px]">{form.formState.errors.type.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição *</Label>
                  <Input {...form.register("description")} placeholder="Detalhe o serviço realizado" className="h-9" />
                  {form.formState.errors.description && <p className="text-destructive text-[11px]">{form.formState.errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data *</Label>
                    <Input type="date" {...form.register("date")} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Km no momento *</Label>
                    <Input type="number" {...form.register("mileage", { valueAsNumber: true })} placeholder="0" className="h-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Custo Total (R$) *</Label>
                  <Input type="number" step="0.01" {...form.register("cost", { valueAsNumber: true })} placeholder="0,00" className="h-9" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Próxima revisão (data)</Label>
                    <Input type="date" {...form.register("nextMaintenanceDate")} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Próxima revisão (km)</Label>
                    <Input type="number" {...form.register("nextMaintenanceMileage", { valueAsNumber: true })} placeholder="0" className="h-9" />
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="w-full h-9">
                  {saving ? "Salvando..." : "Registrar Manutenção"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma manutenção registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((m) => {
            const status = getNextStatus(m);
            return (
              <div key={m.id} className={`rounded-xl border bg-card/30 p-3 md:p-4 transition-colors ${status === "overdue" ? "border-red-500/30 bg-red-500/5" : status === "upcoming" ? "border-orange-500/30 bg-orange-500/5" : "border-border/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5 ${status === "overdue" ? "bg-red-500/10 text-red-500" : status === "upcoming" ? "bg-orange-500/10 text-orange-500" : "bg-orange-500/10 text-orange-500"}`}>
                      <Wrench className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{m.type}</p>
                        {status === "overdue" && (
                          <Badge variant="destructive" className="text-[10px] py-0 h-4">Vencida</Badge>
                        )}
                        {status === "upcoming" && (
                          <Badge className="text-[10px] py-0 h-4 bg-orange-500 hover:bg-orange-500">Próxima</Badge>
                        )}
                        {status === "ok" && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 text-green-600 border-green-500/40">Em dia</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{m.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(m.date)}</span>
                        <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{formatMileage(m.mileage)}</span>
                        <span className="flex items-center gap-1 font-medium text-foreground"><DollarSign className="h-3 w-3" />{formatCurrency(m.cost)}</span>
                      </div>
                      {m.nextMaintenanceDate && (
                        <div className={`flex items-center gap-1 text-[11px] mt-2 font-medium ${status === "overdue" ? "text-red-500" : status === "upcoming" ? "text-orange-500" : "text-muted-foreground"}`}>
                          <Clock className="h-3 w-3" />
                          Próxima: {formatDate(m.nextMaintenanceDate)}
                          {m.nextMaintenanceMileage ? ` ou ${formatMileage(m.nextMaintenanceMileage)}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
