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

    // Last 6 months for chart
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      months.push({ label, start: d, end });
    }

    const [vehicles, upcomingMaintenances, recentExpenses, expensesThisMonth, fuelThisMonth] = await Promise.all([
      db.vehicle.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { _count: { select: { maintenances: true, expenses: true, fuelLogs: true } } },
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

    // Monthly chart data
    const monthlyChart = await Promise.all(
      months.map(async (m) => {
        const [exp, fuel] = await Promise.all([
          db.expense.aggregate({
            where: { vehicle: { ownerId: user.id }, date: { gte: m.start, lte: m.end } },
            _sum: { value: true },
          }),
          db.fuelLog.aggregate({
            where: { vehicle: { ownerId: user.id }, date: { gte: m.start, lte: m.end } },
            _sum: { totalCost: true },
          }),
        ]);
        return {
          month: m.label,
          despesas: Number(exp._sum.value ?? 0),
          combustivel: Number(fuel._sum.totalCost ?? 0),
        };
      })
    );

    return NextResponse.json({
      vehicles,
      totalVehicles: vehicles.length,
      upcomingMaintenances,
      recentExpenses,
      totalExpensesThisMonth: Number(expensesThisMonth._sum.value ?? 0),
      totalFuelThisMonth: Number(fuelThisMonth._sum.totalCost ?? 0),
      monthlyChart,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
