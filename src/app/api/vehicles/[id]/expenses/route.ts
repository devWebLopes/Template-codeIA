import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";
import { z } from "zod";

const Schema = z.object({
  date: z.string(),
  category: z.enum(["FUEL", "TAX", "INSURANCE", "FINE", "WASH", "PARKING", "MAINTENANCE", "OTHER"]),
  description: z.string().min(1),
  value: z.number().min(0),
  receiptUrl: z.string().url().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const expenses = await db.expense.findMany({ where: { vehicleId: id }, orderBy: { date: "desc" } });
    return NextResponse.json({ expenses });
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
    const expense = await db.expense.create({
      data: { vehicleId: id, date: new Date(d.date), category: d.category, description: d.description, value: d.value, receiptUrl: d.receiptUrl ?? null },
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
