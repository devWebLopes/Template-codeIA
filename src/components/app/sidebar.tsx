"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Car,
  Wrench,
  Fuel,
  FileText,
  Shield,
  Key,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meus Veículos", href: "/vehicles", icon: Car },
  { name: "Manutenções", href: "/maintenances", icon: Wrench },
  { name: "Combustível", href: "/fuel", icon: Fuel },
  { name: "Documentos", href: "/documents", icon: FileText },
  { name: "Seguros", href: "/insurance", icon: Shield },
  { name: "Acessos", href: "/access-management", icon: Key },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative z-30 hidden md:flex md:flex-col border-r border-border/40 bg-card/30 text-card-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-card/20 glass-panel transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[64px]" : "w-64",
        "my-4 md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:max-h-[calc(100vh-2rem)] md:overflow-hidden"
      )}
      aria-label="Barra lateral principal"
    >
      <div className="flex h-14 items-center gap-2 px-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold">AutoGest</span>
          )}
        </Link>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <nav className="flex flex-col gap-1 p-2" aria-label="Navegação principal">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const link = (
              <Link
                key={item.name}
                href={item.href}
                aria-label={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      {!collapsed && (
        <div className="p-3 border-t border-border/40">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Configurações</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
