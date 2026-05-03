"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, Wrench, Fuel, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { name: "Início", href: "/dashboard", icon: LayoutDashboard },
  { name: "Veículos", href: "/vehicles", icon: Car },
  { name: "Revisões", href: "/maintenances", icon: Wrench },
  { name: "Combustível", href: "/fuel", icon: Fuel },
  { name: "Acessos", href: "/access-management", icon: Key },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      aria-label="Navegação inferior"
    >
      <div className="flex items-center justify-around px-2 pb-safe">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 min-w-[48px] rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.name}
            >
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
