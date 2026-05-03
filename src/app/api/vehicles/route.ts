import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auto-utils";
import { z } from "zod";

const CreateVehicleSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  licensePlate: z.string().min(1).toUpperCase(),
  chassisNumber: z.string().optional().nullable(),
  currentMileage: z.number().int().min(0).default(0),
  fuelType: z.enum(["GASOLINE", "ETHANOL", "DIESEL", "FLEX", "ELECTRIC"]).default("FLEX"),
  purchaseDate: z.string().optional().nullable(),
  purchaseValue: z.number().optional().nullable(),
  color: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const vehicles = await db.vehicle.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { maintenances: true, expenses: true, fuelLogs: true } },
      },
    });

    return NextResponse.json({ vehicles });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = CreateVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const vehicle = await db.vehicle.create({
      data: {
        ownerId: user.id,
        brand: data.brand,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        chassisNumber: data.chassisNumber ?? null,
        currentMileage: data.currentMileage,
        fuelType: data.fuelType,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseValue: data.purchaseValue ?? null,
        color: data.color ?? null,
        imageUrl: data.imageUrl ?? null,
        notes: data.notes ?? null,
      },
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Placa ou chassi já cadastrado" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
