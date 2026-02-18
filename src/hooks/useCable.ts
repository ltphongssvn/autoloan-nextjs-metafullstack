// autoloan-nextjs-metafullstack/src/hooks/useCable.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { cableService, type ConnectionState, type MessageHandler } from '@/services/cable';
import { useAuth } from '@/context/AuthContext';

export function useCable() {
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    cableService.setStateChangeHandler(setConnectionState);
    if (user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      cableService.connect(token || undefined);
    }
    return () => { cableService.disconnect(); };
  }, [user]);

  const subscribe = useCallback((channel: string, params: Record<string, unknown>, handler: MessageHandler) => {
    return cableService.subscribe(channel, params, handler);
  }, []);

  return { connectionState, subscribe };
}

export function useChannel(channel: string, params: Record<string, unknown>, handler: MessageHandler) {
  const { user } = useAuth();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    cableService.connect(token || undefined);
    const unsub = cableService.subscribe(channel, params, (...args) => handlerRef.current(...args));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, channel, paramsKey]);
}
