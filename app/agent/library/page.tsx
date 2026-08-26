"use client";
import { PageHeader } from "@/components/ui/page-header";
import { LibraryView } from "@/components/admin/library-view";

export default function AgentLibrary() {
  return (
    <>
      <PageHeader
        title="Library"
        description="Forms, templates, marketing material and training — everything you need to run a deal."
      />
      <LibraryView />
    </>
  );
}
