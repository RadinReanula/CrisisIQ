import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { CrisisEvent } from '../types';

export interface AppContextValue {
  user: User | null;
  isCoordinator: boolean;
  currentEvent: CrisisEvent | null;
  setCurrentEvent: (event: CrisisEvent | null) => void;
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);
