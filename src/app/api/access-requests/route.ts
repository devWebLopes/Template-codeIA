import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auto-utils";
import { z } from "zod";

const Schema = z.object({
  vehiclePlate: z.string().min(1).toUpperCase(),
  accessLevel: z.enum(["READ_ONLY", "EDIT_MAINTENANCE", "FULL_ACCESS"]).default("READ_ONLY"),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const accesses = await db.vehicleAccess.findMany({
      where: { userId: user.id },
      include: { vehicle: { select: { id: true, brand: true, model: true, year: true, licensePlate: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ accesses });
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
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
    const { vehiclePlate, accessLevel, notes } = parsed.data;

    const vehicle = await db.vehicle.findUnique({ where: { licensePlate: vehiclePlate } });
    if (!vehicle) return NextResponse.json({ error: "Veículo não encontrado com essa placa" }, { status: 404 });
    if (vehicle.ownerId === user.id) return NextResponse.json({ error: "Você já é o proprietário deste veículo" }, { status: 400 });

    const existing = await db.vehicleAccess.findFirst({ where: { vehicleId: vehicle.id, userId: user.id, status: { in: ["PENDING", "ACTIVE"] } } });
    if (existing) return NextResponse.json({ error: "Já existe uma solicitação de acesso para este veículo" }, { status: 409 });

    const access = await db.vehicleAccess.create({
      data: { vehicleId: vehicle.id, userId: user.id, requestedBy: user.id, accessLevel, notes: notes ?? null, status: "PENDING" },
    });

    return NextResponse.json({ access }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
