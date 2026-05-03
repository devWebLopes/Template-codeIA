import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";
import { z } from "zod";
import { AccessLevel } from "../../../../../../prisma/generated/client";

const Schema = z.object({
  date: z.string(),
  type: z.string().min(1),
  description: z.string().min(1),
  cost: z.number().min(0),
  mileage: z.number().int().min(0),
  partsUsed: z.any().optional().nullable(),
  nextMaintenanceDate: z.string().optional().nullable(),
  nextMaintenanceMileage: z.number().int().optional().nullable(),
  invoiceUrl: z.string().url().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const maintenances = await db.maintenance.findMany({
      where: { vehicleId: id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ maintenances });
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

    const access = await checkVehicleAccess(id, user.id, AccessLevel.EDIT_MAINTENANCE);
    if (!access.allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const maintenance = await db.maintenance.create({
      data: {
        vehicleId: id,
        date: new Date(d.date),
        type: d.type,
        description: d.description,
        cost: d.cost,
        mileage: d.mileage,
        partsUsed: d.partsUsed ?? undefined,
        nextMaintenanceDate: d.nextMaintenanceDate ? new Date(d.nextMaintenanceDate) : null,
        nextMaintenanceMileage: d.nextMaintenanceMileage ?? null,
        invoiceUrl: d.invoiceUrl ?? null,
      },
    });

    await db.vehicle.update({ where: { id }, data: { currentMileage: { set: Math.max(d.mileage, access.vehicle?.currentMileage ?? 0) } } });

    return NextResponse.json({ maintenance }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
