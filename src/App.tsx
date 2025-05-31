import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './pages/index';
import JoinPage from './pages/join';
import { LessonPlannerPage } from './pages/LessonPlannerPage';
import { EditLesson } from './pages/EditLesson';
import { CreateLesson } from './pages/CreateLesson';
import { LessonDetails } from './pages/LessonDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/planner" element={<LessonPlannerPage />} />
        <Route path="/planner/create" element={<CreateLesson />} />
        <Route path="/planner/:id/edit" element={<EditLesson />} />
        <Route path="/planner/:id" element={<LessonDetails />} />
        <Route path="*" element={<Navigate to="/\" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;