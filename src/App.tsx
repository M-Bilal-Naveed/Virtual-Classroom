
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/common/Navigation';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Materials from './components/materials/Materials';
import Assignments from './components/assignments/Assignments';
import ClassScheduler from './components/classes/ClassScheduler';
import StudentClassView from './components/classes/StudentClassView';
import LiveClass from './components/classes/LiveClass';
import EventCalendar from './components/events/EventCalendar';
import ClassroomReports from './components/reports/ClassroomReports';
import EventAnnouncements from './components/announcements/EventAnnouncements';
import Chat from './components/chat/Chat';
import Submissions from './components/submissions/Submissions';
import Profile from './components/profile/Profile';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
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
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { user, loading } = useAuth();

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
    <div className="min-h-screen bg-gray-50">
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
              <main className="pt-16">
                <Dashboard />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <Materials />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <Assignments />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions/:assignmentId"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <Submissions />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <ClassScheduler />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-classes"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <StudentClassView />
              </main>
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
          path="/events"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <EventCalendar />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <ClassroomReports />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <EventAnnouncements />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <Chat />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="pt-16">
                <Profile />
              </main>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
