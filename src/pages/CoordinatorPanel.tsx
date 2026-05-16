import { useCallback, useEffect, useState } from 'react';
import { AssignmentConfirmBar } from '../components/volunteer/AssignmentConfirmBar';
import { AvailableVolunteersColumn } from '../components/volunteer/AvailableVolunteersColumn';
import { CoordinatorToast } from '../components/volunteer/CoordinatorToast';
import { UNASSIGNED_NEED_STATUS } from '../components/volunteer/coordinatorUtils';
import { UnassignedNeedsColumn } from '../components/volunteer/UnassignedNeedsColumn';
import { supabase } from '../components/volunteer/supabase';
import type { Need, Volunteer } from '../types';

const TAILWIND_SCRIPT_ID = 'crisisiq-tailwind-coordinator';
const TOAST_DURATION_MS = 4000;

function CoordinatorPanel() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
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

  useEffect(() => {
    if (document.getElementById(TAILWIND_SCRIPT_ID)) return;
    const script = document.createElement('script');
    script.id = TAILWIND_SCRIPT_ID;
    script.src = 'https://cdn.tailwindcss.com';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchUnassignedNeeds = useCallback(async () => {
    const { data, error } = await supabase
      .from('needs')
      .select('*')
      .eq('status', UNASSIGNED_NEED_STATUS)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    setNeeds((data ?? []) as Need[]);
  }, []);

  const fetchAvailableVolunteers = useCallback(async () => {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('available', true)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    setVolunteers((data ?? []) as Volunteer[]);
  }, []);

  const loadNeeds = useCallback(async () => {
    setNeedsLoading(true);
    setNeedsError(null);
    try {
      await fetchUnassignedNeeds();
    } catch (err) {
      setNeedsError(
        err instanceof Error ? err.message : 'Failed to load unassigned needs.'
      );
    } finally {
      setNeedsLoading(false);
    }
  }, [fetchUnassignedNeeds]);

  const loadVolunteers = useCallback(async () => {
    setVolunteersLoading(true);
    setVolunteersError(null);
    try {
      await fetchAvailableVolunteers();
    } catch (err) {
      setVolunteersError(
        err instanceof Error ? err.message : 'Failed to load volunteers.'
      );
    } finally {
      setVolunteersLoading(false);
    }
  }, [fetchAvailableVolunteers]);

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
          void fetchUnassignedNeeds();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(needsChannel);
    };
  }, [fetchUnassignedNeeds]);

  useEffect(() => {
    const volunteersChannel = supabase
      .channel('coordinator-available-volunteers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'volunteers' },
        () => {
          void fetchAvailableVolunteers();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(volunteersChannel);
    };
  }, [fetchAvailableVolunteers]);

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

    await Promise.all([fetchUnassignedNeeds(), fetchAvailableVolunteers()]);
  }, [
    selectedNeed,
    selectedVolunteer,
    clearSelection,
    fetchUnassignedNeeds,
    fetchAvailableVolunteers,
  ]);

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-bold text-slate-900">Coordinator Panel</h1>
          <p className="text-sm text-slate-600">
            Assign available volunteers to unassigned needs
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-2">
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
        />
      </div>

      {showConfirmBar && selectedNeed && selectedVolunteer && (
        <AssignmentConfirmBar
          volunteerName={selectedVolunteer.name}
          needType={selectedNeed.need_type}
          isAssigning={isAssigning}
          onConfirm={() => {
            void handleConfirmAssign();
          }}
          onCancel={clearSelection}
        />
      )}

      {toast && (
        <CoordinatorToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      {showConfirmBar && <div className="h-24" aria-hidden />}
    </main>
  );
}

export default CoordinatorPanel;
