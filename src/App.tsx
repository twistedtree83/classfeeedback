import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './pages/index';
import JoinPage from './pages/join';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="*" element={<Navigate to="/\" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;