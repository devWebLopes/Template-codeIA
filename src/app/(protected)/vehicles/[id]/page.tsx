"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Car, Wrench, Fuel, FileText, Shield, Key, ChevronLeft,
  Gauge, Calendar, Edit2, Trash2, MapPin, DollarSign
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatMileage, fuelTypeLabel } from "@/lib/auto-format";
import { MaintenanceTab } from "@/components/vehicles/maintenance-tab";
import { ExpenseTab } from "@/components/vehicles/expense-tab";
import { FuelTab } from "@/components/vehicles/fuel-tab";
import { TireTab } from "@/components/vehicles/tire-tab";
import { DocumentTab } from "@/components/vehicles/document-tab";
import { AccessTab } from "@/components/vehicles/access-tab";

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  chassisNumber?: string;
  currentMileage: number;
  fuelType: string;
  color?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  notes?: string;
  imageUrl?: string;
  owner: { name?: string; email?: string };
  maintenances: unknown[];
  expenses: unknown[];
  fuelLogs: unknown[];
  tires: unknown[];
  documents: unknown[];
  accesses: unknown[];
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useSetPageMetadata({
    title: vehicle ? `${vehicle.brand} ${vehicle.model}` : "Veículo",
    description: vehicle?.licensePlate ?? "",
    breadcrumbs: [
      { label: "Veículos", href: "/vehicles" },
      { label: vehicle ? `${vehicle.brand} ${vehicle.model}` : "Carregando..." },
    ],
  });

  const loadVehicle = () => {
    fetch(`/api/vehicles/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setVehicle(d.vehicle);
        setIsOwner(d.isOwner);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadVehicle(); }, [id]);

  async function handleDelete() {
    if (!confirm(`Deseja realmente excluir ${vehicle?.brand} ${vehicle?.model}? Esta ação é irreversível.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Veículo excluído com sucesso");
        router.push("/vehicles");
      } else {
        toast.error("Erro ao excluir veículo");
      }
    } catch {
      toast.error("Erro ao excluir veículo");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Veículo não encontrado</p>
        <Link href="/vehicles"><Button variant="outline">Voltar</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vehicle Header */}
      <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary/60 to-primary/20" />
        <div className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Car className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-base md:text-lg">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <Badge variant="outline" className="text-[10px]">{vehicle.year}</Badge>
                <Badge variant="secondary" className="text-[10px]">{fuelTypeLabel(vehicle.fuelType)}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {vehicle.licensePlate}
                {vehicle.color && ` · ${vehicle.color}`}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deleting} onClick={handleDelete}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoChip icon={Gauge} label="Quilometragem" value={formatMileage(vehicle.currentMileage)} />
            {vehicle.purchaseDate && <InfoChip icon={Calendar} label="Compra" value={formatDate(vehicle.purchaseDate)} />}
            {vehicle.purchaseValue && <InfoChip icon={DollarSign} label="Valor pago" value={formatCurrency(vehicle.purchaseValue)} />}
            {vehicle.chassisNumber && <InfoChip icon={MapPin} label="Chassi" value={vehicle.chassisNumber.slice(-6)} />}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex gap-0 h-auto p-1 rounded-xl bg-muted/50">
          <TabsTrigger value="overview" className="flex-1 min-w-[70px] text-xs py-2 gap-1.5">
            <Car className="h-3.5 w-3.5 hidden sm:block" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="maintenances" className="flex-1 min-w-[70px] text-xs py-2 gap-1.5">
            <Wrench className="h-3.5 w-3.5 hidden sm:block" />
            Revisões
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1 min-w-[70px] text-xs py-2 gap-1.5">
            <DollarSign className="h-3.5 w-3.5 hidden sm:block" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="fuel" className="flex-1 min-w-[70px] text-xs py-2 gap-1.5">
            <Fuel className="h-3.5 w-3.5 hidden sm:block" />
            Combustível
          </TabsTrigger>
          <TabsTrigger value="tires" className="flex-1 min-w-[70px] text-xs py-2 gap-1.5">
            <Shield className="h-3.5 w-3.5 hidden sm:block" />
            Pneus
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 min-w-[70px] text-xs py-2 gap-1.5">
            <FileText className="h-3.5 w-3.5 hidden sm:block" />
            Docs
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="access" className="flex-1 min-w-[70px] text-xs py-2 gap-1.5">
              <Key className="h-3.5 w-3.5 hidden sm:block" />
              Acessos
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <VehicleOverview vehicle={vehicle} />
        </TabsContent>
        <TabsContent value="maintenances">
          <MaintenanceTab vehicleId={id} isOwner={isOwner} onUpdate={loadVehicle} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseTab vehicleId={id} isOwner={isOwner} onUpdate={loadVehicle} />
        </TabsContent>
        <TabsContent value="fuel">
          <FuelTab vehicleId={id} isOwner={isOwner} onUpdate={loadVehicle} />
        </TabsContent>
        <TabsContent value="tires">
          <TireTab vehicleId={id} isOwner={isOwner} onUpdate={loadVehicle} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentTab vehicleId={id} isOwner={isOwner} onUpdate={loadVehicle} />
        </TabsContent>
        {isOwner && (
          <TabsContent value="access">
            <AccessTab vehicleId={id} onUpdate={loadVehicle} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="font-medium text-xs truncate">{value}</p>
    </div>
  );
}

function VehicleOverview({ vehicle }: { vehicle: VehicleData }) {
  const stats = [
    { label: "Manutenções", value: vehicle.maintenances.length, icon: Wrench },
    { label: "Despesas", value: vehicle.expenses.length, icon: DollarSign },
    { label: "Abastecimentos", value: vehicle.fuelLogs.length, icon: Fuel },
    { label: "Documentos", value: vehicle.documents.length, icon: FileText },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/40 bg-card/30 p-3 text-center">
            <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="font-bold text-lg">{s.value}</p>
            <p className="text-muted-foreground text-[11px]">{s.label}</p>
          </div>
        ))}
      </div>
      {vehicle.notes && (
        <div className="rounded-xl border border-border/40 bg-card/30 p-4">
          <p className="text-xs text-muted-foreground mb-1">Observações</p>
          <p className="text-sm">{vehicle.notes}</p>
        </div>
      )}
    </div>
  );
}
