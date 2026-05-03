"use client";

import { useEffect, useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Fuel, Calendar, Gauge, Car } from "lucide-react";
import { formatCurrency, formatDate, formatMileage, fuelTypeLabel } from "@/lib/auto-format";

interface FuelLogWithVehicle {
  id: string;
  vehicleId: string;
  date: string;
  fuelType: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  stationName?: string;
  fullTank: boolean;
  vehicle: { brand: string; model: string; year: number; licensePlate: string };
}

export default function FuelPage() {
  const [items, setItems] = useState<FuelLogWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useSetPageMetadata({
    title: "Combustível",
    description: "Histórico de abastecimentos",
    breadcrumbs: [{ label: "Combustível" }],
  });

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then(async ({ vehicles }) => {
        if (!vehicles || vehicles.length === 0) return;
        const all = await Promise.all(
          vehicles.map(async (v: { id: string; brand: string; model: string; year: number; licensePlate: string }) => {
            const res = await fetch(`/api/vehicles/${v.id}/fuel-logs`);
            const { fuelLogs } = await res.json();
            return (fuelLogs ?? []).map((f: FuelLogWithVehicle) => ({ ...f, vehicle: v }));
          })
        );
        const flat = all.flat().sort((a: FuelLogWithVehicle, b: FuelLogWithVehicle) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItems(flat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalCost = items.reduce((sum, f) => sum + f.totalCost, 0);
  const totalLiters = items.reduce((sum, f) => sum + f.liters, 0);

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="font-bold">{formatCurrency(totalCost)}</p>
            <p className="text-muted-foreground text-xs">Total gasto</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="font-bold">{totalLiters.toFixed(1)}L</p>
            <p className="text-muted-foreground text-xs">Total abastecido</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-12 text-center">
          <Fuel className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <h3 className="font-semibold text-sm mb-4">Nenhum abastecimento registrado</h3>
          <Link href="/vehicles">
            <Button variant="outline" size="sm"><Car className="h-4 w-4 mr-2" />Ver Veículos</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <Link key={f.id} href={`/vehicles/${f.vehicleId}`}>
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3 hover:bg-card/60 transition-all">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                  <Fuel className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{fuelTypeLabel(f.fuelType)}</p>
                    <span className="text-xs text-muted-foreground">{f.liters.toFixed(1)}L · R$ {f.pricePerLiter.toFixed(3)}/L</span>
                  </div>
                  <p className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5">
                    <Car className="h-3 w-3" />
                    {f.vehicle.brand} {f.vehicle.model} · {f.vehicle.licensePlate}
                    <Calendar className="h-3 w-3 ml-1" />{formatDate(f.date)}
                    <Gauge className="h-3 w-3 ml-1" />{formatMileage(f.mileage)}
                  </p>
                </div>
                <span className="font-semibold text-sm shrink-0">{formatCurrency(f.totalCost)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
