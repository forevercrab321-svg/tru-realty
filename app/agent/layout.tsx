"use client";
import { AppShell } from "@/components/shared/app-shell";
import { AGENT_NAV } from "@/lib/nav";
import { RequirePortal, RequireRouteAccess } from "@/lib/session";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePortal portal="agent">
      <AppShell nav={AGENT_NAV} portal="agent">
        <RequireRouteAccess portal="agent">{children}</RequireRouteAccess>
      </AppShell>
    </RequirePortal>
  );
}
