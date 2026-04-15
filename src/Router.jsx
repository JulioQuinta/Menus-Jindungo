import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load components to reduce initial bundle size (critical for slow 4G)
const LoginPage = lazy(() => import('./LoginPage'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const PublicMenu = lazy(() => import('./pages/PublicMenu'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Explorar = lazy(() => import('./pages/Explorar'));
const MotoboyDashboard = lazy(() => import('./pages/MotoboyDashboard'));

// Basic Loading Fallback
const PageLoader = () => (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
    </div>
);

const Router = () => {
    return (
        <Suspense fallback={<PageLoader />}>
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
                <Route path="/r/:slug" element={<PublicMenu />} />
                <Route path="/:slug" element={<PublicMenu />} />
                <Route path="/delivery/:orderId" element={<MotoboyDashboard />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default Router;
