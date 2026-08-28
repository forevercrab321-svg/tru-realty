"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Bot, Check, ChevronDown, Lock, Send, Shield, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { agentForPath, type AgentDef } from "@/lib/ai/agents";
import { gatewayConfigured, send, type Message } from "@/lib/ai/client";
import type { WriteIntent } from "@/lib/ai/tools";
import type { Caller } from "@/lib/ai/policy";
import { cn } from "@/lib/utils";

/**
 * One window, three assistants.
 *
 * Which one you get is decided by the route, not by a prop, so an assistant can never be
 * mounted on a surface it was not designed for — the public concierge cannot appear inside
 * the back office by someone passing the wrong id.
 *
 * Two things in here are load-bearing rather than decorative:
 *
 *   The tier badge. A person talking to an assistant that can read their commission should
 *   be able to see, without asking, what it can reach. The header names the tier and the
 *   scope in one line.
 *
 *   The confirmation card. Every write stops here and is described in the user's terms
 *   before it is applied — and the application applies it through the same store action a
 *   button calls, so an AI-driven change is indistinguishable from a human one in the audit
 *   trail, which is exactly the property you want.
 */
export function Assistant() {
  const pathname = usePathname();
  const def = agentForPath(pathname);
  const { account } = useSession();

  // The concierge is public. The other two require a session with the right role — if the
  // route says tier 2 or 3 and the session does not agree, no window is rendered at all.
  const permitted =
    def.roles === null || (account !== null && def.roles.includes(account.role));
  if (!permitted) return null;
  // trailingSlash is on, so compare by prefix rather than by exact match.
  if (/^\/(login|forgot-password)/.test(pathname)) return null;

  return <Window def={def} />;
}

function Window({ def }: { def: AgentDef }) {
  const { account } = useSession();
  const store = useStore();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const listRef = React.useRef<HTMLDivElement>(null);

  const caller: Caller = React.useMemo(
    () => ({
      agentId: def.id,
      role: account?.role ?? null,
      bookAgentId: account?.agentId ?? null,
      userId: account?.userId ?? null,
      sessionId: account?.email ?? "anon",
    }),
    [def.id, account],
  );

  React.useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const mine: Message = { id: Math.random().toString(36).slice(2), role: "user", content: text, at: Date.now() };
    setMessages((m) => [...m, mine]);
    setInput("");
    setBusy(true);
    try {
      const { message } = await send(def, caller, [...messages, mine], text);
      setMessages((m) => [...m, message]);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Apply a confirmed write through the app's own store actions. The assistant proposed it;
   * the application performs it. Anything the store cannot do, the assistant cannot do.
   */
  function apply(intent: WriteIntent) {
    const t = intent.target as Record<string, string & number>;
    try {
      switch (intent.action) {
        case "create_client":
          store.createClient({
            name: String(t.name), agentId: String(t.agentId ?? account?.agentId ?? ""),
            email: String(t.email ?? ""), phone: String(t.phone ?? ""),
            type: (t.type as never) ?? "buyer",
            budgetMin: Number(t.budgetMin ?? 0), budgetMax: Number(t.budgetMax ?? 0),
            areas: String(t.areas ?? "").split(",").map((s) => s.trim()).filter(Boolean),
            leadSource: String(t.leadSource ?? "Assistant"),
          });
          break;
        case "update_client":
          store.updateClient(String(t.id), {
            ...(t.status ? { status: t.status as never } : {}),
            ...(t.nextFollowUp ? { nextFollowUp: String(t.nextFollowUp) } : {}),
            ...(t.budgetMin != null ? { budgetMin: Number(t.budgetMin) } : {}),
            ...(t.budgetMax != null ? { budgetMax: Number(t.budgetMax) } : {}),
          });
          break;
        case "log_activity":
          store.addClientNote(String(t.clientId), { authorId: intent.actorId ?? "", body: String(t.body), type: (t.kind as never) ?? "note" });
          break;
        case "add_note":
          if (t.target === "client") store.addClientNote(String(t.id), { authorId: intent.actorId ?? "", body: String(t.body), type: "note" });
          else store.addTransactionNote(String(t.id), String(t.body), intent.actorId ?? "");
          break;
        case "complete_task":
          store.toggleTask(String(t.transactionId), String(t.taskId));
          break;
        case "move_stage":
          store.moveTransactionStage(String(t.transactionId), t.stage as never);
          break;
        default:
          // Everything else needs a store action that does not exist yet. Say so rather
          // than reporting a success the product cannot deliver — that is the exact failure
          // the audit found in 31 other buttons.
          toast.error("Not wired up yet", {
            description: `${intent.action} needs a store action before the assistant can apply it. Nothing was changed.`,
          });
          markApplied(intent, false);
          return;
      }
      toast.success("Applied", { description: intent.summary });
      markApplied(intent, true);
    } catch {
      toast.error("Could not apply that change.");
      markApplied(intent, false);
    }
  }

  function markApplied(intent: WriteIntent, ok: boolean) {
    setMessages((m) =>
      m.map((msg) =>
        msg.pending === intent
          ? { ...msg, pending: undefined, content: ok ? `${intent.summary}\n\n**Applied.**` : `${intent.summary}\n\n**Not applied.**` }
          : msg,
      ),
    );
  }

  const scopeLine =
    def.tier === 1 ? "Published listings and agent profiles only"
    : def.tier === 2 ? "Your book only — your clients, deals and commission"
    : `Scoped to your role: ${account?.role.replace(/_/g, " ") ?? "—"}`;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full py-3 pl-4 pr-5 text-[14px] font-medium shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl",
            def.tier === 1 ? "bg-ink text-white" : def.tier === 2 ? "bg-brand-700 text-white" : "bg-ink text-white",
          )}
          aria-label={`Open ${def.name}`}
        >
          <Sparkles className="size-4" />
          {def.name}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:p-5" role="dialog" aria-label={def.name}>
          <button
            type="button"
            aria-label="Close assistant"
            className="absolute inset-0 bg-ink/25 sm:bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-[min(680px,100dvh)] w-full flex-col overflow-hidden border border-line bg-surface shadow-2xl sm:h-[640px] sm:w-[420px] sm:rounded-2xl">

            <header className="flex items-start gap-3 border-b border-line px-4 py-3.5">
              <span className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[9px] text-white",
                def.tier === 3 ? "bg-ink" : def.tier === 2 ? "bg-brand-700" : "bg-brand-600",
              )}>
                <Bot className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14.5px] font-semibold tracking-[-0.015em] text-ink">
                  {def.name}
                  <span className="rounded-[4px] border border-line bg-subtle px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.08em] text-ink-3">
                    Tier {def.tier}
                  </span>
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-ink-3">
                  <Shield className="size-3 shrink-0" /> {scopeLine}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-[7px] p-1.5 text-ink-3 hover:bg-subtle hover:text-ink" aria-label="Close">
                <X className="size-4" />
              </button>
            </header>

            {!gatewayConfigured() && (
              <p className="flex items-start gap-2 border-b border-line bg-subtle px-4 py-2 text-[11.5px] leading-snug text-ink-2">
                <Lock className="mt-px size-3 shrink-0" />
                Offline — no model connected. Tools and permission checks are live; the wording is not.
              </p>
            )}

            <div ref={listRef} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 thin-scrollbar">
              {messages.length === 0 && <Intro def={def} onPick={(q) => { setInput(q); }} />}
              {messages.map((m) => (
                <Bubble key={m.id} message={m} onConfirm={apply} onCancel={(i) => markApplied(i, false)} />
              ))}
              {busy && (
                <p className="flex items-center gap-2 text-[13px] text-ink-3">
                  <span className="size-1.5 animate-pulse rounded-full bg-brand-500" /> Working…
                </p>
              )}
            </div>

            <form onSubmit={submit} className="border-t border-line p-3">
              <div className="flex items-end gap-2 rounded-xl border border-line bg-canvas p-2 focus-within:border-brand-400">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
                  rows={1}
                  placeholder={def.tier === 1 ? "Ask about a home, a neighborhood, an agent…" : "Ask, or tell me what to do…"}
                  className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent px-1.5 py-1 text-[14px] text-ink outline-none placeholder:text-ink-4"
                  aria-label={`Message ${def.name}`}
                />
                <Button type="submit" size="sm" disabled={!input.trim() || busy} aria-label="Send">
                  <Send className="size-3.5" />
                </Button>
              </div>
              <p className="mt-2 px-1 text-[11px] leading-snug text-ink-4">
                {def.tier === 1
                  ? "Property and agent information only. Nothing you write here is a binding offer."
                  : "Every change is confirmed with you first and recorded against your user id."}
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------- SUBVIEWS */

