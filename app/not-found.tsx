import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <Logo size="lg" />
      <p className="mt-10 text-[13px] font-medium uppercase tracking-[0.14em] text-ink-4">404</p>
      <h1 className="mt-3 max-w-lg text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink text-balance">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-3">
        The link may be out of date, or the record may have been archived. Try the search in the workspace, or head back home.
      </p>
      <div className="mt-7 flex gap-2.5">
        <Button variant="primary" size="lg" asChild><Link href="/">Back to trurealty.com</Link></Button>
        <Button variant="secondary" size="lg" asChild><Link href="/login">Sign in</Link></Button>
      </div>
    </div>
  );
}
