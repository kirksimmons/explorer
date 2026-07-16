import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import {
  progressReducer,
  parseProgress,
  type Progress,
  type ProgressAction,
} from '../engine/progress';
import { loadItem, saveItem, storageAvailable } from '../engine/storage';

const STORAGE_KEY = 'world-explorer-progress-v1';

const ProgressCtx = createContext<{
  progress: Progress;
  dispatch: (action: ProgressAction) => void;
  canPersist: boolean;
} | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, dispatch] = useReducer(progressReducer, undefined, () =>
    parseProgress(loadItem(STORAGE_KEY)),
  );

  useEffect(() => {
    saveItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  return (
    <ProgressCtx.Provider value={{ progress, dispatch, canPersist: storageAvailable() }}>
      {children}
    </ProgressCtx.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error('useProgress outside provider');
  return ctx;
}
