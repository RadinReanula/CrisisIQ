import { useEffect, useState } from 'react';

import type { Assignment, Need } from '../types';
import {
  getActiveVolunteerMission,
  getVolunteerProfileByAuthUser,
  supabase,
} from '../services/supabase';

function isAuthUser(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function useMyMission() {
  const [mission, setMission] = useState<(Assignment & { need: Need }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const channelName = `crisisiq-my-mission-${Math.random().toString(36).slice(2)}`;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      const rawUser = session?.user;
      if (!rawUser || !isAuthUser(rawUser) || typeof rawUser.id !== 'string') {
        setMission(null);
        setLoading(false);
        return;
      }

      const authUserId = rawUser.id;

      const volunteerProfile = await getVolunteerProfileByAuthUser(authUserId);

      async function refreshMission() {
        if (cancelled) {
          return;
        }

        const nextMission = await getActiveVolunteerMission(authUserId);
        if (!cancelled) {
          setMission(nextMission ?? null);
        }
      }

      if (!volunteerProfile) {
        setMission(null);
        setLoading(false);
        return;
      }

      await refreshMission();

      if (cancelled) {
        setLoading(false);
        return;
      }

      channel = supabase.channel(channelName);
      channel.on(
        'postgres_changes',
        {
          schema: 'public',
          table: 'assignments',
          event: 'UPDATE',
          filter: `volunteer_id=eq.${volunteerProfile.id}`,
        },
        () => {
          void refreshMission();
        },
      );

      channel.subscribe();

      if (!cancelled) {
        setLoading(false);
      }
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

  return { mission, loading };
}