function Intro({ def, onPick }: { def: AgentDef; onPick: (q: string) => void }) {
  const prompts: Record<string, string[]> = {
    concierge: [
      "Two-bedroom condos in Flatiron under $4M",
      "Which of your agents speak Mandarin?",
      "How does a co-op board package work?",
    ],
    copilot: [
      "What is in my book right now?",
      "Which of my deals are at risk?",
      "What do I take home on a $3.2M sale?",
    ],
    operator: [
      "Reconcile the payout run",
      "Show compliance gaps, including closed files",
      "Whose licence expires in the next 90 days?",
    ],
  };
  return (
    <div>
      <p className="text-[13.5px] leading-relaxed text-ink-2">{def.tagline}</p>
      <div className="mt-3.5 space-y-1.5">
        {(prompts[def.id] ?? []).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="w-full rounded-[9px] border border-line bg-canvas px-3 py-2 text-left text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            {p}
          </button>
        ))}
      </div>
      <details className="mt-4 rounded-[9px] border border-line bg-canvas px-3 py-2">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[12px] font-medium text-ink-3">
          <ChevronDown className="size-3" /> What this assistant cannot do
        </summary>
        <ul className="mt-2 space-y-1 pl-4 text-[12px] leading-relaxed text-ink-3">
          {def.refuse.map((r) => <li key={r} className="list-disc">{r}</li>)}
        </ul>
      </details>
    </div>
  );
}

function Bubble({
  message, onConfirm, onCancel,
}: { message: Message; onConfirm: (i: WriteIntent) => void; onCancel: (i: WriteIntent) => void }) {
  if (message.role === "user") {
    return (
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-[13.5px] leading-relaxed text-white">
        {message.content}
      </p>
    );
  }
  return (
    <div className="max-w-full">
      {message.steps && message.steps.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {message.steps.map((s, i) => (
            <span
              key={`${s.tool}-${i}`}
              title={s.note}
              className={cn(
                "inline-flex items-center gap-1 rounded-[5px] border px-1.5 py-0.5 font-mono text-[10.5px]",
                s.ok ? "border-line bg-subtle text-ink-3" : "border-risk-500/30 bg-risk-50 text-risk-700",
              )}
            >
              {s.ok ? <Check className="size-2.5" /> : <Lock className="size-2.5" />}
              {s.tool}
            </span>
          ))}
        </div>
      )}
      <div className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink">
        {message.content}
      </div>
      {message.pending && (
        <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-brand-700">Confirm this change</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{message.pending.summary}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => onConfirm(message.pending!)}>Apply</Button>
            <Button size="sm" variant="secondary" onClick={() => onCancel(message.pending!)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
