import { appParams } from '@/lib/app-params';

/**
 * Returns the public-facing URL of the app.
 * Uses the configured VITE_BASE44_APP_BASE_URL when set on the platform,
 * otherwise falls back to window.location.origin (useful in sandbox previews).
 */
export function getAppUrl() {
  return appParams.appBaseUrl || window.location.origin;
}