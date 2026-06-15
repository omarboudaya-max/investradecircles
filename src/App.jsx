import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
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
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App