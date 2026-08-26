"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function ForgotPassword() {
  const [sent, setSent] = React.useState(false);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-[380px]">
        <Logo size="md" />
        {sent ? (
          <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-xs">
            <h1 className="text-[18px] font-semibold text-ink">Check your inbox</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
              If an account exists for that address, a reset link is on its way. Links expire after 30 minutes.
            </p>
            <Button variant="secondary" full className="mt-5" asChild>
              <Link href="/login"><ArrowLeft /> Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-[24px] font-semibold tracking-[-0.025em] text-ink">Reset your password</h1>
            <p className="mt-1.5 text-[13.5px] text-ink-3">Enter the email tied to your Tru Realty account.</p>
            <form className="mt-6 space-y-3.5" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <Field label="Work email"><Input icon={<Mail />} type="email" placeholder="you@trurealty.com" required /></Field>
              <Button type="submit" variant="primary" size="lg" full>Send reset link</Button>
            </form>
            <Link href="/login" className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 hover:text-ink">
              <ArrowLeft className="size-3.5" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
