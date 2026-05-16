import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatLocation } from '../components/volunteer/assignmentUtils';
import { AvailableVolunteersColumn } from '../components/volunteer/AvailableVolunteersColumn';
import { CoordinatorNavbar } from '../components/volunteer/CoordinatorNavbar';
import {
  CoordinatorStatsRow,
  type CoordinatorStats,
} from '../components/volunteer/CoordinatorStatsRow';
import { CoordinatorToast } from '../components/volunteer/CoordinatorToast';
import { UNASSIGNED_NEED_STATUS } from '../components/volunteer/coordinatorUtils';
import { UnassignedNeedsColumn } from '../components/volunteer/UnassignedNeedsColumn';
import { supabase } from '../components/volunteer/supabase';
import type { Need, Volunteer } from '../types';

const TOAST_DURATION_MS = 3000;

const INITIAL_STATS: CoordinatorStats = {
  unassigned: 0,
  assigned: 0,
  enRoute: 0,
  volunteersAvailable: 0,
};

function CoordinatorPanel() {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState<Need[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [stats, setStats] = useState<CoordinatorStats>(INITIAL_STATS);
  const [coordinatorEmail, setCoordinatorEmail] = useState<string | null>(null);
  const [needsLoading, setNeedsLoading] = useState(true);
  const [volunteersLoading, setVolunteersLoading] = useState(true);
  const [needsError, setNeedsError] = useState<string | null>(null);
  const [volunteersError, setVolunteersError] = useState<string | null>(null);

  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const refreshStats = useCallback(
    async (unassignedCount: number, volunteersCount: number) => {
      const [assignedRes, enRouteRes] = await Promise.all([
        supabase
          .from('needs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'assigned'),
        supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .in('status', ['en_route', 'arrived']),
      ]);

      setStats({
        unassigned: unassignedCount,
        assigned: assignedRes.count ?? 0,
        enRoute: enRouteRes.count ?? 0,
        volunteersAvailable: volunteersCount,
      });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCoordinatorEmail(user?.email ?? null);
    })();
  }, []);

  const fetchUnassignedNeeds = useCallback(async () => {
    const { data, error } = await supabase
      .from('needs')
      .select('*')
      .eq('status', UNASSIGNED_NEED_STATUS)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Need[];
    setNeeds(rows);
    return rows.length;
  }, []);

  const fetchAvailableVolunteers = useCallback(async () => {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('available', true)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Volunteer[];
    setVolunteers(rows);
    return rows.length;
  }, []);

  const loadNeeds = useCallback(async () => {
    setNeedsLoading(true);
    setNeedsError(null);
    try {
      const count = await fetchUnassignedNeeds();
      await refreshStats(count, volunteers.length);
    } catch (err) {
      setNeedsError(
        err instanceof Error ? err.message : 'Failed to load unassigned needs.'
      );
    } finally {
      setNeedsLoading(false);
    }
  }, [fetchUnassignedNeeds, refreshStats, volunteers.length]);

  const loadVolunteers = useCallback(async () => {
    setVolunteersLoading(true);
    setVolunteersError(null);
    try {
      const count = await fetchAvailableVolunteers();
      await refreshStats(needs.length, count);
    } catch (err) {
      setVolunteersError(
        err instanceof Error ? err.message : 'Failed to load volunteers.'
      );
    } finally {
      setVolunteersLoading(false);
    }
  }, [fetchAvailableVolunteers, refreshStats, needs.length]);

  useEffect(() => {
    void loadNeeds();
    void loadVolunteers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount bootstrap
  }, []);

  useEffect(() => {
    const needsChannel = supabase
      .channel('coordinator-unassigned-needs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'needs' },
        () => {
          void (async () => {
            try {
              const unassigned = await fetchUnassignedNeeds();
              await refreshStats(unassigned, volunteers.length);
            } catch {
              /* keep prior list on transient errors */
            }
          })();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(needsChannel);
    };
  }, [fetchUnassignedNeeds, refreshStats, volunteers.length]);

  useEffect(() => {
    const volunteersChannel = supabase
      .channel('coordinator-available-volunteers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'volunteers' },
        () => {
          void (async () => {
            try {
              const available = await fetchAvailableVolunteers();
              await refreshStats(needs.length, available);
            } catch {
              /* keep prior list on transient errors */
            }
          })();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(volunteersChannel);
    };
  }, [fetchAvailableVolunteers, refreshStats, needs.length]);

  const selectedNeed = needs.find((n) => n.id === selectedNeedId) ?? null;
  const selectedVolunteer =
    volunteers.find((v) => v.id === selectedVolunteerId) ?? null;

  const showConfirmBar = Boolean(selectedNeed && selectedVolunteer);

  const handleSelectNeed = useCallback((needId: string) => {
    setSelectedNeedId(needId);
  }, []);

  const handleSelectVolunteer = useCallback((volunteerId: string) => {
    setSelectedVolunteerId(volunteerId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNeedId(null);
    setSelectedVolunteerId(null);
  }, []);

  const handleConfirmAssign = useCallback(async () => {
    if (!selectedNeed || !selectedVolunteer) return;

    setIsAssigning(true);

    const { error: insertError } = await supabase.from('assignments').insert({
      need_id: selectedNeed.id,
      volunteer_id: selectedVolunteer.id,
      status: 'assigned',
    });

    if (insertError) {
      setIsAssigning(false);
      setToast({
        message: insertError.message || 'Failed to create assignment.',
        variant: 'error',
      });
      return;
    }

    const { error: updateError } = await supabase
      .from('needs')
      .update({
        status: 'assigned',
        assigned_volunteer_id: selectedVolunteer.id,
      })
      .eq('id', selectedNeed.id);

    setIsAssigning(false);

    if (updateError) {
      setToast({
        message: updateError.message || 'Assignment created but need update failed.',
        variant: 'error',
      });
      return;
    }

    clearSelection();
    setToast({
      message: `${selectedVolunteer.name} assigned to ${selectedNeed.need_type} need.`,
      variant: 'success',
    });

    const unassigned = await fetchUnassignedNeeds();
    const available = await fetchAvailableVolunteers();
    await refreshStats(unassigned, available);
  }, [
    selectedNeed,
    selectedVolunteer,
    clearSelection,
    fetchUnassignedNeeds,
    fetchAvailableVolunteers,
    refreshStats,
  ]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/');
  }, [navigate]);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#0a0f1e] font-sans text-white">
      <CoordinatorNavbar
        coordinatorEmail={coordinatorEmail}
        onSignOut={() => {
          void handleSignOut();
        }}
      />

      <CoordinatorStatsRow stats={stats} />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <UnassignedNeedsColumn
          needs={needs}
          loading={needsLoading}
          error={needsError}
          selectedNeedId={selectedNeedId}
          onSelectNeed={handleSelectNeed}
          onRetry={() => {
            void loadNeeds();
          }}
        />
        <AvailableVolunteersColumn
          volunteers={volunteers}
          loading={volunteersLoading}
          error={volunteersError}
          selectedVolunteerId={selectedVolunteerId}
          onSelectVolunteer={handleSelectVolunteer}
          onRetry={() => {
            void loadVolunteers();
          }}
          showConfirmBar={showConfirmBar}
          confirmVolunteerName={selectedVolunteer?.name ?? ''}
          confirmNeedType={selectedNeed?.need_type ?? 'other'}
          confirmNeedLocation={
            selectedNeed ? formatLocation(selectedNeed) : ''
          }
          isAssigning={isAssigning}
          onConfirmAssign={() => {
            void handleConfirmAssign();
          }}
          onCancelAssign={clearSelection}
        />
      </div>

      {toast && (
        <CoordinatorToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  );
}

export default CoordinatorPanel;
