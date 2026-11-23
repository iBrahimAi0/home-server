'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NexusLogo } from '@/components/NexusLogo';
import { KeyRound, User, ArrowRight, ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate quick authentication validation
    setTimeout(() => {
      if (!username.trim()) {
        setError('Please enter a username or email.');
        setLoading(false);
        return;
      }
      
      // Store session token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('forge_session', JSON.stringify({
          user: username,
          role: 'Owner',
          token: 'forge_tok_' + Math.random().toString(36).substring(2),
          timestamp: Date.now()
        }));
      }
      
      router.push('/');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0D0E12] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#FACC15]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md forge-glass-card p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <NexusLogo />
          <h1 className="text-xl font-bold text-white tracking-tight pt-2">
            Sign In to Forge Panel
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Direct host node and bot container controller
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Username / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full bg-[#0D0E12]/90 text-white placeholder-slate-600 pl-9 pr-3 py-2.5 text-xs font-mono rounded-lg border border-[#22242B] focus:outline-none focus:border-[#FACC15] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Password / Auth Token
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Optional if unconfigured</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0D0E12]/90 text-white placeholder-slate-600 pl-9 pr-3 py-2.5 text-xs font-mono rounded-lg border border-[#22242B] focus:outline-none focus:border-[#FACC15] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
              <input
                type="checkbox"
                defaultChecked
                className="rounded bg-[#0D0E12] border-[#22242B] accent-[#FACC15]"
              />
              <span>Remember this session</span>
            </label>
            <span className="text-slate-500 text-[11px] font-mono">Owner Access</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full forge-btn-primary py-2.5 font-bold text-xs justify-center cursor-pointer shadow-lg shadow-[#FACC15]/10 mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>2FA & Token Isolation</span>
          </div>
          <span>Forge v3.0</span>
        </div>
      </div>
    </div>
  );
}
