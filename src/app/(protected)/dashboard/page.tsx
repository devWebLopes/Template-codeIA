"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import Link from "next/link";
import {
  Car, Wrench, Fuel, AlertTriangle, TrendingUp, Plus,
  ChevronRight, DollarSign, Gauge, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatMileage, fuelTypeLabel } from "@/lib/auto-format";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  currentMileage: number;
  fuelType: string;
  color?: string;
  _count?: { maintenances: number; expenses: number; fuelLogs: number };
}

interface MonthlyData {
  month: string;
  despesas: number;
  combustivel: number;
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
  monthlyChart: MonthlyData[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur p-3 shadow-lg text-xs">
        <p className="font-semibold mb-1.5 text-foreground">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}: <span className="font-medium">{formatCurrency(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
      .then((d) => { if (d.vehicles) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasChart = data?.monthlyChart?.some((m) => m.despesas > 0 || m.combustivel > 0);

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Car} label="Veículos" value={loading ? null : String(data?.totalVehicles ?? 0)} color="blue" />
        <StatCard icon={Wrench} label="Revisões Próximas" value={loading ? null : String(data?.upcomingMaintenances?.length ?? 0)} color="orange" />
        <StatCard icon={DollarSign} label="Gastos este mês" value={loading ? null : formatCurrency(data?.totalExpensesThisMonth ?? 0)} color="green" />
        <StatCard icon={Fuel} label="Combustível/mês" value={loading ? null : formatCurrency(data?.totalFuelThisMonth ?? 0)} color="purple" />
      </div>

      {/* Monthly Expenses Chart */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm md:text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Gastos dos Últimos 6 Meses
          </h2>
        </div>
        {loading ? (
          <Skeleton className="h-44 w-full rounded-lg" />
        ) : !hasChart ? (
          <div className="h-44 flex flex-col items-center justify-center text-muted-foreground">
            <BarChart2 className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs">Nenhum dado de gastos ainda</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={176}>
            <BarChart data={data?.monthlyChart} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`}
                width={32}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4, radius: 4 }} />
              <Legend
                formatter={(value) => <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="combustivel" name="Combustível" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
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
            {[1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : !data?.vehicles?.length ? (
          <EmptyVehicles />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
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
            ) : !data?.upcomingMaintenances?.length ? (
              <p className="text-muted-foreground text-xs py-4 text-center">Nenhuma revisão agendada para os próximos 30 dias</p>
            ) : (
              data.upcomingMaintenances.slice(0, 4).map((m) => (
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
          </div>
          <div className="space-y-2">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)
            ) : !data?.recentExpenses?.length ? (
              <p className="text-muted-foreground text-xs py-4 text-center">Nenhuma despesa registrada</p>
            ) : (
              data.recentExpenses.slice(0, 4).map((e) => (
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
                  <span className="font-semibold text-xs text-green-600 dark:text-green-400 shrink-0">
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

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  color: string;
}) {
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
  const count = vehicle._count;
  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <div className="rounded-xl border border-border/40 bg-card/30 p-4 hover:bg-card/60 hover:border-primary/30 transition-all group relative overflow-hidden">
        {vehicle.color && (
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: vehicle.color }} />
        )}
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-[10px]">
            {fuelTypeLabel(vehicle.fuelType)}
          </Badge>
        </div>
        <h3 className="font-semibold text-sm">{vehicle.brand} {vehicle.model}</h3>
        <p className="text-muted-foreground text-xs mb-3">{vehicle.year} · {vehicle.licensePlate}</p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
          <Gauge className="h-3 w-3" />
          {formatMileage(vehicle.currentMileage)}
        </div>
        {count && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/30 pt-2">
            <span className="flex items-center gap-1"><Wrench className="h-2.5 w-2.5" />{count.maintenances}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-2.5 w-2.5" />{count.expenses}</span>
            <span className="flex items-center gap-1"><Fuel className="h-2.5 w-2.5" />{count.fuelLogs}</span>
            <ChevronRight className="h-3 w-3 ml-auto group-hover:text-primary transition-colors" />
          </div>
        )}
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
