// autoloan-nextjs-metafullstack/src/hooks/useNotification.ts
'use client';

import { useState, useCallback } from 'react';
import type { AlertSeverity } from '@/components/NotificationAlert';

interface Notification {
  message: string;
  severity: AlertSeverity;
  open: boolean;
}

export function useNotification() {
  const [notification, setNotification] = useState<Notification>({ message: '', severity: 'info', open: false });

  const notify = useCallback((message: string, severity: AlertSeverity = 'info') => {
    setNotification({ message, severity, open: true });
  }, []);

  const close = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  return { notification, notify, close };
}
