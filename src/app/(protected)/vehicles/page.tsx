"use client";

import { useEffect, useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import Link from "next/link";
import { Car, Plus, Fuel, Gauge, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMileage, fuelTypeLabel } from "@/lib/auto-format";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  currentMileage: number;
  fuelType: string;
  imageUrl?: string;
  _count: { maintenances: number; expenses: number; fuelLogs: number };
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useSetPageMetadata({
    title: "Meus Veículos",
    description: "Gerencie sua frota",
    breadcrumbs: [{ label: "Veículos" }],
  });

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => setVehicles(d.vehicles ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter(
    (v) =>
      `${v.brand} ${v.model} ${v.licensePlate} ${v.year}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/vehicles/new">
          <Button className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Veículo
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
            <Car className="h-7 w-7" />
          </div>
          <h3 className="font-semibold mb-2">
            {search ? "Nenhum veículo encontrado" : "Nenhum veículo cadastrado"}
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            {search ? "Tente outro termo de busca." : "Cadastre seu primeiro veículo para começar a acompanhar manutenções e despesas."}
          </p>
          {!search && (
            <Link href="/vehicles/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Veículo
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      )}
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <div className="group rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all overflow-hidden">
        {/* Color Strip */}
        <div className="h-1 bg-primary/30 group-hover:bg-primary/60 transition-colors" />

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Car className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-[10px]">
                {fuelTypeLabel(vehicle.fuelType)}
              </Badge>
              {vehicle.color && (
                <span className="text-[10px] text-muted-foreground">{vehicle.color}</span>
              )}
            </div>
          </div>

          <h3 className="font-semibold">{vehicle.brand} {vehicle.model}</h3>
          <p className="text-muted-foreground text-xs mb-3">
            {vehicle.year} · {vehicle.licensePlate}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              {formatMileage(vehicle.currentMileage)}
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" />
              {vehicle._count.fuelLogs} abast.
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{vehicle._count.maintenances} revisões · {vehicle._count.expenses} despesas</span>
            <ChevronRight className="h-3 w-3 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
