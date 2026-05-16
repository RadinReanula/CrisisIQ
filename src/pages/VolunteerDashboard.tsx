import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssignmentList } from '../components/volunteer/AssignmentList';
import type { AssignmentWithNeed } from '../components/volunteer/assignmentUtils';
import { VolunteerTopBar } from '../components/volunteer/VolunteerTopBar';
import { supabase } from '../components/volunteer/supabase';
import type { Volunteer } from '../types';

function VolunteerDashboard() {
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [authDisplayName, setAuthDisplayName] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const volunteerIdRef = useRef<string | null>(null);

  const fetchVolunteerProfile = useCallback(async (userId: string) => {
    const { data, error: volError } = await supabase
      .from('volunteers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (volError) throw new Error(volError.message);
    if (!data) {
      throw new Error(
        'No volunteer profile found for this account. Please complete registration first.'
      );
    }

    setVolunteer(data as Volunteer);
    volunteerIdRef.current = data.id;
    return data.id as string;
  }, []);

  const fetchAssignments = useCallback(async (volunteerId: string) => {
    const { data, error: fetchError } = await supabase
      .from('assignments')
      .select('*, needs(*)')
      .eq('volunteer_id', volunteerId)
      .order('assigned_at', { ascending: false });

    if (fetchError) throw new Error(fetchError.message);

    const rows = (data ?? []) as AssignmentWithNeed[];
    setAssignments(rows);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);
      if (!user) {
        setAuthError('You must be signed in to view your dashboard.');
        setVolunteer(null);
        setAssignments([]);
        setAuthDisplayName(null);
        return;
      }

      const meta = user.user_metadata as { full_name?: string } | undefined;
      setAuthDisplayName(
        meta?.full_name?.trim() || user.email?.split('@')[0] || null
      );

      const volunteerId = await fetchVolunteerProfile(user.id);
      await fetchAssignments(volunteerId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments, fetchVolunteerProfile]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadDashboard();
    });
  }, [loadDashboard]);

  useEffect(() => {
    const volunteerId = volunteerIdRef.current;
    if (!volunteerId) return;

    const channel = supabase
      .channel(`volunteer-assignments-${volunteerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `volunteer_id=eq.${volunteerId}`,
        },
        () => {
          void fetchAssignments(volunteerId);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [volunteer?.id, fetchAssignments]);

  useEffect(() => {
    const volunteerId = volunteer?.id;
    if (!volunteerId) return;

    const volunteerChannel = supabase
      .channel(`volunteer-profile-${volunteerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'volunteers',
          filter: `id=eq.${volunteerId}`,
        },
        (payload) => {
          const updated = payload.new as Volunteer;
          setVolunteer(updated);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(volunteerChannel);
    };
  }, [volunteer?.id]);

  const handleToggleAvailability = useCallback(async () => {
    if (!volunteer) return;

    setIsTogglingAvailability(true);
    const nextAvailable = !volunteer.available;

    const { data, error: updateError } = await supabase
      .from('volunteers')
      .update({ available: nextAvailable })
      .eq('id', volunteer.id)
      .select()
      .single();

    setIsTogglingAvailability(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setVolunteer(data as Volunteer);
  }, [volunteer]);

  const handleMarkEnRoute = useCallback(
    async (assignmentId: string) => {
      setUpdatingId(assignmentId);
      setError(null);

      const { error: updateError } = await supabase
        .from('assignments')
        .update({ status: 'en_route' })
        .eq('id', assignmentId);

      setUpdatingId(null);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (volunteerIdRef.current) {
        await fetchAssignments(volunteerIdRef.current);
      }
    },
    [fetchAssignments]
  );

  const handleMarkComplete = useCallback(
    async (assignmentId: string) => {
      setUpdatingId(assignmentId);
      setError(null);

      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      setUpdatingId(null);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (volunteerIdRef.current) {
        await fetchAssignments(volunteerIdRef.current);
      }
    },
    [fetchAssignments]
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/volunteer');
  }, [navigate]);

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0f1e] px-4">
        <p className="max-w-sm text-center text-sm text-red-400" role="alert">
          {authError}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] font-sans text-white">
      {volunteer && (
        <VolunteerTopBar
          authDisplayName={authDisplayName ?? volunteer.name}
          available={volunteer.available}
          isTogglingAvailability={isTogglingAvailability}
          onToggleAvailability={() => {
            void handleToggleAvailability();
          }}
          onSignOut={() => {
            void handleSignOut();
          }}
        />
      )}

      <AssignmentList
        assignments={assignments}
        loading={loading}
        error={error}
        updatingId={updatingId}
        onRetry={() => {
          void loadDashboard();
        }}
        onMarkEnRoute={(id) => {
          void handleMarkEnRoute(id);
        }}
        onMarkComplete={(id) => {
          void handleMarkComplete(id);
        }}
      />
    </main>
  );
}

export default VolunteerDashboard;
