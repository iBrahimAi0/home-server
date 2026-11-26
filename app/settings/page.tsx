'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    api.getBots()
      .then((bots) => {
        const targetId = bots.length > 0 ? bots[0].id : 'bot-1';
        router.replace(`/bots/${targetId}?tab=settings`);
      })
      .catch(() => {
        router.replace('/bots/bot-1?tab=settings');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-inset flex items-center justify-center text-slate-500 font-mono text-xs">
      Loading Settings...
    </div>
  );
}
