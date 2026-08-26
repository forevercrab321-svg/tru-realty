"use client";
import { PageHeader } from "@/components/ui/page-header";
import { LibraryView } from "@/components/admin/library-view";
import { useSession } from "@/lib/session";

export default function AdminLibrary() {
  const { hasPermission } = useSession();
  return (
    <>
      <PageHeader
        title="Library"
        description="Company documents, policies, forms, templates and training material — one source of truth for the whole brokerage."
      />
      <LibraryView canManage={hasPermission("library.manage")} />
    </>
  );
}
