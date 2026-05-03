"use client";

import { useEffect, useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Car, Clock, CheckCircle2, XCircle, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { formatDate, accessLevelLabel, accessStatusLabel } from "@/lib/auto-format";
import Link from "next/link";

interface AccessEntry {
  id: string;
  status: string;
  accessLevel: string;
  createdAt: string;
  notes?: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
  };
}

interface PendingRequest {
  id: string;
  status: string;
  accessLevel: string;
  createdAt: string;
  notes?: string;
  vehicle: { id: string; brand: string; model: string; year: number; licensePlate: string };
  user: { id: string; name?: string; email?: string; role: string };
}

export default function AccessManagementPage() {
  const [myAccesses, setMyAccesses] = useState<AccessEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [plate, setPlate] = useState("");
  const [accessLevel, setAccessLevel] = useState("READ_ONLY");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useSetPageMetadata({
    title: "Gerenciar Acessos",
    description: "Acessos a veículos e solicitações pendentes",
    breadcrumbs: [{ label: "Acessos" }],
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/access-requests").then((r) => r.json()),
      fetch("/api/access-requests/pending").then((r) => r.json()),
    ])
      .then(([myData, pendingData]) => {
        setMyAccesses(myData.accesses ?? []);
        setPendingRequests(pendingData.pending ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleRequest = async () => {
    if (!plate.trim()) return toast.error("Informe a placa do veículo");
    setSubmitting(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehiclePlate: plate.trim().toUpperCase(), accessLevel, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao solicitar acesso"); return; }
      toast.success("Solicitação enviada! Aguarde aprovação do proprietário.");
      setPlate(""); setNotes(""); setAccessLevel("READ_ONLY"); setShowForm(false);
      loadData();
    } catch {
      toast.error("Erro ao solicitar acesso");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/access-requests/${id}/approve`, { method: "PUT" });
      if (res.ok) { toast.success("Acesso aprovado"); loadData(); }
      else toast.error("Erro ao aprovar");
    } finally { setProcessing(null); }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/access-requests/${id}/reject`, { method: "PUT" });
      if (res.ok) { toast.success("Acesso recusado"); loadData(); }
      else toast.error("Erro ao recusar");
    } finally { setProcessing(null); }
  };

  const handleRevoke = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/access-requests/${id}/revoke`, { method: "PUT" });
      if (res.ok) { toast.success("Acesso revogado"); loadData(); }
      else toast.error("Erro ao revogar");
    } finally { setProcessing(null); }
  };

  function StatusBadge({ status }: { status: string }) {
    if (status === "ACTIVE") return <Badge variant="outline" className="text-[10px] border-green-400 text-green-600 gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Ativo</Badge>;
    if (status === "PENDING") return <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-500 gap-1"><Clock className="h-2.5 w-2.5" />Pendente</Badge>;
    if (status === "REJECTED") return <Badge variant="outline" className="text-[10px] border-red-400 text-red-500 gap-1"><XCircle className="h-2.5 w-2.5" />Recusado</Badge>;
    return <Badge variant="outline" className="text-[10px]">{accessStatusLabel(status)}</Badge>;
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadData} className="h-8 gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Solicitar Acesso
          </Button>
        </div>
      </div>

      {/* Request Access Form */}
      {showForm && (
        <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Solicitar Acesso a Veículo
          </h2>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs mb-1 block">Placa do Veículo</Label>
              <Input
                placeholder="Ex: ABC-1234 ou ABC1D23"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                maxLength={8}
                className="uppercase"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Nível de Acesso</Label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="READ_ONLY">Somente Leitura</option>
                <option value="EDIT_MAINTENANCE">Editar Manutenções</option>
                <option value="FULL_ACCESS">Acesso Total</option>
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Observações (opcional)</Label>
              <Input
                placeholder="Ex: Sou o mecânico responsável"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRequest} disabled={submitting} size="sm" className="flex-1">
                {submitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Pending requests for my vehicles */}
      {!loading && pendingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-sm">Solicitações Pendentes para Meus Veículos</h2>
            <Badge className="text-[10px] bg-orange-500">{pendingRequests.length}</Badge>
          </div>
          {pendingRequests.map((req) => (
            <div key={req.id} className="rounded-xl border border-orange-400/30 bg-orange-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                  <Key className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{req.user.name ?? req.user.email ?? "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">{req.user.email}</p>
                  <p className="text-xs mt-1">
                    Solicita acesso a: <span className="font-medium">{req.vehicle.brand} {req.vehicle.model} {req.vehicle.year} — {req.vehicle.licensePlate}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Nível: {accessLevelLabel(req.accessLevel)}</p>
                  {req.notes && <p className="text-xs mt-1 text-muted-foreground italic">"{req.notes}"</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">{formatDate(req.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleApprove(req.id)}
                  disabled={processing === req.id}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleReject(req.id)}
                  disabled={processing === req.id}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Recusar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My accesses to other vehicles */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          Meus Acessos a Outros Veículos
        </h2>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : myAccesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-10 text-center">
            <Key className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <h3 className="font-semibold text-sm mb-1">Nenhum acesso compartilhado</h3>
            <p className="text-muted-foreground text-xs mb-4">
              Solicite acesso a um veículo usando a placa para visualizar ou gerenciar seus dados.
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Solicitar Acesso
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {myAccesses.map((a) => (
              <div key={a.id} className="rounded-xl border border-border/40 bg-card/30 p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Car className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={a.status === "ACTIVE" ? `/vehicles/${a.vehicle.id}` : "#"} className="font-medium text-sm hover:underline">
                      {a.vehicle.brand} {a.vehicle.model} {a.vehicle.year}
                    </Link>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-muted-foreground text-xs">{a.vehicle.licensePlate} · {accessLevelLabel(a.accessLevel)}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(a.createdAt)}</p>
                </div>
                {a.status === "ACTIVE" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7 shrink-0"
                    onClick={() => handleRevoke(a.id)}
                    disabled={processing === a.id}
                  >
                    Revogar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
