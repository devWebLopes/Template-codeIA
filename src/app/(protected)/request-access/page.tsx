"use client";

import { useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Search, Car, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const ACCESS_LEVELS = [
  { value: "READ_ONLY", label: "Somente Leitura", desc: "Visualizar histórico do veículo" },
  { value: "EDIT_MAINTENANCE", label: "Editar Manutenções", desc: "Adicionar e editar revisões" },
  { value: "FULL_ACCESS", label: "Acesso Total", desc: "Acesso completo ao veículo" },
];

const schema = z.object({
  vehiclePlate: z.string().min(1, "Placa obrigatória"),
  accessLevel: z.enum(["READ_ONLY", "EDIT_MAINTENANCE", "FULL_ACCESS"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RequestAccessPage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useSetPageMetadata({
    title: "Solicitar Acesso",
    description: "Solicitar acesso a um veículo",
    breadcrumbs: [{ label: "Solicitar Acesso" }],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accessLevel: "READ_ONLY" },
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, vehiclePlate: data.vehiclePlate.toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao solicitar acesso");
        return;
      }
      setSuccess(true);
      toast.success("Solicitação enviada! Aguarde aprovação do proprietário.");
    } catch {
      toast.error("Erro ao solicitar acesso");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 mx-auto mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="font-bold text-lg mb-2">Solicitação Enviada!</h2>
        <p className="text-muted-foreground text-sm mb-6">
          O proprietário do veículo receberá sua solicitação e poderá aprová-la ou rejeitá-la.
        </p>
        <Button onClick={() => { setSuccess(false); form.reset(); }}>
          Nova Solicitação
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Key className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">Solicitar Acesso a Veículo</h1>
          <p className="text-muted-foreground text-xs">Para mecânicas e revendas</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs">Placa do Veículo *</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              {...form.register("vehiclePlate")}
              placeholder="ABC1D23"
              className="pl-9 h-11 uppercase font-mono text-base tracking-wider"
            />
          </div>
          {form.formState.errors.vehiclePlate && (
            <p className="text-destructive text-xs">{form.formState.errors.vehiclePlate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Nível de Acesso *</Label>
          <div className="space-y-2">
            {ACCESS_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => form.setValue("accessLevel", level.value as FormData["accessLevel"])}
                className={`w-full rounded-xl border p-3 text-left transition-all ${form.watch("accessLevel") === level.value ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}
              >
                <p className="font-medium text-sm">{level.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{level.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Motivo / Observações (opcional)</Label>
          <Input
            {...form.register("notes")}
            placeholder="Informe o motivo da solicitação..."
            className="h-11"
          />
        </div>

        <div className="rounded-xl bg-muted/40 p-3">
          <div className="flex items-start gap-2">
            <Car className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              O proprietário do veículo receberá uma notificação e poderá aprovar ou rejeitar sua solicitação. Você será notificado quando houver uma resposta.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full h-11 gap-2">
          <Key className="h-4 w-4" />
          {saving ? "Enviando..." : "Solicitar Acesso"}
        </Button>
      </form>
    </div>
  );
}
