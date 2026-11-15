import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Care Counts" },
      { name: "description", content: "Sign in to your private Care Counts workspace with an email link." },
      { property: "og:title", content: "Sign in — Care Counts" },
      { property: "og:description", content: "Private email-link sign in. No password needed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) nav({ to: "/workspace", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (s && e === "SIGNED_IN") nav({ to: "/workspace", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth` } });
    setBusy(false);
    if (error) setErr("We couldn't send the link. Please check the address and try again."); else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8">
        <h1 className="font-display text-3xl font-semibold text-primary">Care Counts</h1>
        {sent ? (
          <div className="mt-6" role="status">
            <MailCheck className="h-10 w-10 text-primary" />
            <h2 className="mt-3 text-2xl font-semibold">Check your email</h2>
            <p className="mt-2 text-muted-foreground">We sent a private sign-in link to <strong>{email}</strong>. Open it on this device to reach your workspace.</p>
            <Button variant="ghost" className="mt-4" onClick={() => setSent(false)}>Use a different email</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-muted-foreground">Enter your email and we'll send you a private link. No password needed. The same link creates your workspace the first time.</p>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 text-lg" />
            </div>
            {err && <p className="text-destructive">{err}</p>}
            <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</Button>
            <p className="text-sm text-muted-foreground">We only use your email to sign you in.</p>
          </form>
        )}
      </div>
    </div>
  );
}
