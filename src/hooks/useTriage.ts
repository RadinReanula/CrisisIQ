import { useCallback, useEffect, useRef, useState } from 'react';
import { triageNeed } from '../services/ai';
import { supabase } from '../services/supabase';
import type { Need, TriageResult, Volunteer } from '../types';

const NEARBY_RADIUS_KM = 25;

type PendingNeed = Need & {
  urgency_ai: number | null;
};

interface UseTriageResult {
  loading: boolean;
  error: string | null;
  runTriage: (needId: string) => Promise<void>;
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(from: Pick<Need, 'lat' | 'lng'>, to: Pick<Volunteer, 'lat' | 'lng'>) {
  const earthRadiusKm = 6371;
  const deltaLat = degreesToRadians(to.lat - from.lat);
  const deltaLng = degreesToRadians(to.lng - from.lng);
  const lat1 = degreesToRadians(from.lat);
  const lat2 = degreesToRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function shouldTriageNeed(need: PendingNeed) {
  return need.status === 'pending' && need.urgency_ai === null;
}

async function fetchPendingNeed(needId: string) {
  const { data, error } = await supabase
    .from('needs')
    .select('*')
    .eq('id', needId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PendingNeed;
}

async function fetchNearbyVolunteers(need: Pick<Need, 'lat' | 'lng'>) {
  const { data, error } = await supabase
    .from('volunteers')
    .select('id,user_id,name,lat,lng,skills,available,active_mission_id,phone,created_at')
    .eq('available', true);

  if (error) {
    throw new Error(error.message);
  }

  const volunteers = (data ?? []) as Volunteer[];

  return volunteers.filter((volunteer) => getDistanceKm(need, volunteer) <= NEARBY_RADIUS_KM);
}

async function saveTriageResult(needId: string, triageResult: TriageResult) {
  const { error } = await supabase
    .from('needs')
    .update({
      urgency_ai: triageResult.urgency_ai,
      ai_brief: triageResult.ai_brief,
      ai_matched_skills: triageResult.ai_matched_skills,
    })
    .eq('id', needId);

  if (error) {
    throw new Error(error.message);
  }
}

export function useTriage(): UseTriageResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTriageIds = useRef<Set<string>>(new Set());

  const runTriage = useCallback(async (needId: string) => {
    if (activeTriageIds.current.has(needId)) {
      return;
    }

    activeTriageIds.current.add(needId);
    setLoading(true);
    setError(null);

    try {
      const need = await fetchPendingNeed(needId);

      if (!shouldTriageNeed(need)) {
        return;
      }

      const availableVolunteers = await fetchNearbyVolunteers(need);
      const triageResult = await triageNeed(need, availableVolunteers);

      await saveTriageResult(need.id, triageResult);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to triage need';
      setError(message);
    } finally {
      activeTriageIds.current.delete(needId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function triageExistingPendingNeeds() {
      const { data, error: pendingError } = await supabase
        .from('needs')
        .select('id,status,urgency_ai')
        .eq('status', 'pending')
        .is('urgency_ai', null);

      if (!isMounted) {
        return;
      }

      if (pendingError) {
        setError(pendingError.message);
        return;
      }

      for (const need of data ?? []) {
        void runTriage(need.id as string);
      }
    }

    void triageExistingPendingNeeds();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let errorTimer: number | null = null;

    try {
      channel = supabase
        .channel('triage-needs-inserts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'needs' },
          (payload) => {
            const need = payload.new as PendingNeed;

            if (shouldTriageNeed(need)) {
              void runTriage(need.id);
            }
          },
        )
        .subscribe();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Realtime triage unavailable';
      errorTimer = window.setTimeout(() => {
        if (isMounted) {
          setError(message);
        }
      }, 0);
    }

    return () => {
      isMounted = false;
      if (errorTimer !== null) {
        window.clearTimeout(errorTimer);
      }
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [runTriage]);

  return { loading, error, runTriage };
}
