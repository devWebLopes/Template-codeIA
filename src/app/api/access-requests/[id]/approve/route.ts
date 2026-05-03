import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auto-utils";

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const access = await db.vehicleAccess.findUnique({ where: { id }, include: { vehicle: true } });
    if (!access) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (access.vehicle.ownerId !== user.id) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const updated = await db.vehicleAccess.update({ where: { id }, data: { status: "ACTIVE" } });
    return NextResponse.json({ access: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
