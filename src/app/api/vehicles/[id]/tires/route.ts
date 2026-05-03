import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";
import { z } from "zod";

const Schema = z.object({
  position: z.enum(["FRONT_LEFT", "FRONT_RIGHT", "REAR_LEFT", "REAR_RIGHT", "SPARE"]),
  brand: z.string().min(1),
  model: z.string().min(1),
  size: z.string().optional().nullable(),
  purchaseDate: z.string(),
  purchaseMileage: z.number().int().min(0),
  cost: z.number().min(0),
  lastRotationDate: z.string().optional().nullable(),
  lastRotationMileage: z.number().int().optional().nullable(),
  expectedLifespanKm: z.number().int().optional().nullable(),
  expectedLifespanMonths: z.number().int().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const tires = await db.tire.findMany({ where: { vehicleId: id }, orderBy: { purchaseDate: "desc" } });
    return NextResponse.json({ tires });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed || !access.owner) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    const tire = await db.tire.create({
      data: {
        vehicleId: id,
        position: d.position,
        brand: d.brand,
        model: d.model,
        size: d.size ?? null,
        purchaseDate: new Date(d.purchaseDate),
        purchaseMileage: d.purchaseMileage,
        cost: d.cost,
        lastRotationDate: d.lastRotationDate ? new Date(d.lastRotationDate) : null,
        lastRotationMileage: d.lastRotationMileage ?? null,
        expectedLifespanKm: d.expectedLifespanKm ?? null,
        expectedLifespanMonths: d.expectedLifespanMonths ?? null,
      },
    });
    return NextResponse.json({ tire }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
