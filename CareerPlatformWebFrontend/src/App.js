import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelection from './pages/RoleSelection';
import Assessment from './pages/Assessment';
import GapAnalysis from './pages/GapAnalysis';
import DevelopmentPlan from './pages/DevelopmentPlan';
import AdminTemplates from './pages/AdminTemplates';
import AdminAuditLogs from './pages/AdminAuditLogs';
import { RequireAuth, useAuth } from './context/AuthContext';

// PUBLIC_INTERFACE
function App() {
  /** Root application with routing and top navigation. */
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <NavBar />
      <main className="main">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/roles" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/roles" replace /> : <Register />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <Navigate to="/roles" replace />
              </RequireAuth>
            }
          />

          <Route
            path="/roles"
            element={
              <RequireAuth>
                <RoleSelection />
              </RequireAuth>
            }
          />
          <Route
            path="/assessment"
            element={
              <RequireAuth>
                <Assessment />
              </RequireAuth>
            }
          />
          <Route
            path="/gap"
            element={
              <RequireAuth>
                <GapAnalysis />
              </RequireAuth>
            }
          />
          <Route
            path="/plan"
            element={
              <RequireAuth>
                <DevelopmentPlan />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <RequireAuth>
                <AdminTemplates />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <RequireAuth>
                <AdminAuditLogs />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to={isAuthenticated ? '/roles' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
