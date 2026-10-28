'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { readSession, type Session } from '@st/api-client/session-reader';
type SessionState = { session: Session | null; loading: boolean; refresh: () => Promise<void> };
const Context = createContext<SessionState | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); const [loading, setLoading] = useState(true); const generation = useRef(0);
  const refresh = useCallback(async () => { const version = ++generation.current; try { const next = await readSession(); if (version === generation.current) setSession(next); } catch { if (version === generation.current) setSession(null); } finally { if (version === generation.current) setLoading(false); } }, []);
  useEffect(() => { void refresh(); const visible = () => { if (document.visibilityState === 'visible') void refresh(); }; document.addEventListener('visibilitychange', visible);window.addEventListener('panah:authorization-recheck',refresh); return () => { ++generation.current; document.removeEventListener('visibilitychange', visible);window.removeEventListener('panah:authorization-recheck',refresh); }; }, [refresh]);
  return <Context.Provider value={{ session, loading, refresh }}>{children}</Context.Provider>;
}
export function useSession(): SessionState { const value = useContext(Context); if (!value) throw new Error('SessionProvider is required'); return value; }
