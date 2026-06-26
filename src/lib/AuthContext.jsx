import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  let profileData = data || {};
  
  if (profileData.email === 'omarboudaya1@gmail.com' && profileData.role !== 'admin') {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    profileData.role = 'admin';
  }
  
  return profileData;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Hard fallback: If auth checks take longer than 8 seconds, force unblock
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check timeout reached, forcing unblock.');
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }, 8000);

    checkUserAuth().finally(() => clearTimeout(fallbackTimer));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            const metadata = session.user.user_metadata || {};
            const isOnboarded = profile.is_onboarded === true || metadata.is_onboarded === true;
            
            setUser({ 
              ...session.user, 
              ...metadata, 
              ...profile,
              is_onboarded: isOnboarded
            });
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error("Auth state change error:", err);
          setUser(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        const metadata = session.user.user_metadata || {};
        
        // Ensure is_onboarded is explicitly boolean
        const isOnboarded = profile.is_onboarded === true || metadata.is_onboarded === true;
        
        setUser({ 
          ...session.user, 
          ...metadata, 
          ...profile,
          is_onboarded: isOnboarded
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      await supabase.auth.signOut().catch(() => {});
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required'
      });
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const refreshProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const profile = await fetchProfile(authUser.id);
      const metadata = authUser.user_metadata || {};
      const isOnboarded = profile.is_onboarded === true || metadata.is_onboarded === true;
      
      setUser({ 
        ...authUser, 
        ...metadata, 
        ...profile,
        is_onboarded: isOnboarded
      });
    }
  };

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
