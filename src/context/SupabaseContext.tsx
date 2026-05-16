import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface SupabaseProviderProps {
  children: ReactNode;
}

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }

  return context;
}
