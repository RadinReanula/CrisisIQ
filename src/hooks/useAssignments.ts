import { useEffect, useState } from 'react';

import type { Assignment } from '../types';
import {
  getVolunteerProfileByAuthUser,
  parseAssignmentRecord,
  supabase,
} from '../services/supabase';

function isRecordMetadata(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function coordinatorFromUser(user: unknown): boolean {
  if (!isRecordMetadata(user)) {
    return false;
  }

  const metadataCandidate = user['user_metadata'];

  if (!isRecordMetadata(metadataCandidate)) {
    return false;
  }

  const role = metadataCandidate['role'];
  return typeof role === 'string' && role === 'coordinator';
}

type CoordinatorScope =
  | { kind: 'guest' }
  | { kind: 'coordinator' }
  | { kind: 'volunteer'; volunteerId: string };

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let scope: CoordinatorScope = { kind: 'guest' };
    const channelName = `crisisiq-assignments-${Math.random().toString(36).slice(2)}`;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function resolveScope(user: unknown): Promise<CoordinatorScope> {
      if (!isRecordMetadata(user) || typeof user['id'] !== 'string') {
        return { kind: 'guest' };
      }

      const isCoordinatorUser = coordinatorFromUser(user);
      if (isCoordinatorUser) {
        return { kind: 'coordinator' };
      }

      const volunteer = await getVolunteerProfileByAuthUser(user['id']);
      return volunteer ? { kind: 'volunteer', volunteerId: volunteer.id } : { kind: 'guest' };
    }

    async function hydrateAssignments() {
      if (cancelled) {
        return;
      }

      if (scope.kind === 'guest') {
        setAssignments([]);
        setLoading(false);
        return;
      }

      let queryBuilder = supabase.from('assignments').select('*').order('assigned_at', {
        ascending: false,
      });

      if (scope.kind === 'volunteer') {
        queryBuilder = queryBuilder.eq('volunteer_id', scope.volunteerId);
      }

      const { data, error } = await queryBuilder;

      if (cancelled) {
        return;
      }

      if (error) {
        console.error('[useAssignments]', error.message);
        setAssignments([]);
        setLoading(false);
        return;
      }

      const parsed: Assignment[] = [];
      for (const raw of Array.isArray(data) ? data : []) {
        const assignment = parseAssignmentRecord(raw);
        if (assignment) {
          parsed.push(assignment);
        }
      }

      setAssignments(parsed);
      setLoading(false);
    }

    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      scope = await resolveScope(session?.user);
      await hydrateAssignments();

      if (cancelled) {
        return;
      }

      channel = supabase.channel(channelName);
      channel.on(
        'postgres_changes',
        { schema: 'public', table: 'assignments', event: 'INSERT' },
        () => {
          void hydrateAssignments();
        },
      );

      channel.on(
        'postgres_changes',
        { schema: 'public', table: 'assignments', event: 'UPDATE' },
        () => {
          void hydrateAssignments();
        },
      );

      channel.subscribe();
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

  return { assignments, loading };
}
