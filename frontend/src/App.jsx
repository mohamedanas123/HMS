import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute, RoleRoute } from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';


import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import MyAppointments from './pages/patient/MyAppointments';
import PatientProfile from './pages/patient/PatientProfile';

import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorProfile from './pages/doctor/DoctorProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageDoctors from './pages/admin/ManageDoctors';
import AllAppointments from './pages/admin/AllAppointments';
import AdminProfile from './pages/admin/AdminProfile';

import Notifications from './pages/shared/Notifications';

function RootRedirect() {
  const { user, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (hasRole('ROLE_ADMIN')) return <Navigate to="/admin/dashboard" replace />;
  if (hasRole('ROLE_DOCTOR')) return <Navigate to="/doctor/dashboard" replace />;
  return <Navigate to="/patient/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize: '0.875rem',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient */}
          <Route path="/patient/dashboard" element={
            <RoleRoute role="ROLE_PATIENT"><PatientDashboard /></RoleRoute>
          } />
          <Route path="/patient/book" element={
            <RoleRoute role="ROLE_PATIENT"><BookAppointment /></RoleRoute>
          } />
          <Route path="/patient/appointments" element={
            <RoleRoute role="ROLE_PATIENT"><MyAppointments /></RoleRoute>
          } />
          <Route path="/patient/notifications" element={
            <RoleRoute role="ROLE_PATIENT"><Notifications /></RoleRoute>
          } />
          <Route path="/patient/profile" element={
            <RoleRoute role="ROLE_PATIENT"><PatientProfile /></RoleRoute>
          } />

          {/* Doctor */}
          <Route path="/doctor/dashboard" element={
            <RoleRoute role="ROLE_DOCTOR"><DoctorDashboard /></RoleRoute>
          } />
          <Route path="/doctor/appointments" element={
            <RoleRoute role="ROLE_DOCTOR"><DoctorAppointments /></RoleRoute>
          } />
          <Route path="/doctor/notifications" element={
            <RoleRoute role="ROLE_DOCTOR"><Notifications /></RoleRoute>
          } />
          <Route path="/doctor/profile" element={
            <RoleRoute role="ROLE_DOCTOR"><DoctorProfile /></RoleRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <RoleRoute role="ROLE_ADMIN"><AdminDashboard /></RoleRoute>
          } />
          <Route path="/admin/departments" element={
            <RoleRoute role="ROLE_ADMIN"><ManageDepartments /></RoleRoute>
          } />
          <Route path="/admin/doctors" element={
            <RoleRoute role="ROLE_ADMIN"><ManageDoctors /></RoleRoute>
          } />
          <Route path="/admin/appointments" element={
            <RoleRoute role="ROLE_ADMIN"><AllAppointments /></RoleRoute>
          } />
          <Route path="/admin/notifications" element={
            <RoleRoute role="ROLE_ADMIN"><Notifications /></RoleRoute>
          } />
          <Route path="/admin/profile" element={
            <RoleRoute role="ROLE_ADMIN"><AdminProfile /></RoleRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
