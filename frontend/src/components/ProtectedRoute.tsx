import { useEffect, useState, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../api';

type Props = { children: ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    isAuthenticated().then((ok: boolean) => {
      if (!cancelled) setStatus(ok ? 'ok' : 'denied');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="session-loading" aria-live="polite">
        <LoaderCircle className="spin" size={24} aria-hidden />
        <span>Checking session…</span>
      </div>
    );
  }
  if (status === 'denied') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
