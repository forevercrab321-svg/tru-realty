"use client";
import { AppShell } from "@/components/shared/app-shell";
import { ADMIN_NAV } from "@/lib/nav";
import { RequirePortal, RequireRouteAccess } from "@/lib/session";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePortal portal="admin">
      <AppShell nav={ADMIN_NAV} portal="admin">
        <RequireRouteAccess portal="admin">{children}</RequireRouteAccess>
      </AppShell>
    </RequirePortal>
  );
}
