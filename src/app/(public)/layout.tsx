import { CookieConsent } from "@/components/app/cookie-consent"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <main>{children}</main>
      <CookieConsent />
    </div>
  );
}
