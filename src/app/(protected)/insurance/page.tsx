"use client";

import { useEffect, useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, AlertTriangle, Calendar, Car, Plus } from "lucide-react";
import { formatDate, formatCurrency, daysUntil, isExpiringSoon, isExpired } from "@/lib/auto-format";

interface InsuranceDocWithVehicle {
  id: string;
  vehicleId: string;
  type: string;
  description?: string;
  issueDate?: string;
  expirationDate?: string;
  value?: number;
  vehicle: { brand: string; model: string; year: number; licensePlate: string };
}

export default function InsurancePage() {
  const [items, setItems] = useState<InsuranceDocWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useSetPageMetadata({
    title: "Seguros",
    description: "Apólices de seguro dos seus veículos",
    breadcrumbs: [{ label: "Seguros" }],
  });

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then(async ({ vehicles }) => {
        if (!vehicles || vehicles.length === 0) return;
        const all = await Promise.all(
          vehicles.map(async (v: { id: string; brand: string; model: string; year: number; licensePlate: string }) => {
            const res = await fetch(`/api/vehicles/${v.id}/documents`);
            const { documents } = await res.json();
            return (documents ?? [])
              .filter((d: { type: string }) => d.type === "INSURANCE_POLICY")
              .map((d: InsuranceDocWithVehicle) => ({ ...d, vehicle: v }));
          })
        );
        const flat = all.flat().sort((a: InsuranceDocWithVehicle, b: InsuranceDocWithVehicle) => {
          if (!a.expirationDate) return 1;
          if (!b.expirationDate) return -1;
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        });
        setItems(flat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const expiringSoon = items.filter((d) => d.expirationDate && isExpiringSoon(d.expirationDate));
  const expired = items.filter((d) => d.expirationDate && isExpired(d.expirationDate));

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="font-medium text-sm">Atenção</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {expired.length > 0 && `${expired.length} apólice(s) vencida(s)`}
            {expired.length > 0 && expiringSoon.length > 0 && " · "}
            {expiringSoon.length > 0 && `${expiringSoon.length} vencendo em breve`}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{items.length} apólice(s)</p>
        <Link href="/vehicles">
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Adicionar via Veículo
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-sm mb-2">Nenhuma apólice de seguro</h3>
          <p className="text-muted-foreground text-xs mb-4 max-w-xs mx-auto">
            Para adicionar uma apólice, acesse um veículo e adicione um documento do tipo "Apólice de Seguro".
          </p>
          <Link href="/vehicles">
            <Button variant="outline" size="sm">
              <Car className="h-4 w-4 mr-2" />
              Ver Veículos
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((d) => {
            const expired = d.expirationDate && isExpired(d.expirationDate);
            const expiring = d.expirationDate && isExpiringSoon(d.expirationDate);
            return (
              <Link key={d.id} href={`/vehicles/${d.vehicleId}`}>
                <div className={`rounded-xl border p-4 hover:bg-card/60 transition-all ${expired ? "border-red-400/30 bg-red-500/5" : expiring ? "border-orange-400/30 bg-orange-500/5" : "border-border/40 bg-card/30"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${expired ? "bg-red-500/10 text-red-500" : expiring ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"}`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {d.vehicle.brand} {d.vehicle.model} {d.vehicle.year}
                        </p>
                        {expired && <Badge variant="destructive" className="text-[10px]">Vencida</Badge>}
                        {!expired && expiring && d.expirationDate && (
                          <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-500">
                            Vence em {daysUntil(d.expirationDate)}d
                          </Badge>
                        )}
                        {!expired && !expiring && <Badge variant="outline" className="text-[10px] border-green-400 text-green-600">Vigente</Badge>}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">{d.vehicle.licensePlate}</p>
                      {d.description && <p className="text-xs mt-1">{d.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                        {d.issueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Início: {formatDate(d.issueDate)}
                          </span>
                        )}
                        {d.expirationDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Vence: {formatDate(d.expirationDate)}
                          </span>
                        )}
                        {d.value && <span className="font-medium text-foreground">{formatCurrency(d.value)}</span>}
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
