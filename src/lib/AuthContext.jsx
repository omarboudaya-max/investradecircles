import React, { createContext, useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

const PROFILE_RETRIES = 3;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Load the profile row for a user. Returns null when it could not be loaded, which is
 * different from "this user has no profile yet" ({}). Callers must not treat a failed
 * load as an empty profile, otherwise a slow network silently strips the user's role.
 */
async function fetchProfile(userId) {
  for (let attempt = 0; attempt < PROFILE_RETRIES; attempt += 1) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!error) return data || {};
    if (attempt < PROFILE_RETRIES - 1) await wait(400 * (attempt + 1));
    else console.error('Profile load failed:', error.message);
  }
  return null;
}

function composeUser(sessionUser, profile) {
  const metadata = sessionUser.user_metadata || {};
  // Privileged fields only ever come from the profile row (protected by the database),
  // never from user_metadata, which every user can edit on their own account.
  const { role: _role, is_admin: _isAdmin, ...safeMetadata } = metadata;
  const safeProfile = profile || {};
  return {
    ...sessionUser,
    ...safeMetadata,
    ...safeProfile,
    id: sessionUser.id,
    email: sessionUser.email || safeProfile.email,
    role: safeProfile.role || 'user',
    match_profile: safeProfile.match_profile || metadata.match_profile || null,
    is_onboarded: safeProfile.is_onboarded === true || metadata.is_onboarded === true,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const profileCache = useRef({ userId: null, profile: null });
  const loadToken = useRef(0);

  /** Resolve the signed-in user for a session. Later calls supersede earlier ones. */
  const applySession = useCallback(async (session) => {
    const token = ++loadToken.current;
    const sessionUser = session?.user || null;

    if (!sessionUser) {
      profileCache.current = { userId: null, profile: null };
      setUser(null);
      setIsAuthenticated(false);
      setProfileLoaded(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }

    const cached = profileCache.current.userId === sessionUser.id ? profileCache.current.profile : null;
    // Show what is already known immediately; a returning user keeps their role while we refresh.
    if (cached) {
      setUser(composeUser(sessionUser, cached));
      setIsAuthenticated(true);
      setProfileLoaded(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }

    const profile = await fetchProfile(sessionUser.id);
    if (token !== loadToken.current) return; // a newer session event took over

    if (profile) profileCache.current = { userId: sessionUser.id, profile };
    setUser(composeUser(sessionUser, profile || cached));
    setIsAuthenticated(true);
    setProfileLoaded(Boolean(profile || cached));
    setAuthError(null);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, []);

  const checkUserAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      await applySession(session);
    } catch (error) {
      console.error('User auth check failed:', error);
      await supabase.auth.signOut().catch(() => {});
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [applySession]);

  useEffect(() => {
    let active = true;
    checkUserAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      // INITIAL_SESSION is handled by checkUserAuth above.
      if (event === 'INITIAL_SESSION') return;
      if (event === 'TOKEN_REFRESHED') {
        // The identity did not change; keep the loaded profile and just refresh token-bound fields.
        setUser((prev) => (prev && session?.user ? { ...prev, ...session.user, role: prev.role, email: session.user.email || prev.email } : prev));
        return;
      }
      // Supabase holds an internal lock while this callback runs, so calling the client
      // from inside it can deadlock. Defer the profile load to the next task.
      setTimeout(() => { if (active) applySession(session); }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [checkUserAuth, applySession]);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      profileCache.current = { userId: null, profile: null };
      await applySession(session);
    }
  }, [applySession]);

  const logout = useCallback(async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    profileCache.current = { userId: null, profile: null };
    setUser(null);
    setIsAuthenticated(false);
    setProfileLoaded(false);
    if (shouldRedirect) window.location.href = '/login';
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoadingAuth,
    authError,
    authChecked,
    profileLoaded,
    isAdmin: user?.role === 'admin',
    logout,
    navigateToLogin,
    checkUserAuth,
    refreshProfile,
  }), [user, isAuthenticated, isLoadingAuth, authError, authChecked, profileLoaded, logout, navigateToLogin, checkUserAuth, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
