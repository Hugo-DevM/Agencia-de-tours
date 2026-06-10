'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export interface RealtimeTable {
  table: string;
  filter?: string;  // e.g. "profile_id=eq.abc123"
}

/**
 * Subscribes to one or more Supabase tables and calls router.refresh()
 * whenever a row is inserted, updated or deleted — so Server Components
 * re-render with fresh data without a full page reload.
 */
export function useRealtimeRefresh(channelName: string, tables: RealtimeTable[]) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel = supabase.channel(channelName);

    for (const { table, filter } of tables) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => router.refresh(),
      );
    }

    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);
}
