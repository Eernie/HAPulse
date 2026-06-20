/**
 * Guard — redirects to /onboarding when no persisted connection exists
 * and the user is not in demo mode.
 */

import React from 'react';
import { Navigate } from 'react-router';
import { useConnectionStore } from '../stores/connectionStore';

interface GuardProps {
  children: React.ReactNode;
}

export function Guard({ children }: GuardProps) {
  const { status, demo } = useConnectionStore();

  // Allow if connected (live or demo)
  if (demo || status === 'connected' || status === 'reconnecting') {
    return <>{children}</>;
  }

  // Check localStorage for persisted creds before redirecting.
  // During init() (which is async), status might still be 'idle' while
  // the auto-reconnect is in flight. We short-circuit: if we have
  // persisted credentials, allow through and let init() sort it out.
  try {
    const raw = localStorage.getItem('hapulse:connection');
    if (raw) {
      const persisted = JSON.parse(raw) as { url?: string; token?: string; demo?: boolean };
      if (persisted.demo || (persisted.url && persisted.token)) {
        return <>{children}</>;
      }
    }
  } catch {
    // ignore parse errors
  }

  return <Navigate to="/onboarding" replace />;
}
