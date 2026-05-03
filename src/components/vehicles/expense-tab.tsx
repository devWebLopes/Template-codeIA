"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, DollarSign, Calendar, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, expenseCategoryLabel } from "@/lib/auto-format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const CATEGORIES = [
  { value: "FUEL", label: "Combustível", color: "bg-blue-500/10 text-blue-600", bar: "bg-blue-500" },
  { value: "TAX", label: "Imposto", color: "bg-red-500/10 text-red-600", bar: "bg-red-500" },
  { value: "INSURANCE", label: "Seguro", color: "bg-purple-500/10 text-purple-600", bar: "bg-purple-500" },
  { value: "FINE", label: "Multa", color: "bg-orange-500/10 text-orange-600", bar: "bg-orange-500" },
  { value: "WASH", label: "Lavagem", color: "bg-cyan-500/10 text-cyan-600", bar: "bg-cyan-500" },
  { value: "PARKING", label: "Estacionamento", color: "bg-yellow-500/10 text-yellow-700", bar: "bg-yellow-500" },
  { value: "MAINTENANCE", label: "Manutenção", color: "bg-green-500/10 text-green-600", bar: "bg-green-500" },
  { value: "OTHER", label: "Outro", color: "bg-gray-500/10 text-gray-600", bar: "bg-gray-400" },
];

const schema = z.object({
  date: z.string().min(1),
  category: z.enum(["FUEL", "TAX", "INSURANCE", "FINE", "WASH", "PARKING", "MAINTENANCE", "OTHER"]),
  description: z.string().min(1),
  value: z.number({ invalid_type_error: "Valor inválido" }).min(0),
});

type FormData = z.infer<typeof schema>;

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  value: number;
}

export function ExpenseTab({ vehicleId, isOwner, onUpdate }: { vehicleId: string; isOwner: boolean; onUpdate: () => void }) {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { value: 0 },
  });

  const load = () => {
    fetch(`/api/vehicles/${vehicleId}/expenses`)
      .then((r) => r.json())
      .then((d) => setItems(d.expenses ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [vehicleId]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }
      toast.success("Despesa registrada!");
      setOpen(false);
      form.reset();
      load();
      onUpdate();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta despesa?")) return;
    await fetch(`/api/vehicles/${vehicleId}/expenses/${id}`, { method: "DELETE" });
    toast.success("Despesa excluída");
    load();
    onUpdate();
  }

  const filtered = filter === "ALL" ? items : items.filter((e) => e.category === filter);
  const total = items.reduce((sum, e) => sum + e.value, 0);
  const catColor = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.color ?? "bg-gray-500/10 text-gray-600";

  // Category breakdown
  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    amount: items.filter((e) => e.category === c.value).reduce((s, e) => s + e.value, 0),
  })).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const maxAmount = byCategory[0]?.amount ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{filtered.length} despesas</p>
          <p className="text-xs text-muted-foreground">Total: {formatCurrency(total)}</p>
        </div>
        {isOwner && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Nova Despesa
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria *</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => form.setValue("category", c.value as FormData["category"])}
                        className={`rounded-lg border px-2 py-2 text-[11px] text-center transition-all ${form.watch("category") === c.value ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:border-border"}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição *</Label>
                  <Input {...form.register("description")} placeholder="Descreva a despesa" className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data *</Label>
                    <Input type="date" {...form.register("date")} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor (R$) *</Label>
                    <Input type="number" step="0.01" {...form.register("value", { valueAsNumber: true })} placeholder="0,00" className="h-9" />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="w-full h-9">
                  {saving ? "Salvando..." : "Registrar Despesa"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Breakdown */}
      {!loading && byCategory.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card/20 p-3 space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">Gastos por categoria</p>
          {byCategory.map((c) => (
            <div key={c.value} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-medium">{formatCurrency(c.amount)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.bar} transition-all duration-500`}
                  style={{ width: `${(c.amount / maxAmount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${filter === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
        >
          Todos
        </button>
        {CATEGORIES.filter((c) => items.some((e) => e.category === c.value)).map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${filter === c.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma despesa registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${catColor(e.category)}`}>
                {expenseCategoryLabel(e.category).charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{e.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />{formatDate(e.date)}
                  <Badge variant="outline" className="text-[10px] py-0">{expenseCategoryLabel(e.category)}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-sm">{formatCurrency(e.value)}</span>
                {isOwner && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(e.id)}>
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
