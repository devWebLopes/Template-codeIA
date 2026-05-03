import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed || !access.owner) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const accesses = await db.vehicleAccess.findMany({
      where: { vehicleId: id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ accesses });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
