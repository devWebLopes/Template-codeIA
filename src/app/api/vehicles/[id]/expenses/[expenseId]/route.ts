import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";
import { z } from "zod";

const Schema = z.object({
  date: z.string().optional(),
  category: z.enum(["FUEL", "TAX", "INSURANCE", "FINE", "WASH", "PARKING", "MAINTENANCE", "OTHER"]).optional(),
  description: z.string().min(1).optional(),
  value: z.number().min(0).optional(),
  receiptUrl: z.string().url().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  try {
    const { id, expenseId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed || !access.owner) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const d = parsed.data;
    const expense = await db.expense.update({
      where: { id: expenseId, vehicleId: id },
      data: { ...d, date: d.date ? new Date(d.date) : undefined },
    });
    return NextResponse.json({ expense });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  try {
    const { id, expenseId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed || !access.owner) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    await db.expense.delete({ where: { id: expenseId, vehicleId: id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
