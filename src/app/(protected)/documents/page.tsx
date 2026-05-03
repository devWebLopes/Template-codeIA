"use client";

import { useEffect, useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, AlertTriangle, Calendar, Car } from "lucide-react";
import { formatDate, formatCurrency, documentTypeLabel, daysUntil, isExpiringSoon, isExpired } from "@/lib/auto-format";

interface DocumentWithVehicle {
  id: string;
  vehicleId: string;
  type: string;
  description?: string;
  issueDate?: string;
  expirationDate?: string;
  value?: number;
  documentUrl?: string;
  vehicle: { brand: string; model: string; year: number; licensePlate: string };
}

export default function DocumentsPage() {
  const [items, setItems] = useState<DocumentWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useSetPageMetadata({
    title: "Documentos",
    description: "IPVA, seguro, licenciamento e mais",
    breadcrumbs: [{ label: "Documentos" }],
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
            return (documents ?? []).map((d: DocumentWithVehicle) => ({ ...d, vehicle: v }));
          })
        );
        const flat = all.flat().sort((a: DocumentWithVehicle, b: DocumentWithVehicle) => {
          if (!a.expirationDate) return 1;
          if (!b.expirationDate) return -1;
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        });
        setItems(flat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const expiring = items.filter((d) => d.expirationDate && isExpiringSoon(d.expirationDate));
  const expired = items.filter((d) => d.expirationDate && isExpired(d.expirationDate));

  function StatusBadge({ doc }: { doc: DocumentWithVehicle }) {
    if (!doc.expirationDate) return null;
    if (isExpired(doc.expirationDate)) return <Badge variant="destructive" className="text-[10px]">Vencido</Badge>;
    if (isExpiringSoon(doc.expirationDate)) return <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-500">Vence em {daysUntil(doc.expirationDate)}d</Badge>;
    return <Badge variant="outline" className="text-[10px] border-green-400 text-green-600">Válido</Badge>;
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {(expired.length > 0 || expiring.length > 0) && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="font-medium text-sm">Documentos que precisam de atenção</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {expired.length > 0 && `${expired.length} vencido(s)`}
            {expired.length > 0 && expiring.length > 0 && " · "}
            {expiring.length > 0 && `${expiring.length} vencendo em breve`}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-12 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <h3 className="font-semibold text-sm mb-4">Nenhum documento registrado</h3>
          <Link href="/vehicles">
            <Button variant="outline" size="sm"><Car className="h-4 w-4 mr-2" />Ver Veículos</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <Link key={d.id} href={`/vehicles/${d.vehicleId}`}>
              <div className={`rounded-xl border p-3 hover:bg-card/60 transition-all ${d.expirationDate && isExpired(d.expirationDate) ? "border-red-400/30 bg-red-500/5" : d.expirationDate && isExpiringSoon(d.expirationDate) ? "border-orange-400/30 bg-orange-500/5" : "border-border/40 bg-card/30"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{documentTypeLabel(d.type)}</p>
                      <StatusBadge doc={d} />
                    </div>
                    <p className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5">
                      <Car className="h-3 w-3" />
                      {d.vehicle.brand} {d.vehicle.model} · {d.vehicle.licensePlate}
                    </p>
                    {d.expirationDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Vence: {formatDate(d.expirationDate)}
                      </p>
                    )}
                  </div>
                  {d.value && <span className="font-semibold text-sm shrink-0">{formatCurrency(d.value)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
