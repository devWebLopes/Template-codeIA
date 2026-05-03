import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";
import { z } from "zod";

const UpdateSchema = z.object({
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).optional(),
  licensePlate: z.string().min(1).optional(),
  chassisNumber: z.string().optional().nullable(),
  currentMileage: z.number().int().min(0).optional(),
  fuelType: z.enum(["GASOLINE", "ETHANOL", "DIESEL", "FLEX", "ELECTRIC"]).optional(),
  purchaseDate: z.string().optional().nullable(),
  purchaseValue: z.number().optional().nullable(),
  color: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const result = await checkVehicleAccess(id, user.id);
    if (!result.allowed) {
      return result.reason === "notfound"
        ? NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
        : NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const vehicle = await db.vehicle.findUnique({
      where: { id },
      include: {
        maintenances: { orderBy: { date: "desc" }, take: 10 },
        expenses: { orderBy: { date: "desc" }, take: 10 },
        fuelLogs: { orderBy: { date: "desc" }, take: 10 },
        tires: true,
        documents: { orderBy: { expirationDate: "asc" } },
        accesses: {
          where: { status: { in: ["PENDING", "ACTIVE"] } },
          include: { user: { select: { name: true, email: true, role: true } } },
        },
        owner: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ vehicle, isOwner: result.owner });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const result = await checkVehicleAccess(id, user.id, "FULL_ACCESS");
    if (!result.allowed || !result.owner) {
      return result.reason === "notfound"
        ? NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
        : NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        licensePlate: data.licensePlate?.toUpperCase(),
      },
    });

    return NextResponse.json({ vehicle });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const result = await checkVehicleAccess(id, user.id);
    if (!result.allowed || !result.owner) {
      return result.reason === "notfound"
        ? NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
        : NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        licensePlate: data.licensePlate?.toUpperCase(),
      },
    });

    return NextResponse.json({ vehicle });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const result = await checkVehicleAccess(id, user.id);
    if (!result.allowed || !result.owner) {
      return result.reason === "notfound"
        ? NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
        : NextResponse.json({ error: "Apenas o proprietário pode excluir o veículo" }, { status: 403 });
    }

    await db.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
