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

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/student" element={<StudentView />} />
        <Route path="/planner" element={<LessonPlannerPage />} />
        <Route path="/planner/create" element={<CreateLesson />} />
        <Route path="/planner/:id/edit" element={<EditLesson />} />
        <Route path="/planner/:id" element={<LessonDetails />} />
        <Route path="/teach/:code" element={<TeachingModePage />} />
        <Route path="*" element={<Navigate to="/\" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;