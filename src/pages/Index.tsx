
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../components/auth/Login';
import Dashboard from '../components/dashboard/Dashboard';
import ClassScheduler from '../components/classes/ClassScheduler';
import StudentClassView from '../components/classes/StudentClassView';
import LiveClass from '../components/classes/LiveClass';
import Assignments from '../components/assignments/Assignments';
import Materials from '../components/materials/Materials';
import Attendance from '../components/attendance/Attendance';
import Chat from '../components/chat/Chat';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Navigation from '../components/common/Navigation';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  console.log('ProtectedRoute - user:', user?.email, 'loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { user, loading } = useAuth();

  console.log('AppContent - user:', user?.email, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navigation />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Navigation />
              <ClassScheduler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-class/:classId"
          element={
            <ProtectedRoute>
              <LiveClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Navigation />
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <Navigation />
              <Materials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Navigation />
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Navigation />
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

const Index = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Index;
