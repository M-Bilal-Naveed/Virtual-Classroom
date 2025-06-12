
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/common/Navigation';
import Dashboard from './components/dashboard/Dashboard';
import Materials from './components/materials/Materials';
import Assignments from './components/assignments/Assignments';
import ClassScheduler from './components/classes/ClassScheduler';
import StudentClassView from './components/classes/StudentClassView';
import LiveClass from './components/classes/LiveClass';
import EventCalendar from './components/events/EventCalendar';
import ClassroomReports from './components/reports/ClassroomReports';
import EventAnnouncements from './components/announcements/EventAnnouncements';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/classes" element={<ClassScheduler />} />
                <Route path="/student-classes" element={<StudentClassView />} />
                <Route path="/live-class/:classId" element={<LiveClass />} />
                <Route path="/events" element={<EventCalendar />} />
                <Route path="/reports" element={<ClassroomReports />} />
                <Route path="/announcements" element={<EventAnnouncements />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
