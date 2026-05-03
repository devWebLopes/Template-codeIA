"use client";

import { useSetPageMetadata } from "@/contexts/page-metadata";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { Settings, User, Bell, Car, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const { user } = useUser();

  useSetPageMetadata({
    title: "Configurações",
    description: "Configurações da sua conta",
    breadcrumbs: [{ label: "Configurações" }],
  });

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Profile */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">Perfil</h2>
        </div>
        <div className="flex items-center gap-3">
          <UserButton />
          <div>
            <p className="font-medium text-sm">{user?.fullName ?? "Usuário"}</p>
            <p className="text-muted-foreground text-xs">{user?.primaryEmailAddress?.emailAddress}</p>
            <Badge variant="outline" className="text-[10px] mt-1">Proprietário</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-xs mt-3">
          Para editar seu perfil, clique no avatar acima.
        </p>
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">Aparência</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Tema</p>
            <p className="text-muted-foreground text-xs">Escolha entre claro, escuro ou sistema</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* App info */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Car className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">Sobre o AutoGest</h2>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Versão</span>
            <span className="font-medium text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Plataforma</span>
            <span className="font-medium text-foreground">Web (Mobile-first)</span>
          </div>
          <div className="flex justify-between">
            <span>Armazenamento</span>
            <span className="font-medium text-foreground">PostgreSQL (Replit)</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">Segurança e Acesso</h2>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>Gerencie quem pode acessar seus veículos na página de <a href="/access-management" className="text-primary hover:underline">Gerenciar Acessos</a>.</p>
          <p>Se você é mecânico ou revenda, solicite acesso na página de <a href="/request-access" className="text-primary hover:underline">Solicitar Acesso</a>.</p>
        </div>
      </div>
    </div>
  );
}
