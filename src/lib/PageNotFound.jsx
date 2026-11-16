import { Link, useLocation } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Compass className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            There is nothing at <span className="break-all font-medium text-foreground">{location.pathname}</span>. It may have moved, or the link may be incomplete.
          </p>
        </div>
        <Link
          to={user ? '/home' : '/'}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Home className="h-4 w-4" /> {user ? 'Back to your feed' : 'Back to the home page'}
        </Link>
      </div>
    </div>
  );
}
