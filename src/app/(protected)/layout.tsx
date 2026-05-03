"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { PageHeader } from "@/components/app/page-header";
import { MobileNav } from "@/components/app/mobile-nav";
import { PageMetadataProvider } from "@/contexts/page-metadata";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("app.sidebarCollapsed");
    if (saved != null) setCollapsed(saved === "true");
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("app.sidebarCollapsed", String(next));
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageMetadataProvider>
      <div className="min-h-dvh w-full text-foreground">
        <div className="flex">
          <Sidebar collapsed={collapsed} onToggle={toggleCollapse} />
          <div className="flex min-h-dvh flex-1 flex-col pb-16 md:pb-0">
            <Topbar onToggleSidebar={toggleCollapse} sidebarCollapsed={collapsed} />
            <main className={cn("container mx-auto w-full max-w-[1400px] pb-6 pt-4 px-3 md:px-6")}>
              <div className="relative overflow-hidden">
                <div
                  className="pointer-events-none absolute -inset-6 -z-10 rounded-2xl"
                  style={{
                    background:
                      "radial-gradient(60% 40% at 10% 0%, color-mix(in oklch, var(--neon) 20%, transparent), transparent 70%), radial-gradient(50% 40% at 90% 10%, color-mix(in oklch, var(--neon-2) 18%, transparent), transparent 70%)",
                    filter: "blur(30px)",
                    opacity: 0.6,
                  }}
                  aria-hidden="true"
                />
                <div className="glass-panel border-border/40 bg-card/30 p-4 md:p-6">
                  <PageHeader />
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
        <MobileNav />
      </div>
    </PageMetadataProvider>
  );
}
