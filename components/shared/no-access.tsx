"use client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERMISSION_GROUPS, ROLES } from "@/lib/permissions";
import type { Permission, RoleKey } from "@/types";

/**
 * What someone sees when they reach a page their role does not cover.
 *
 * Deliberately not a redirect. A redirect to the dashboard leaves the person thinking the
 * link is broken and the product flaky; naming the missing permission and the role that
 * would hold it turns a dead end into an explanation, and gives them the exact sentence to
 * take to whoever administers their account.
 *
 * It also names the person's own role. In a brokerage the same screen is reached by five
 * different job functions, and "you are signed in as a Transaction Coordinator" answers the
 * question before it is asked.
 */
export function NoAccess({
  permission,
  role,
  backHref,
  backLabel,
}: {
  permission?: Permission;
  role: RoleKey;
  backHref: string;
  backLabel: string;
}) {
  const roleName = ROLES.find((r) => r.key === role)?.name ?? role;
  const label = permission
    ? PERMISSION_GROUPS.flatMap((g) => g.items).find((i) => i.key === permission)?.label ?? permission
    : undefined;
  const alsoHeld = permission
    ? ROLES.filter((r) => r.permissions.includes(permission)).map((r) => r.name)
    : [];

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-5 px-5 py-20">
      <span className="flex size-10 items-center justify-center rounded-full bg-subtle text-ink-2">
        <Lock className="size-[18px]" />
      </span>

      <div className="space-y-2">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          This page is outside your access
        </h1>
        <p className="text-[14px] leading-relaxed text-ink-2">
          You are signed in as <strong className="font-medium text-ink">{roleName}</strong>.
          {label ? (
            <>
              {" "}
              This page needs the <strong className="font-medium text-ink">{label}</strong>{" "}
              permission, which your role does not include.
            </>
          ) : (
            " This page is not part of your portal."
          )}
        </p>
        {alsoHeld.length > 0 && (
          <p className="text-[13px] text-ink-3">
            Held by: {alsoHeld.join(", ")}. Ask whoever administers your account if you need it.
          </p>
        )}
      </div>

      <Button asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
