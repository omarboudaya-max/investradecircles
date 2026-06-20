import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import CreateCircle from '@/pages/CreateCircle';
import MyCircles from '@/pages/MyCircles';
import CircleDetail from '@/pages/CircleDetail';
import CreatePoll from '@/pages/CreatePoll';
import UserProfile from '@/pages/UserProfile';
import AppLayout from '@/components/layout/AppLayout';
import Messages from '@/pages/Messages';
import JoinCircle from '@/pages/JoinCircle';
import SavedPosts from '@/pages/SavedPosts';
import PostDetail from '@/pages/PostDetail';
import AdminDashboard from '@/pages/AdminDashboard';
import AllCircles from '@/pages/AllCircles';
import Landing from '@/pages/Landing';
import LandingInstitutions from '@/pages/LandingInstitutions';
import LandingIndividuals from '@/pages/LandingIndividuals';
import Landing3M from '@/pages/Landing3M';
import LandingContact from '@/pages/LandingContact';

import GlobalLoader from '@/components/layout/GlobalLoader';

import Onboarding from '@/pages/Onboarding';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 2500); // Ensure loader logo forms fully (takes ~2.3s) before transition
    return () => clearTimeout(timer);
  }, []);

  const isWebsiteRoute = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/institutions', '/individuals', '/3m', '/contact'].includes(window.location.pathname);
  const showLoader = isLoadingPublicSettings || isLoadingAuth || (!isWebsiteRoute && !animationDone);

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && <GlobalLoader key="loader" />}
      </AnimatePresence>

      {!showLoader && (
        <>
          {authError ? (
            authError.type === 'user_not_registered' ? (
              <UserNotRegisteredError />
            ) : authError.type === 'auth_required' ? (
              (() => {
                navigateToLogin();
                return null;
              })()
            ) : null
          ) : (
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/institutions" element={<LandingInstitutions />} />
              <Route path="/individuals" element={<LandingIndividuals />} />
              <Route path="/3m" element={<Landing3M />} />
              <Route path="/contact" element={<LandingContact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/" replace />} />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route element={<AppLayout />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/create-circle" element={<CreateCircle />} />
                  <Route path="/my-circles" element={<MyCircles />} />
                  <Route path="/circle/:id" element={<CircleDetail />} />
                  <Route path="/create-poll" element={<CreatePoll />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/profile/:userId" element={<UserProfile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/join-circle" element={<JoinCircle />} />
                  <Route path="/saved" element={<SavedPosts />} />
                  <Route path="/post/:id" element={<PostDetail />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/all-circles" element={<AllCircles />} />
                </Route>
              </Route>

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          )}
        </>
      )}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
