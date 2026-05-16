import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { CrisisEvent } from '../types';
import { AppContext } from './appContextValue';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [currentEvent, setCurrentEvent] = useState<CrisisEvent | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted || error) {
        return;
      }

      setUser(data.session?.user ?? null);
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isCoordinator = user?.user_metadata?.role === 'coordinator';

  const value = useMemo(
    () => ({
      user,
      isCoordinator,
      currentEvent,
      setCurrentEvent,
    }),
    [currentEvent, isCoordinator, user],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
