import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auto-utils";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [vehicles, upcomingMaintenances, recentExpenses, expensesThisMonth, fuelThisMonth] = await Promise.all([
      db.vehicle.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { _count: { select: { maintenances: true, expenses: true } } },
      }),
      db.maintenance.findMany({
        where: {
          vehicle: { ownerId: user.id },
          nextMaintenanceDate: { gte: now, lte: thirtyDaysFromNow },
        },
        orderBy: { nextMaintenanceDate: "asc" },
        take: 5,
        include: { vehicle: { select: { brand: true, model: true, year: true } } },
      }),
      db.expense.findMany({
        where: { vehicle: { ownerId: user.id } },
        orderBy: { date: "desc" },
        take: 5,
        include: { vehicle: { select: { brand: true, model: true, year: true } } },
      }),
      db.expense.aggregate({
        where: { vehicle: { ownerId: user.id }, date: { gte: startOfMonth } },
        _sum: { value: true },
      }),
      db.fuelLog.aggregate({
        where: { vehicle: { ownerId: user.id }, date: { gte: startOfMonth } },
        _sum: { totalCost: true },
      }),
    ]);

    return NextResponse.json({
      vehicles,
      totalVehicles: vehicles.length,
      upcomingMaintenances,
      recentExpenses,
      totalExpensesThisMonth: expensesThisMonth._sum.value ?? 0,
      totalFuelThisMonth: fuelThisMonth._sum.totalCost ?? 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
