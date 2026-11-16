import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

function ProfileUnavailable({ onRetry }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <WifiOff className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">We couldn't load your profile</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">Check your connection and try again. You are still signed in.</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="w-4 h-4" /> Try again
      </button>
    </div>
  );
}

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, user, profileLoaded, refreshProfile } = useAuth();
  const location = useLocation();

  if (isLoadingAuth || !authChecked) return fallback;

  if (authError) return unauthenticatedElement;

  if (!isAuthenticated) return unauthenticatedElement;

  // Without the profile we cannot tell whether onboarding is done; never guess,
  // or an established member gets pushed back through onboarding on a bad connection.
  if (user && !profileLoaded && !user.is_onboarded) {
    return <ProfileUnavailable onRetry={refreshProfile} />;
  }

  if (user && !user.is_onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (user && user.is_onboarded && location.pathname === '/onboarding') {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
