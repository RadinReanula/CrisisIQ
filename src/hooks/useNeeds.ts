import { useEffect, useState } from 'react';

import type { Need } from '../types';
import { getAllNeeds, parseNeedRecord, supabase } from '../services/supabase';

export function useNeeds() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const channelName = `crisisiq-needs-${Math.random().toString(36).slice(2)}`;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function loadInitialNeeds() {
      setLoading(true);
      const fetched = await getAllNeeds(undefined);
      if (cancelled) {
        return;
      }

      if (fetched === null) {
        setError('Unable to load needs right now.');
        setNeeds([]);
      } else {
        setError(null);
        setNeeds(fetched);
      }

      setLoading(false);
    }

    async function bootstrap() {
      await loadInitialNeeds();
      if (cancelled) {
        return;
      }

      channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes',
        { schema: 'public', table: 'needs', event: 'INSERT' },
        (payload) => {
          const inserted = parseNeedRecord(payload.new);
          if (!inserted) {
            return;
          }

          setNeeds((prev) => {
            if (prev.some((existing) => existing.id === inserted.id)) {
              return prev;
            }
            return [...prev, inserted].sort((a, b) => {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          });
        },
      );

      channel.on(
        'postgres_changes',
        { schema: 'public', table: 'needs', event: 'UPDATE' },
        (payload) => {
          const updated = parseNeedRecord(payload.new);
          if (!updated) {
            return;
          }

          setNeeds((prev) => prev.map((need) => (need.id === updated.id ? updated : need)));
        },
      );

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError((current) => current ?? 'Lost connection to realtime updates.');
        }
      });
    }

    void bootstrap();

    return () => {
      cancelled = true;

      if (channel) {
        channel.unsubscribe();
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return { needs, loading, error };
}
