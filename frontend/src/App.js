import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReceitasPage from './pages/ReceitasPage';
import DespesasPage from './pages/DespesasPage';
import RelatoriosPage from './pages/RelatoriosPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={
                <PublicRoute>
                    <LoginPage />
                </PublicRoute>
            } />
            <Route path="/" element={
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            } />
            <Route path="/receitas" element={
                <ProtectedRoute>
                    <ReceitasPage />
                </ProtectedRoute>
            } />
            <Route path="/despesas" element={
                <ProtectedRoute>
                    <DespesasPage />
                </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
                <ProtectedRoute>
                    <RelatoriosPage />
                </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
                <ProtectedRoute>
                    <ConfiguracoesPage />
                </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#151621',
                            color: '#F8FAFC',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
