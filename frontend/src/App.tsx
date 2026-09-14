/**
 * Bhūmi Prājñā - Main Application Entry
 * Routes, auth provider, layout wiring.
 */


import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Auth
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Projects (M3)
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import AddProjectPage from './pages/projects/AddProjectPage';
import UpdateSnapshotPage from './pages/projects/UpdateSnapshotPage';

// Analytics (M4)
import AnalyticsPage from './pages/analytics/AnalyticsPage';

// GIS (M4)
import GISPage from './pages/gis/GISPage';

// Notifications (M4)
import NotificationsPage from './pages/notifications/NotificationsPage';

// Audit (M4)
import AuditPage from './pages/audit/AuditPage';

// Admin + Model Governance (M5)
import AdminPage from './pages/admin/AdminPage';
import ModelGovernancePage from './pages/admin/ModelGovernancePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* M3 — Projects */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<AddProjectPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/snapshot" element={<UpdateSnapshotPage />} />

            {/* M4 — Analytics, GIS, Notifications, Audit */}
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/gis" element={<GISPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/audit" element={<AuditPage />} />

            {/* M5 — Admin, Model Governance */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/models" element={<ModelGovernancePage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
