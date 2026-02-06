import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Activity,
    Sparkles,
    Loader2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { getDashboardSummary, getCashflow, getDRE, getActivities, getAIAnalysis } from '../services/api';
import { formatCurrency, formatDateTime, cn } from '../lib/utils';
import { toast } from 'sonner';

const CHART_COLORS = ['#27f48b', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary', delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
    >
        <Card className="glass glass-hover">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">{title}</p>
                        <h3 className="font-heading text-2xl font-bold text-white">{value}</h3>
                        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                    </div>
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        color === 'success' && "bg-success/20",
                        color === 'danger' && "bg-danger/20",
                        color === 'warning' && "bg-warning/20",
                        color === 'primary' && "bg-primary/20"
                    )}>
                        <Icon className={cn(
                            "w-6 h-6",
                            color === 'success' && "text-success",
                            color === 'danger' && "text-danger",
                            color === 'warning' && "text-warning",
                            color === 'primary' && "text-primary"
                        )} />
                    </div>
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 mt-3 text-sm",
                        trend === 'up' ? "text-success" : "text-danger"
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    </motion.div>
);

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [cashflow, setCashflow] = useState([]);
    const [dre, setDre] = useState(null);
    const [activities, setActivities] = useState([]);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [summaryRes, cashflowRes, dreRes, activitiesRes] = await Promise.all([
                getDashboardSummary(),
                getCashflow(),
                getDRE(),
                getActivities()
            ]);
            setSummary(summaryRes.data);
            setCashflow(cashflowRes.data);
            setDre(dreRes.data);
            setActivities(activitiesRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados do dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleAIAnalysis = async (type) => {
        setAiLoading(true);
        try {
            const response = await getAIAnalysis(type);
            setAiAnalysis(response.data);
        } catch (error) {
            toast.error('Erro ao gerar análise. Verifique a configuração da API.');
        } finally {
            setAiLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-paper border border-white/10 rounded-lg p-3 shadow-xl">
                    <p className="text-sm text-slate-400 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    const dreData = dre ? [
        { name: 'Receita', value: dre.total_revenue, color: '#10B981' },
        { name: 'Desp. Fixas', value: dre.fixed_expenses, color: '#EF4444' },
        { name: 'Desp. Variáveis', value: dre.variable_expenses, color: '#F59E0B' },
    ] : [];

    return (
        <Layout>
            <div className="space-y-6" data-testid="dashboard-page">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-bold text-white">Dashboard</h1>
                        <p className="text-slate-400">Visão geral do fluxo de caixa</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAIAnalysis('recommendation')}
                            disabled={aiLoading}
                            data-testid="ai-analysis-btn"
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Análise IA
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Saldo Atual"
                        value={formatCurrency(summary?.cash_balance || 0)}
                        icon={Wallet}
                        color="primary"
                        delay={0}
                    />
                    <StatCard
                        title="A Receber"
                        value={formatCurrency(summary?.pending_revenue || 0)}
                        subtitle={`${summary?.overdue_revenue_count || 0} atrasadas`}
                        icon={TrendingUp}
                        color="success"
                        delay={0.1}
                    />
                    <StatCard
                        title="A Pagar"
                        value={formatCurrency(summary?.pending_expense || 0)}
                        subtitle={`${summary?.overdue_expense_count || 0} atrasadas`}
                        icon={TrendingDown}
                        color="danger"
                        delay={0.2}
                    />
                    <StatCard
                        title="Atrasados"
                        value={formatCurrency((summary?.overdue_revenue_amount || 0) + (summary?.overdue_expense_amount || 0))}
                        icon={AlertTriangle}
                        color="warning"
                        delay={0.3}
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cash Flow Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className="lg:col-span-2"
                    >
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="text-white font-heading">Fluxo de Caixa</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={cashflow}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                                            <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue_paid"
                                                name="Receitas"
                                                stroke="#10B981"
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="expense_paid"
                                                name="Despesas"
                                                stroke="#EF4444"
                                                fillOpacity={1}
                                                fill="url(#colorExpense)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* DRE Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    >
                        <Card className="glass h-full">
                            <CardHeader>
                                <CardTitle className="text-white font-heading">DRE Mensal</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-48 mb-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={dreData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                dataKey="value"
                                            >
                                                {dreData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Lucro Bruto</span>
                                        <span className="text-sm font-medium text-success">{formatCurrency(dre?.gross_profit || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Lucro Líquido</span>
                                        <span className={cn("text-sm font-medium", (dre?.net_profit || 0) >= 0 ? "text-success" : "text-danger")}>
                                            {formatCurrency(dre?.net_profit || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Margem</span>
                                        <span className="text-sm font-medium text-primary">{(dre?.net_margin || 0).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Overdue Items */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                    >
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="text-white font-heading flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-warning" />
                                    Itens Atrasados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    <div className="space-y-3">
                                        {summary?.overdue_revenues?.map((item, i) => (
                                            <div key={`rev-${i}`} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.contact_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-success">{formatCurrency(item.total_amount)}</p>
                                                    <p className="text-xs text-slate-500">Receita</p>
                                                </div>
                                            </div>
                                        ))}
                                        {summary?.overdue_expenses?.map((item, i) => (
                                            <div key={`exp-${i}`} className="flex items-center justify-between p-3 rounded-lg bg-danger/5 border border-danger/20">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.contact_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-danger">{formatCurrency(item.total_amount)}</p>
                                                    <p className="text-xs text-slate-500">Despesa</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!summary?.overdue_revenues?.length && !summary?.overdue_expenses?.length) && (
                                            <p className="text-center text-slate-500 py-8">Nenhum item atrasado</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Activity Log */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.7 }}
                    >
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="text-white font-heading flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    Atividades Recentes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    <div className="space-y-3">
                                        {activities.map((activity, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white">
                                                        <span className="font-medium">{activity.user_name}</span>
                                                        {' '}{activity.action === 'create' ? 'criou' : activity.action === 'update' ? 'atualizou' : 'deletou'}{' '}
                                                        <span className="text-primary">{activity.entity_name || activity.entity_type}</span>
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {formatDateTime(activity.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {activities.length === 0 && (
                                            <p className="text-center text-slate-500 py-8">Nenhuma atividade recente</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* AI Analysis Modal */}
                {aiAnalysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="glass border-primary/30">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-white font-heading flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Análise de IA
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setAiAnalysis(null)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Fechar
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-slate-300 whitespace-pre-line">{aiAnalysis.content}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </Layout>
    );
};

export default DashboardPage;
