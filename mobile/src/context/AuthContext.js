import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  } catch (err) {
    console.error('Error fetching profile:', err);
    return {};
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingAuth(false);
      }
    }, 6000);

    checkUserAuth().finally(() => clearTimeout(fallbackTimer));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            if (event === 'TOKEN_REFRESHED') {
              setUser(prevUser => (prevUser ? { ...prevUser, ...session.user } : null));
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
          setIsLoadingAuth(false);
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
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      logout,
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
