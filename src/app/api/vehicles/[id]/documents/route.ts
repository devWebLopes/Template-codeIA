import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, checkVehicleAccess } from "@/lib/auto-utils";
import { z } from "zod";

const Schema = z.object({
  type: z.enum(["IPVA", "LICENSING", "INSURANCE_POLICY", "FINE", "CRLV", "OTHER"]),
  description: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  value: z.number().optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const access = await checkVehicleAccess(id, user.id);
    if (!access.allowed) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const documents = await db.vehicleDocument.findMany({ where: { vehicleId: id }, orderBy: { expirationDate: "asc" } });
    return NextResponse.json({ documents });
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
    const document = await db.vehicleDocument.create({
      data: {
        vehicleId: id, type: d.type, description: d.description ?? null,
        issueDate: d.issueDate ? new Date(d.issueDate) : null,
        expirationDate: d.expirationDate ? new Date(d.expirationDate) : null,
        value: d.value ?? null, documentUrl: d.documentUrl ?? null,
      },
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
