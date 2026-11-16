import React, { lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import LanguageProfileSync from '@/components/layout/LanguageProfileSync';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageBoundary from '@/components/layout/PageBoundary';
import GlobalLoader from '@/components/layout/GlobalLoader';
import ScrollToTop from '@/components/ScrollToTop';
import AppLayout from '@/components/layout/AppLayout';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';

// Pages are loaded on demand so the first screen does not pay for the whole app.
const Landing = lazy(() => import('@/pages/Landing'));
const LandingInstitutions = lazy(() => import('@/pages/LandingInstitutions'));
const LandingIndividuals = lazy(() => import('@/pages/LandingIndividuals'));
const Landing3M = lazy(() => import('@/pages/Landing3M'));
const LandingContact = lazy(() => import('@/pages/LandingContact'));
const EventRegistrationLanding = lazy(() => import('@/pages/EventRegistrationLanding'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Home = lazy(() => import('@/pages/Home'));
const CreateCircle = lazy(() => import('@/pages/CreateCircle'));
const MyCircles = lazy(() => import('@/pages/MyCircles'));
const AllCircles = lazy(() => import('@/pages/AllCircles'));
const CircleDetail = lazy(() => import('@/pages/CircleDetail'));
const JoinCircle = lazy(() => import('@/pages/JoinCircle'));
const CreatePoll = lazy(() => import('@/pages/CreatePoll'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const Messages = lazy(() => import('@/pages/Messages'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const SavedPosts = lazy(() => import('@/pages/SavedPosts'));
const PostDetail = lazy(() => import('@/pages/PostDetail'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const InvestmentMap = lazy(() => import('@/pages/InvestmentMap'));
const InvestmentNetwork = lazy(() => import('@/pages/InvestmentNetwork'));
const InvestorProfileDetail = lazy(() => import('@/pages/InvestorProfileDetail'));
const FundProfileDetail = lazy(() => import('@/pages/FundProfileDetail'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const AIMatchmaker = lazy(() => import('@/pages/AIMatchmaker'));
const ExecutiveIntelligence = lazy(() => import('@/pages/ExecutiveIntelligence'));
const UTICACommandCenterPage = lazy(() => import('@/pages/UTICACommandCenterPage'));
const PageNotFound = lazy(() => import('@/lib/PageNotFound'));

const isInstalledApp = () => typeof window !== 'undefined' && (
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  Boolean(window.ReactNativeWebView) ||
  Boolean(window.Capacitor)
);

/** Investment pages are public: members see them inside the app, visitors inside the website chrome. */
const SmartInvestmentLayout = () => {
  const { user } = useAuth();
  if (user) return <AppLayout />;
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <WebsiteNavbar />
      <main className="flex-1 px-3 py-4 sm:px-6">
        <PageBoundary><Outlet /></PageBoundary>
      </main>
      <WebsiteFooter />
    </div>
  );
};

const page = (element) => <PageBoundary compact={false}>{element}</PageBoundary>;

const AppRoutes = () => {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <GlobalLoader />;

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/home" replace /> : isInstalledApp() ? <Navigate to="/login" replace /> : page(<Landing />)}
      />
      <Route path="/institutions" element={page(<LandingInstitutions />)} />
      <Route path="/individuals" element={page(<LandingIndividuals />)} />
      <Route path="/3m" element={page(<Landing3M />)} />
      <Route path="/contact" element={page(<LandingContact />)} />
      <Route path="/event" element={page(<EventRegistrationLanding />)} />
      <Route path="/event-registration" element={<Navigate to="/event" replace />} />
      <Route path="/login" element={page(<Login />)} />
      <Route path="/register" element={page(<Register />)} />
      <Route path="/forgot-password" element={page(<ForgotPassword />)} />
      <Route path="/reset-password" element={page(<ResetPassword />)} />

      <Route path="/utica-command" element={page(<UTICACommandCenterPage />)} />
      <Route path="/utica-command-center" element={<Navigate to="/utica-command" replace />} />
      <Route path="/utica-presentation" element={<Navigate to="/utica-command?fullscreen=true" replace />} />

      <Route element={<SmartInvestmentLayout />}>
        <Route path="/investment-map" element={<InvestmentMap />} />
        <Route path="/investment-network" element={<InvestmentNetwork />} />
        <Route path="/investment-network/fund/:fundSlug" element={<FundProfileDetail />} />
        <Route path="/fund/:fundSlug" element={<FundProfileDetail />} />
        <Route path="/investment-network/:organizationSlug" element={<InvestorProfileDetail />} />
        <Route path="/investor/:id" element={<InvestorProfileDetail />} />
        <Route path="/investment-project/:id" element={<ProjectDetail />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/matchmaker" element={<AIMatchmaker />} />
        <Route path="/intelligence" element={<ExecutiveIntelligence />} />
        {['/executive-intelligence', '/executive-command-center', '/executive', '/command-center'].map((path) => (
          <Route key={path} path={path} element={<Navigate to="/intelligence" replace />} />
        ))}
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/onboarding" element={page(<Onboarding />)} />
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/create-circle" element={<CreateCircle />} />
          <Route path="/my-circles" element={<MyCircles />} />
          <Route path="/all-circles" element={<AllCircles />} />
          <Route path="/circle/:id" element={<CircleDetail />} />
          <Route path="/join-circle" element={<JoinCircle />} />
          <Route path="/create-poll" element={<CreatePoll />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/saved" element={<SavedPosts />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={page(<PageNotFound />)} />
    </Routes>
  );
};

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProfileSync />
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <ScrollToTop />
                <AppRoutes />
              </Router>
              <Toaster />
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
