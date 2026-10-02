import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

async function fetchProfile(userId) {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    let profileData = data || {};
    
    if (profileData.email === 'omarboudaya1@gmail.com' && profileData.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
      profileData.role = 'admin';
    }
    
    return profileData;
  } catch (e) {
    return {};
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Hard fallback: If auth checks take longer than 2.5 seconds, force unblock
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }, 2500);

    checkUserAuth().finally(() => {
      if (isMounted) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            if (event === 'TOKEN_REFRESHED') {
              setUser(prevUser => {
                if (!prevUser) return null;
                return { ...prevUser, ...session.user };
              });
              setIsAuthenticated(true);
              return;
            }

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
          if (isMounted) {
            setIsLoadingAuth(false);
            setAuthChecked(true);
          }
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
      setAuthError(null);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const refreshProfile = async () => {
    try {
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
    } catch (e) {}
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
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
      isLoadingPublicSettings: false,
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
