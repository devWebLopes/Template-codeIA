import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed || !access.owner) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await db.vehicleDocument.delete({ where: { id: documentId, vehicleId: id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
