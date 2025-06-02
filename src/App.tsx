import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './pages/index';
import JoinPage from './pages/join';
import { StudentView } from './pages/StudentView';
import { LessonPlannerPage } from './pages/LessonPlannerPage';
import { EditLesson } from './pages/EditLesson';
import { CreateLesson } from './pages/CreateLesson';
import { LessonDetails } from './pages/LessonDetails';
import { TeachingModePage } from './pages/TeachingModePage';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ResetPassword } from './pages/ResetPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/student" element={<StudentView />} />
          
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;