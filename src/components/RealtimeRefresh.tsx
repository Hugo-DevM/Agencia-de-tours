'use client';

import { useRealtimeRefresh, type RealtimeTable } from '@/hooks/useRealtimeRefresh';

interface Props {
  channelName: string;
  tables: RealtimeTable[];
}

/**
 * Invisible client component — drop into any Server Component page to get
 * live updates via Supabase Realtime + router.refresh().
 */
export function RealtimeRefresh({ channelName, tables }: Props) {
  useRealtimeRefresh(channelName, tables);
  return null;
}
