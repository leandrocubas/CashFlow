import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const navigate = useNavigate();
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                toast.success('Login realizado com sucesso!');
            } else {
                await register(formData.name, formData.email, formData.password);
                toast.success('Conta criada com sucesso!');
            }
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0C15] flex">
            {/* Left side - Image */}
            <div 
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1603093843430-809589529410?crop=entropy&cs=srgb&fm=jpg&q=85)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-black/70" />
                <div className="relative z-10 flex flex-col justify-end p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h2 className="font-heading text-4xl font-bold text-white mb-4">
                            Controle total do seu fluxo de caixa
                        </h2>
                        <p className="text-slate-300 text-lg max-w-md">
                            Gerencie receitas, despesas e tenha uma visão completa da saúde financeira da sua empresa.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-primary">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-2xl text-white">FluxoControl</h1>
                            <p className="text-sm text-slate-500">Gestão Financeira Inteligente</p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="glass rounded-2xl p-8">
                        <div className="mb-8">
                            <h2 className="font-heading text-2xl font-bold text-white mb-2">
                                {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
                            </h2>
                            <p className="text-slate-400">
                                {isLogin 
                                    ? 'Entre com suas credenciais para continuar' 
                                    : 'Preencha os dados para criar sua conta'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-300">Nome</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Seu nome"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            data-testid="register-name-input"
                                            className="pl-10 bg-black/20 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-600"
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        data-testid="login-email-input"
                                        className="pl-10 bg-black/20 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        data-testid="login-password-input"
                                        className="pl-10 bg-black/20 border-white/10 focus:border-primary/50 text-white placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                data-testid="login-submit-btn"
                                className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'Entrar' : 'Criar conta'}
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                data-testid="toggle-auth-mode-btn"
                                className="text-slate-400 hover:text-primary transition-colors"
                            >
                                {isLogin 
                                    ? 'Não tem conta? Criar agora' 
                                    : 'Já tem conta? Fazer login'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
