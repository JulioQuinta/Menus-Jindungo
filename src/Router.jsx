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
const QuemSomos = lazy(() => import('./pages/QuemSomos'));

// Enhanced Loading Fallback (Better UX for slow networks)
const PageLoader = () => (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
        <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-[#D4AF37]/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-[#D4AF37]/40 rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
            <div className="absolute inset-4 bg-[#D4AF37] rounded-full animate-pulse flex items-center justify-center">
                <span className="text-black font-serif font-black text-xl">J</span>
            </div>
        </div>
        <p className="text-[#D4AF37] font-serif font-bold text-sm tracking-[0.2em] uppercase animate-pulse">A Preparar a Cozinha...</p>
    </div>
);

const Router = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/explorar" element={<Explorar />} />
                <Route path="/quem-somos" element={<QuemSomos />} />
                <Route path="/sobre" element={<QuemSomos />} />
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
