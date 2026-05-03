"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Key, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { accessLevelLabel, accessStatusLabel, formatDate } from "@/lib/auto-format";

interface Access {
  id: string;
  accessLevel: string;
  status: string;
  createdAt: string;
  notes?: string;
  user: { id: string; name?: string; email?: string; role: string };
  requester: { id: string; name?: string; email?: string };
}

export function AccessTab({ vehicleId, onUpdate }: { vehicleId: string; onUpdate: () => void }) {
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/vehicles/${vehicleId}/accesses`)
      .then((r) => r.json())
      .then((d) => setAccesses(d.accesses ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [vehicleId]);

  async function handleAction(id: string, action: "approve" | "reject" | "revoke") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/access-requests/${id}/${action}`, { method: "PUT" });
      if (res.ok) {
        toast.success(action === "approve" ? "Acesso aprovado!" : action === "reject" ? "Acesso rejeitado" : "Acesso revogado");
        load();
        onUpdate();
      } else {
        toast.error("Erro ao processar ação");
      }
    } catch { toast.error("Erro ao processar ação"); }
    finally { setProcessing(null); }
  }

  const pending = accesses.filter((a) => a.status === "PENDING");
  const active = accesses.filter((a) => a.status === "ACTIVE");
  const revoked = accesses.filter((a) => a.status === "REVOKED");

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-400/30",
    ACTIVE: "bg-green-500/10 text-green-600 border-green-400/30",
    REVOKED: "bg-gray-500/10 text-gray-500 border-gray-400/30",
  };

  return (
    <div className="space-y-5">
      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
            Aguardando aprovação ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((a) => (
              <div key={a.id} className="rounded-xl border border-yellow-400/30 bg-yellow-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{a.user.name ?? a.user.email ?? "Usuário"}</p>
                    <p className="text-muted-foreground text-xs">{a.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{accessLevelLabel(a.accessLevel)}</Badge>
                      <span className="text-[10px] text-muted-foreground">Solicitado em {formatDate(a.createdAt)}</span>
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{a.notes}"</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
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
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            Acessos Ativos ({active.length})
          </h3>
          <div className="space-y-2">
            {active.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/30 p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{a.user.name ?? a.user.email ?? "Usuário"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{accessLevelLabel(a.accessLevel)}</Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  disabled={processing === a.id}
                  onClick={() => handleAction(a.id, "revoke")}
                >
                  Revogar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : accesses.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Key className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma solicitação de acesso</p>
          <p className="text-xs mt-1">Mecânicas e revendas podem solicitar acesso a este veículo</p>
        </div>
      ) : null}

      {/* Revoked */}
      {revoked.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-3 text-muted-foreground">Acessos Revogados ({revoked.length})</h3>
          <div className="space-y-2 opacity-50">
            {revoked.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/20 p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm line-through">{a.user.name ?? a.user.email}</p>
                  <Badge variant="outline" className="text-[10px]">{accessLevelLabel(a.accessLevel)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
