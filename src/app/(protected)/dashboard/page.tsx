"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import Link from "next/link";
import {
  Car, Wrench, Fuel, AlertTriangle, TrendingUp, Plus,
  ChevronRight, Calendar, DollarSign, Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatMileage, fuelTypeLabel } from "@/lib/auto-format";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  currentMileage: number;
  fuelType: string;
  imageUrl?: string;
  color?: string;
  _count?: { maintenances: number; expenses: number };
}

interface DashboardData {
  vehicles: Vehicle[];
  totalVehicles: number;
  upcomingMaintenances: {
    id: string;
    vehicleId: string;
    type: string;
    nextMaintenanceDate: string;
    vehicle: { brand: string; model: string; year: number };
  }[];
  recentExpenses: {
    id: string;
    vehicleId: string;
    description: string;
    value: number;
    date: string;
    category: string;
    vehicle: { brand: string; model: string; year: number };
  }[];
  totalExpensesThisMonth: number;
  totalFuelThisMonth: number;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useSetPageMetadata({
    title: `Bem-vindo, ${user?.firstName || "Motorista"}!`,
    description: "Visão geral dos seus veículos",
    breadcrumbs: [{ label: "Dashboard" }],
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Car}
          label="Veículos"
          value={loading ? null : String(data?.totalVehicles ?? 0)}
          color="blue"
        />
        <StatCard
          icon={Wrench}
          label="Revisões Próximas"
          value={loading ? null : String(data?.upcomingMaintenances?.length ?? 0)}
          color="orange"
        />
        <StatCard
          icon={DollarSign}
          label="Gastos este mês"
          value={loading ? null : formatCurrency(data?.totalExpensesThisMonth ?? 0)}
          color="green"
        />
        <StatCard
          icon={Fuel}
          label="Combustível/mês"
          value={loading ? null : formatCurrency(data?.totalFuelThisMonth ?? 0)}
          color="purple"
        />
      </div>

      {/* Vehicles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm md:text-base">Meus Veículos</h2>
          <Link href="/vehicles/new">
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Adicionar
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : data?.vehicles.length === 0 ? (
          <EmptyVehicles />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Maintenances */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm md:text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-orange-500" />
              Próximas Revisões
            </h2>
            <Link href="/maintenances">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)
            ) : data?.upcomingMaintenances.length === 0 ? (
              <p className="text-muted-foreground text-xs py-4 text-center">Nenhuma revisão agendada</p>
            ) : (
              data?.upcomingMaintenances.slice(0, 4).map((m) => (
                <Link key={m.id} href={`/vehicles/${m.vehicleId}`} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-3 hover:bg-card/60 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs truncate">{m.type}</p>
                    <p className="text-muted-foreground text-[11px] truncate">
                      {m.vehicle.brand} {m.vehicle.model} · {formatDate(m.nextMaintenanceDate)}
                    </p>
                  </div>
                  <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm md:text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Despesas Recentes
            </h2>
            <Link href="/expenses">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)
            ) : data?.recentExpenses.length === 0 ? (
              <p className="text-muted-foreground text-xs py-4 text-center">Nenhuma despesa registrada</p>
            ) : (
              data?.recentExpenses.slice(0, 4).map((e) => (
                <Link key={e.id} href={`/vehicles/${e.vehicleId}`} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-3 hover:bg-card/60 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500 shrink-0">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs truncate">{e.description}</p>
                    <p className="text-muted-foreground text-[11px] truncate">
                      {e.vehicle.brand} {e.vehicle.model} · {formatDate(e.date)}
                    </p>
                  </div>
                  <span className="font-semibold text-xs text-green-600 shrink-0">
                    {formatCurrency(e.value)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{className?: string}>; label: string; value: string | null; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-500",
    orange: "bg-orange-500/10 text-orange-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
  };
  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-3 md:p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[color]} mb-2`}>
        <Icon className="h-4 w-4" />
      </div>
      {value === null ? (
        <Skeleton className="h-6 w-16 mb-1" />
      ) : (
        <p className="font-bold text-base md:text-lg">{value}</p>
      )}
      <p className="text-muted-foreground text-[11px] md:text-xs">{label}</p>
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <div className="rounded-xl border border-border/40 bg-card/30 p-4 hover:bg-card/60 hover:border-primary/30 transition-all group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-[10px]">
            {fuelTypeLabel(vehicle.fuelType)}
          </Badge>
        </div>
        <h3 className="font-semibold text-sm">{vehicle.brand} {vehicle.model}</h3>
        <p className="text-muted-foreground text-xs mb-2">{vehicle.year} · {vehicle.licensePlate}</p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Gauge className="h-3 w-3" />
          {formatMileage(vehicle.currentMileage)}
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground absolute top-4 right-4 group-hover:text-primary transition-colors hidden group-hover:block" />
      </div>
    </Link>
  );
}

function EmptyVehicles() {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
        <Car className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-sm mb-1">Nenhum veículo cadastrado</h3>
      <p className="text-muted-foreground text-xs mb-4">Adicione seu primeiro veículo para começar a controlar manutenções e despesas.</p>
      <Link href="/vehicles/new">
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Veículo
        </Button>
      </Link>
    </div>
  );
}
