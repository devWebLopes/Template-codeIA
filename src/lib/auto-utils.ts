import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { AccessLevel, AccessStatus } from '../../prisma/generated/client';

export async function getAuthUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await db.user.create({ data: { clerkId } });
  }
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
}

export function notFound(msg = 'Não encontrado') {
  return NextResponse.json({ error: msg }, { status: 404 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
}

export function serverError(e?: unknown) {
  console.error(e);
  return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
}

export async function checkVehicleAccess(vehicleId: string, userId: string, requiredLevel?: AccessLevel) {
  const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return { allowed: false, reason: 'notfound' as const };

  if (vehicle.ownerId === userId) return { allowed: true, owner: true, vehicle };

  const access = await db.vehicleAccess.findFirst({
    where: { vehicleId, userId, status: AccessStatus.ACTIVE },
  });

  if (!access) return { allowed: false, reason: 'forbidden' as const, vehicle };

  if (requiredLevel) {
    const levels = [AccessLevel.READ_ONLY, AccessLevel.EDIT_MAINTENANCE, AccessLevel.FULL_ACCESS];
    const required = levels.indexOf(requiredLevel);
    const has = levels.indexOf(access.accessLevel);
    if (has < required) return { allowed: false, reason: 'forbidden' as const, vehicle };
  }

  return { allowed: true, owner: false, vehicle, access };
}
