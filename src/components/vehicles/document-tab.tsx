"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Calendar, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, documentTypeLabel, daysUntil, isExpiringSoon, isExpired } from "@/lib/auto-format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const DOC_TYPES = ["IPVA", "LICENSING", "INSURANCE_POLICY", "FINE", "CRLV", "OTHER"];

const schema = z.object({
  type: z.enum(["IPVA", "LICENSING", "INSURANCE_POLICY", "FINE", "CRLV", "OTHER"]),
  description: z.string().optional(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
  value: z.number().optional().nullable(),
  documentUrl: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Document {
  id: string;
  type: string;
  description?: string;
  issueDate?: string;
  expirationDate?: string;
  value?: number;
  documentUrl?: string;
}

export function DocumentTab({ vehicleId, isOwner, onUpdate }: { vehicleId: string; isOwner: boolean; onUpdate: () => void }) {
  const [items, setItems] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "IPVA" },
  });

  const load = () => {
    fetch(`/api/vehicles/${vehicleId}/documents`)
      .then((r) => r.json())
      .then((d) => setItems(d.documents ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [vehicleId]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }
      toast.success("Documento registrado!");
      setOpen(false);
      form.reset();
      load();
      onUpdate();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  function getStatusBadge(doc: Document) {
    if (!doc.expirationDate) return null;
    if (isExpired(doc.expirationDate)) return <Badge variant="destructive" className="text-[10px]">Vencido</Badge>;
    if (isExpiringSoon(doc.expirationDate)) return <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-500">Vence em {daysUntil(doc.expirationDate)}d</Badge>;
    return <Badge variant="outline" className="text-[10px] border-green-400 text-green-600">Válido</Badge>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{items.length} documentos</p>
        {isOwner && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Adicionar Documento
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DOC_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => form.setValue("type", t as FormData["type"])}
                        className={`rounded-lg border py-2 text-[11px] transition-all ${form.watch("type") === t ? "border-primary bg-primary/10 text-primary" : "border-border/40"}`}
                      >
                        {documentTypeLabel(t)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição</Label>
                  <Input {...form.register("description")} placeholder="Descrição do documento" className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data de emissão</Label>
                    <Input type="date" {...form.register("issueDate")} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vencimento</Label>
                    <Input type="date" {...form.register("expirationDate")} className="h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input type="number" step="0.01" {...form.register("value", { valueAsNumber: true })} placeholder="0,00" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Link do documento</Label>
                  <Input {...form.register("documentUrl")} placeholder="https://..." className="h-9" />
                </div>
                <Button type="submit" disabled={saving} className="w-full h-9">
                  {saving ? "Salvando..." : "Adicionar Documento"}
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
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum documento registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <div key={d.id} className="rounded-xl border border-border/40 bg-card/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{documentTypeLabel(d.type)}</span>
                      {getStatusBadge(d)}
                    </div>
                    {d.description && <p className="text-muted-foreground text-xs mt-0.5">{d.description}</p>}
                    <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      {d.expirationDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Vence: {formatDate(d.expirationDate)}
                        </span>
                      )}
                      {d.value && <span className="font-medium text-foreground">{formatCurrency(d.value)}</span>}
                    </div>
                  </div>
                </div>
                {d.documentUrl && (
                  <a href={d.documentUrl} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline shrink-0">
                    Ver
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
