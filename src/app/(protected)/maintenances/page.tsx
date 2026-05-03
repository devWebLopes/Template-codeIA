"use client";

import { useEffect, useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Wrench, Search, Calendar, Gauge, DollarSign, Car } from "lucide-react";
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
  vehicle: { brand: string; model: string; year: number; licensePlate: string };
}

export default function MaintenancesPage() {
  const [items, setItems] = useState<MaintenanceWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useSetPageMetadata({
    title: "Manutenções",
    description: "Histórico de manutenções de todos os veículos",
    breadcrumbs: [{ label: "Manutenções" }],
  });

  useEffect(() => {
    // Fetch vehicles then their maintenances
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then(async ({ vehicles }) => {
        if (!vehicles || vehicles.length === 0) return;
        const all = await Promise.all(
          vehicles.map(async (v: { id: string; brand: string; model: string; year: number; licensePlate: string }) => {
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

  const filtered = items.filter((m) =>
    `${m.type} ${m.description} ${m.vehicle.brand} ${m.vehicle.model}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = filtered.reduce((sum, m) => sum + m.cost, 0);

  return (
    <div className="space-y-4">
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
            {search ? "Nenhuma manutenção encontrada" : "Nenhuma manutenção registrada"}
          </h3>
          <p className="text-muted-foreground text-xs mb-4">
            {!search && "Acesse um veículo para registrar manutenções."}
          </p>
          {!search && (
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
          {filtered.map((m) => (
            <Link key={m.id} href={`/vehicles/${m.vehicleId}`}>
              <div className="rounded-xl border border-border/40 bg-card/30 p-4 hover:bg-card/60 hover:border-primary/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{m.type}</p>
                      {m.nextMaintenanceDate && new Date(m.nextMaintenanceDate) > new Date() && (
                        <Badge variant="outline" className="text-[10px]">Próxima: {formatDate(m.nextMaintenanceDate)}</Badge>
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
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
