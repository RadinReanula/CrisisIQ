import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { SupabaseContext } from './supabaseContextValue';

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}
