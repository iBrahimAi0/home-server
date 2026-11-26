"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { NexusLogo } from "@/components/NexusLogo";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Sign-in failed.");
      window.location.replace("/bots");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-black px-5 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-panel">
        <div className="flex h-2" aria-hidden="true">
          {["#edb825", "#000000", "#171717", "#212121", "#252525"].map(color => (
            <div key={color} className="flex-1" style={{ background: color }}/>
          ))}
        </div>
        <div className="p-7 sm:p-10">
          <NexusLogo size={32}/>
          <h1 className="mt-9 text-4xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-neutral-400">Manage bots on your home server.</p>
          <form onSubmit={signIn} className="mt-7 space-y-4">
            <label className="forge-label">Username<input autoComplete="username" className="forge-input" name="username" defaultValue="admin" required/></label>
            <label className="forge-label">Password<input autoComplete="current-password" className="forge-input" name="password" type="password" required/></label>
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
            <button className="forge-btn-primary mt-2 min-h-11 w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}<ArrowRight size={17}/></button>
          </form>
        </div>
      </section>
    </div>
  );
}
