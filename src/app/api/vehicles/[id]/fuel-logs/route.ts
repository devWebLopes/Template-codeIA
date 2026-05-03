import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";
import { z } from "zod";

const Schema = z.object({
  date: z.string(),
  fuelType: z.enum(["GASOLINE", "ETHANOL", "DIESEL", "FLEX"]),
  liters: z.number().min(0),
  pricePerLiter: z.number().min(0),
  totalCost: z.number().min(0),
  mileage: z.number().int().min(0),
  stationName: z.string().optional().nullable(),
  fullTank: z.boolean().default(true),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const fuelLogs = await db.fuelLog.findMany({ where: { vehicleId: id }, orderBy: { date: "desc" } });
    return NextResponse.json({ fuelLogs });
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
    const fuelLog = await db.fuelLog.create({
      data: { vehicleId: id, date: new Date(d.date), fuelType: d.fuelType, liters: d.liters, pricePerLiter: d.pricePerLiter, totalCost: d.totalCost, mileage: d.mileage, stationName: d.stationName ?? null, fullTank: d.fullTank },
    });
    await db.vehicle.update({ where: { id }, data: { currentMileage: { set: Math.max(d.mileage, access.vehicle?.currentMileage ?? 0) } } });
    return NextResponse.json({ fuelLog }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
