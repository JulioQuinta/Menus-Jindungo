import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import App from './App'; // Removed unused import
// import Constants from "./utils/Constants"; // Removed: File does not exist
import LoginPage from './LoginPage';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import PublicMenu from './pages/PublicMenu';
import UpdatePassword from './pages/UpdatePassword';
import ForgotPassword from './pages/ForgotPassword';
import Explorar from './pages/Explorar';

const Router = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />

            {/* Protected Routes */}
            <Route
                path="/admin/*"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'owner', 'super_admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/super-admin/*"
                element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <SuperAdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Public Menu (Catch-all for slugs) */}
            <Route path="/:slug" element={<PublicMenu />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default Router;
