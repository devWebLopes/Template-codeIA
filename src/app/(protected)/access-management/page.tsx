"use client";

import { useEffect, useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Key, CheckCircle, XCircle, Car, Clock } from "lucide-react";
import { accessLevelLabel, formatDate } from "@/lib/auto-format";

interface PendingAccess {
  id: string;
  accessLevel: string;
  status: string;
  createdAt: string;
  notes?: string;
  vehicle: { id: string; brand: string; model: string; year: number; licensePlate: string };
  user: { id: string; name?: string; email?: string; role: string };
}

export default function AccessManagementPage() {
  const [pending, setPending] = useState<PendingAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useSetPageMetadata({
    title: "Gerenciar Acessos",
    description: "Solicitações de acesso aos seus veículos",
    breadcrumbs: [{ label: "Acessos" }],
  });

  const load = () => {
    fetch("/api/access-requests/pending")
      .then((r) => r.json())
      .then((d) => setPending(d.pending ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/access-requests/${id}/${action}`, { method: "PUT" });
      if (res.ok) {
        toast.success(action === "approve" ? "Acesso aprovado!" : "Acesso rejeitado");
        load();
      } else {
        toast.error("Erro ao processar ação");
      }
    } catch { toast.error("Erro ao processar ação"); }
    finally { setProcessing(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Key className="h-4 w-4" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">Solicitações de Acesso</h1>
          <p className="text-muted-foreground text-xs">Gerencie quem pode acessar seus veículos</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
            <Key className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-sm mb-1">Nenhuma solicitação pendente</h3>
          <p className="text-muted-foreground text-xs max-w-xs mx-auto">
            Quando mecânicas ou revendas solicitarem acesso aos seus veículos, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <div key={a.id} className="rounded-xl border border-yellow-400/30 bg-yellow-500/5 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Pendente · {formatDate(a.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">{a.vehicle.brand} {a.vehicle.model} {a.vehicle.year}</p>
                    <span className="text-muted-foreground text-xs">{a.vehicle.licensePlate}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{a.user.name ?? "Usuário"}</p>
                    <p className="text-muted-foreground text-xs">{a.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {accessLevelLabel(a.accessLevel)}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {a.user.role === "MECHANIC" ? "Mecânica" : a.user.role === "DEALERSHIP" ? "Revenda" : "Usuário"}
                      </Badge>
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{a.notes}"</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700"
                    disabled={processing === a.id}
                    onClick={() => handleAction(a.id, "approve")}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs border-red-400/40 text-red-500 hover:bg-red-500/10"
                    disabled={processing === a.id}
                    onClick={() => handleAction(a.id, "reject")}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
