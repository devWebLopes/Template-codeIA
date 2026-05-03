"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Car, ChevronLeft, Save } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  brand: z.string().min(1, "Marca obrigatória"),
  model: z.string().min(1, "Modelo obrigatório"),
  year: z.number({ invalid_type_error: "Ano inválido" }).int().min(1900).max(new Date().getFullYear() + 2),
  licensePlate: z.string().min(1, "Placa obrigatória"),
  chassisNumber: z.string().optional(),
  currentMileage: z.number({ invalid_type_error: "Quilometragem inválida" }).int().min(0).default(0),
  fuelType: z.enum(["GASOLINE", "ETHANOL", "DIESEL", "FLEX", "ELECTRIC"]),
  purchaseDate: z.string().optional(),
  purchaseValue: z.number().optional().nullable(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const FUEL_TYPES = [
  { value: "FLEX", label: "Flex" },
  { value: "GASOLINE", label: "Gasolina" },
  { value: "ETHANOL", label: "Etanol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Elétrico" },
];

const POPULAR_BRANDS = ["Chevrolet", "Fiat", "Ford", "Honda", "Hyundai", "Jeep", "Nissan", "Renault", "Toyota", "Volkswagen"];
const COLORS = ["Branco", "Preto", "Prata", "Cinza", "Vermelho", "Azul", "Bege", "Verde", "Amarelo", "Marrom"];

export default function NewVehiclePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  useSetPageMetadata({
    title: "Novo Veículo",
    description: "Cadastrar um novo veículo",
    breadcrumbs: [{ label: "Veículos", href: "/vehicles" }, { label: "Novo" }],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fuelType: "FLEX",
      currentMileage: 0,
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = form;
  const fuelType = watch("fuelType");

  async function nextStep() {
    const fields: (keyof FormData)[] = step === 1
      ? ["brand", "model", "year", "licensePlate", "fuelType"]
      : ["currentMileage"];
    const ok = await trigger(fields);
    if (ok) setStep((s) => s + 1);
  }

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, licensePlate: data.licensePlate.toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao cadastrar veículo");
        return;
      }
      toast.success("Veículo cadastrado com sucesso!");
      router.push(`/vehicles/${json.vehicle.id}`);
    } catch {
      toast.error("Erro ao cadastrar veículo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vehicles">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Car className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">Novo Veículo</h1>
          <p className="text-muted-foreground text-xs">Passo {step} de 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Informações Básicas</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Marca *</Label>
                <Select onValueChange={(v) => setValue("brand", v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                    <SelectItem value="other">Outra</SelectItem>
                  </SelectContent>
                </Select>
                {errors.brand && <p className="text-destructive text-[11px]">{errors.brand.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Modelo *</Label>
                <Input {...register("model")} placeholder="Ex: Onix" className="h-10" />
                {errors.model && <p className="text-destructive text-[11px]">{errors.model.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Ano *</Label>
                <Input
                  type="number"
                  placeholder="2023"
                  className="h-10"
                  {...register("year", { valueAsNumber: true })}
                />
                {errors.year && <p className="text-destructive text-[11px]">{errors.year.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Placa *</Label>
                <Input {...register("licensePlate")} placeholder="ABC1D23" className="h-10 uppercase" />
                {errors.licensePlate && <p className="text-destructive text-[11px]">{errors.licensePlate.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Combustível *</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {FUEL_TYPES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setValue("fuelType", f.value as FormData["fuelType"])}
                    className={`rounded-lg border py-2 px-1 text-[11px] font-medium transition-all ${fuelType === f.value ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:border-border"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Número do Chassi (opcional)</Label>
              <Input {...register("chassisNumber")} placeholder="17 caracteres" className="h-10" />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Detalhes</h2>

            <div className="space-y-1.5">
              <Label className="text-xs">Quilometragem Atual *</Label>
              <Input
                type="number"
                placeholder="0"
                className="h-10"
                {...register("currentMileage", { valueAsNumber: true })}
              />
              {errors.currentMileage && <p className="text-destructive text-[11px]">{errors.currentMileage.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className={`rounded-lg border py-2 text-[11px] font-medium transition-all ${watch("color") === c ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:border-border"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data de Compra</Label>
                <Input type="date" {...register("purchaseDate")} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor de Compra (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="h-10"
                  {...register("purchaseValue", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Confirmar</h2>
            <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <Car className="h-6 w-6" />
              </div>
              {[
                ["Marca / Modelo", `${watch("brand")} ${watch("model")}`],
                ["Ano", watch("year")],
                ["Placa", watch("licensePlate")?.toUpperCase()],
                ["Combustível", watch("fuelType")],
                ["Quilometragem", `${watch("currentMileage")} km`],
                ["Cor", watch("color") ?? "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="font-medium text-xs">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Input {...register("notes")} placeholder="Alguma informação adicional..." className="h-10" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              Anterior
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={nextStep} className="flex-1">
              Próximo
            </Button>
          ) : (
            <Button type="submit" disabled={saving} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Cadastrar Veículo"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
