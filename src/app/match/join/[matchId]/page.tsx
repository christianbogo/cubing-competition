'use client';

import React, { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { GuestTimerDisplay } from '@/components/display/GuestTimerDisplay';

export default function JoinMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slot');

  if (!slotId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-4 max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase font-mono">Invalid Link</h1>
          <p className="text-slate-500 text-sm">
            This join link is missing a player slot ID. Please ask the host to send you a complete link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GuestTimerDisplay matchId={resolvedParams.matchId} slotId={slotId} />
  );
}
