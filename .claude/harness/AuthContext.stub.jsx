// LOCAL TEST HARNESS ONLY — presents a fictional signed-in user so that protected
// screens can be rendered. Pair with supabase.stub.js, which refuses every write.
import React, { createContext, useContext, useMemo } from 'react';
import { MotionGlobalConfig } from 'framer-motion';
import { HARNESS_USER_ID } from './supabase.stub.js';

// The preview pane is often in the background, where animation frames are throttled
// and exit animations never finish. Tests do not need animations.
MotionGlobalConfig.skipAnimations = true;

const AuthContext = createContext(null);
const role = new URLSearchParams(window.location.search).get('role') || sessionStorage.getItem('harness_role') || 'admin';
sessionStorage.setItem('harness_role', role);

const user = {
  id: HARNESS_USER_ID,
  email: 'harness@example.test',
  full_name: 'Test Harness',
  headline: 'Agri-food exporter looking for distributors in Europe',
  bio: 'Olive oil and dates, export to France and Germany.',
  user_type: 'innovator',
  role,
  // Add ?onboarded=0 to the address to walk through the onboarding steps.
  is_onboarded: new URLSearchParams(window.location.search).get('onboarded') !== '0',
  match_profile: null,
};

export const AuthProvider = ({ children }) => {
  const value = useMemo(() => ({
    user,
    isAuthenticated: true,
    isLoadingAuth: false,
    authError: null,
    authChecked: true,
    profileLoaded: true,
    isAdmin: role === 'admin',
    logout: async () => {},
    navigateToLogin: () => {},
    checkUserAuth: async () => {},
    refreshProfile: async () => {},
  }), []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
