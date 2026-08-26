"use client";
import { redirect } from "next/navigation";
import { useSession } from "@/lib/session";
import * as React from "react";
import { useRouter } from "next/navigation";

export default function ProfileRedirect() {
  const { account, ready } = useSession();
  const router = useRouter();
  React.useEffect(() => {
    if (!ready) return;
    router.replace(account?.portal === "agent" ? "/agent/profile" : account ? "/admin/company" : "/login");
  }, [ready, account, router]);
  return <div className="min-h-screen bg-canvas" />;
}
