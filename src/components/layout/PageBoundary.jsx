import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from '@/components/layout/ErrorBoundary';

export const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
  </div>
);

/**
 * Wraps a routed page: shows a spinner while its code loads and contains any crash
 * to the page area, so navigation stays usable. The error clears on navigation.
 */
export default function PageBoundary({ children, compact = true }) {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname} compact={compact}>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
