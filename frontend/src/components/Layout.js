import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    TrendingUp, 
    TrendingDown, 
    FileText, 
    Settings,
    LogOut,
    Menu,
    X,
    Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/receitas', icon: TrendingUp, label: 'Receitas' },
    { path: '/despesas', icon: TrendingDown, label: 'Despesas' },
    { path: '/relatorios', icon: FileText, label: 'Relatórios' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
];

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: isOpen ? 0 : -280 }}
                className={cn(
                    "fixed top-0 left-0 h-full w-64 z-50",
                    "bg-white/5 backdrop-blur-xl border-r border-white/10",
                    "flex flex-col",
                    "lg:translate-x-0 lg:static"
                )}
            >
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link to="/" className="flex items-center gap-3" onClick={onClose}>
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-lg text-white">FluxoControl</h1>
                            <p className="text-xs text-slate-500">Gestão Financeira</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    isActive 
                                        ? "bg-primary/20 text-primary border border-primary/30" 
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className="w-5 h-5" strokeWidth={1.5} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        data-testid="logout-btn"
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" strokeWidth={1.5} />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0B0C15] noise-overlay">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            {/* Main content */}
            <div className="lg:ml-64">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 bg-[#0B0C15]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            data-testid="mobile-menu-btn"
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <Menu className="w-6 h-6 text-white" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-primary" />
                            <span className="font-heading font-bold text-white">FluxoControl</span>
                        </div>
                        <div className="w-10" />
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 md:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
