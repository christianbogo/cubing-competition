'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeaderBar } from '@/components/display/HeaderBar';
import { MatchSetupWizard } from '@/components/setup/MatchSetupWizard';
import { useTournamentStore } from '@/store/tournamentStore';
import { useFirebaseHost } from '@/hooks/useFirebaseMatch';

function HostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const { matchStatus, matchId } = useTournamentStore();
  
  useEffect(() => {
    if (mode === 'local') {
      useTournamentStore.setState({ matchId: 'local' });
    }
  }, [mode]);

  // Hook for synchronizing match state to Firebase Realtime Database
  useFirebaseHost();

  useEffect(() => {
    if (matchStatus === 'IN_PROGRESS') {
      router.push(`/arena/${matchId}`);
    }
  }, [matchStatus, matchId, router]);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200">
      <HeaderBar
        isFullscreen={false}
        onToggleFullscreen={() => {}}
        onOpenAdmin={() => {}}
        onOpenOverview={() => {}}
      />
      
      <main className="flex-1 w-full flex flex-col items-center justify-center py-6 z-20">
        <MatchSetupWizard />
      </main>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <HostPageContent />
    </Suspense>
  );
}
