import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TeacherDashboard from './pages/index';
import JoinPage from './pages/join';
import { StudentView } from './pages/StudentView';
import { LessonPlannerPage } from './pages/LessonPlannerPage';
import { EditLesson } from './pages/EditLesson';
import { CreateLesson } from './pages/CreateLesson';
import { LessonDetails } from './pages/LessonDetails';
import { TeachingModePage } from './pages/TeachingModePage';
import { MainNav } from './components/MainNav';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ResetPassword } from './pages/ResetPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from './pages/HomePage';
import { LessonSummaryPage } from './pages/LessonSummaryPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { AboutPage } from './pages/AboutPage';

// Wrapper component to conditionally render the MainNav
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Marketing pages with their own navigation (don't show MainNav)
  const pagesWithCustomNav = ['/', '/features', '/about'];
  
  // Check if the current page has its own navigation
  const showMainNav = !pagesWithCustomNav.includes(location.pathname);
  
  return (
    <>
      {showMainNav && <MainNav />}
      {children}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppLayout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/student" element={<StudentView />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/about" element={<AboutPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/planner" element={
              <ProtectedRoute>
                <LessonPlannerPage />
              </ProtectedRoute>
            } />
            <Route path="/planner/create" element={
              <ProtectedRoute>
                <CreateLesson />
              </ProtectedRoute>
            } />
            <Route path="/planner/:id/edit" element={
              <ProtectedRoute>
                <EditLesson />
              </ProtectedRoute>
            } />
            <Route path="/planner/:id" element={
              <ProtectedRoute>
                <LessonDetails />
              </ProtectedRoute>
            } />
            <Route path="/teach/:code" element={
              <ProtectedRoute>
                <TeachingModePage />
              </ProtectedRoute>
            } />
            <Route path="/lesson-summary/:code" element={
              <ProtectedRoute>
                <LessonSummaryPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={<Profile />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            
            <Route path="*" element={<Navigate to="/\" replace />} />
          </Routes>
          <Toaster />
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;