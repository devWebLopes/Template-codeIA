"use client";

import { useEffect, useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Wrench, Search, Calendar, Gauge, DollarSign, Car, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate, formatMileage } from "@/lib/auto-format";

interface MaintenanceWithVehicle {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  nextMaintenanceDate?: string;
  vehicle: { id: string; brand: string; model: string; year: number; licensePlate: string };
}

function getStatus(m: MaintenanceWithVehicle): "overdue" | "upcoming" | "ok" | null {
  if (!m.nextMaintenanceDate) return null;
  const next = new Date(m.nextMaintenanceDate);
  const now = new Date();
  const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "overdue";
  if (days <= 30) return "upcoming";
  return "ok";
}

export default function MaintenancesPage() {
  const [items, setItems] = useState<MaintenanceWithVehicle[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; brand: string; model: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useSetPageMetadata({
    title: "Manutenções",
    description: "Histórico de manutenções de todos os veículos",
    breadcrumbs: [{ label: "Manutenções" }],
  });

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then(async ({ vehicles: vs }) => {
        if (!vs || vs.length === 0) return;
        setVehicles(vs.map((v: MaintenanceWithVehicle["vehicle"]) => ({ id: v.id, brand: v.brand, model: v.model })));
        const all = await Promise.all(
          vs.map(async (v: MaintenanceWithVehicle["vehicle"]) => {
            const res = await fetch(`/api/vehicles/${v.id}/maintenances`);
            const { maintenances } = await res.json();
            return (maintenances ?? []).map((m: MaintenanceWithVehicle) => ({ ...m, vehicle: v }));
          })
        );
        const flat = all.flat().sort((a: MaintenanceWithVehicle, b: MaintenanceWithVehicle) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItems(flat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((m) => {
    const textMatch = `${m.type} ${m.description} ${m.vehicle.brand} ${m.vehicle.model}`.toLowerCase().includes(search.toLowerCase());
    const vehicleMatch = vehicleFilter === "ALL" || m.vehicleId === vehicleFilter;
    const status = getStatus(m);
    const statusMatch = statusFilter === "ALL"
      || (statusFilter === "overdue" && status === "overdue")
      || (statusFilter === "upcoming" && status === "upcoming")
      || (statusFilter === "ok" && status === "ok");
    return textMatch && vehicleMatch && statusMatch;
  });

  const totalCost = filtered.reduce((sum, m) => sum + m.cost, 0);
  const overdueCount = items.filter((m) => getStatus(m) === "overdue").length;
  const upcomingCount = items.filter((m) => getStatus(m) === "upcoming").length;

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {!loading && (overdueCount > 0 || upcomingCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {overdueCount > 0 && (
            <button
              onClick={() => setStatusFilter(statusFilter === "overdue" ? "ALL" : "overdue")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === "overdue" ? "bg-red-500 text-white" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"}`}
            >
              <AlertTriangle className="h-3 w-3" />
              {overdueCount} revisão{overdueCount > 1 ? "ões" : ""} vencida{overdueCount > 1 ? "s" : ""}
            </button>
          )}
          {upcomingCount > 0 && (
            <button
              onClick={() => setStatusFilter(statusFilter === "upcoming" ? "ALL" : "upcoming")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === "upcoming" ? "bg-orange-500 text-white" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"}`}
            >
              <Clock className="h-3 w-3" />
              {upcomingCount} próxima{upcomingCount > 1 ? "s" : ""} (30 dias)
            </button>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar manutenção..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {vehicles.length > 1 && (
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="ALL">Todos os veículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.brand} {v.model}</option>
            ))}
          </select>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} revisões</span>
          <span>Total: <span className="font-semibold text-foreground">{formatCurrency(totalCost)}</span></span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-12 text-center">
          <Wrench className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <h3 className="font-semibold text-sm mb-1">
            {search || vehicleFilter !== "ALL" || statusFilter !== "ALL" ? "Nenhuma manutenção encontrada" : "Nenhuma manutenção registrada"}
          </h3>
          <p className="text-muted-foreground text-xs mb-4">
            {!search && vehicleFilter === "ALL" && statusFilter === "ALL" && "Acesse um veículo para registrar manutenções."}
          </p>
          {!search && vehicleFilter === "ALL" && statusFilter === "ALL" && (
            <Link href="/vehicles">
              <Button variant="outline" size="sm">
                <Car className="h-4 w-4 mr-2" />
                Ver Veículos
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const status = getStatus(m);
            return (
              <Link key={m.id} href={`/vehicles/${m.vehicleId}`}>
                <div className={`rounded-xl border p-4 hover:bg-card/60 transition-all ${status === "overdue" ? "border-red-500/30 bg-red-500/5" : status === "upcoming" ? "border-orange-500/30 bg-orange-500/5" : "border-border/40 bg-card/30"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${status === "overdue" ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"}`}>
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{m.type}</p>
                        {status === "overdue" && (
                          <Badge variant="destructive" className="text-[10px] py-0 h-4 flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />Vencida
                          </Badge>
                        )}
                        {status === "upcoming" && (
                          <Badge className="text-[10px] py-0 h-4 bg-orange-500 hover:bg-orange-500 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />Próxima
                          </Badge>
                        )}
                        {status === "ok" && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 text-green-600 border-green-500/40 flex items-center gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" />Em dia
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1.5">
                        <Car className="h-3 w-3" />
                        {m.vehicle.brand} {m.vehicle.model} {m.vehicle.year} · {m.vehicle.licensePlate}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(m.date)}</span>
                        <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{formatMileage(m.mileage)}</span>
                        <span className="flex items-center gap-1 font-semibold text-foreground"><DollarSign className="h-3 w-3" />{formatCurrency(m.cost)}</span>
                        {m.nextMaintenanceDate && (
                          <span className={`flex items-center gap-1 ${status === "overdue" ? "text-red-500 font-medium" : status === "upcoming" ? "text-orange-500 font-medium" : ""}`}>
                            <Clock className="h-3 w-3" />Próxima: {formatDate(m.nextMaintenanceDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
