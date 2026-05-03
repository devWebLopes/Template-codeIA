import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";
import { z } from "zod";
import { AccessLevel } from "../../../../../../../prisma/generated/client";

const Schema = z.object({
  date: z.string().optional(),
  type: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  cost: z.number().min(0).optional(),
  mileage: z.number().int().min(0).optional(),
  partsUsed: z.any().optional().nullable(),
  nextMaintenanceDate: z.string().optional().nullable(),
  nextMaintenanceMileage: z.number().int().optional().nullable(),
  invoiceUrl: z.string().url().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; maintenanceId: string }> }) {
  try {
    const { id, maintenanceId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const access = await checkVehicleAccess(id, user.id, AccessLevel.EDIT_MAINTENANCE);
    if (!access.allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const d = parsed.data;
    const maintenance = await db.maintenance.update({
      where: { id: maintenanceId, vehicleId: id },
      data: {
        ...d,
        date: d.date ? new Date(d.date) : undefined,
        nextMaintenanceDate: d.nextMaintenanceDate ? new Date(d.nextMaintenanceDate) : undefined,
      },
    });

    return NextResponse.json({ maintenance });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; maintenanceId: string }> }) {
  try {
    const { id, maintenanceId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const access = await checkVehicleAccess(id, user.id, AccessLevel.EDIT_MAINTENANCE);
    if (!access.allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    await db.maintenance.delete({ where: { id: maintenanceId, vehicleId: id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
