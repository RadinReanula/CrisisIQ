import { useEffect, useState } from 'react';

import type { Volunteer } from '../types';
import { parseVolunteerRecord, supabase } from '../services/supabase';

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const channelName = `crisisiq-volunteers-${Math.random().toString(36).slice(2)}`;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function loadVolunteers() {
      const { data, error } = await supabase.from('volunteers').select('*').order('name', {
        ascending: true,
      });

      if (cancelled) {
        return;
      }

      if (error) {
        console.error('[useVolunteers] fetch failed:', error.message);
        setVolunteers([]);
        setLoading(false);
        return;
      }

      const parsed: Volunteer[] = [];
      for (const raw of Array.isArray(data) ? data : []) {
        const volunteer = parseVolunteerRecord(raw);
        if (volunteer) {
          parsed.push(volunteer);
        }
      }

      setVolunteers(parsed);
      setLoading(false);
    }

    void loadVolunteers();

    channel = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      { schema: 'public', table: 'volunteers', event: 'UPDATE' },
      () => {
        void loadVolunteers();
      },
    );

    channel.subscribe();

    return () => {
      cancelled = true;
      if (channel) {
        channel.unsubscribe();
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return { volunteers, loading };
}
