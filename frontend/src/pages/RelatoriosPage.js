import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    TrendingUp,
    TrendingDown,
    PieChart as PieIcon,
    BarChart3,
    Sparkles,
    Loader2,
    Download
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
    Cell,
    Legend
} from 'recharts';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { getReportByCategory, getReportByContact, getMonthlyReport, getAIAnalysis, getDRE } from '../services/api';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';

const CHART_COLORS = ['#6366F1', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const RelatoriosPage = () => {
    const [loading, setLoading] = useState(true);
    const [revenueByCategory, setRevenueByCategory] = useState([]);
    const [expenseByCategory, setExpenseByCategory] = useState([]);
    const [revenueByContact, setRevenueByContact] = useState([]);
    const [expenseByContact, setExpenseByContact] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [dre, setDre] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState('projection');

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [revCat, expCat, revContact, expContact, monthly, dreData] = await Promise.all([
                getReportByCategory('revenue'),
                getReportByCategory('expense'),
                getReportByContact('revenue'),
                getReportByContact('expense'),
                getMonthlyReport(parseInt(selectedYear)),
                getDRE()
            ]);
            setRevenueByCategory(revCat.data);
            setExpenseByCategory(expCat.data);
            setRevenueByContact(revContact.data);
            setExpenseByContact(expContact.data);
            setMonthlyData(monthly.data);
            setDre(dreData.data);
        } catch (error) {
            toast.error('Erro ao carregar relatórios');
        } finally {
            setLoading(false);
        }
    };

    const handleAIAnalysis = async (type) => {
        setAiLoading(true);
        setSelectedAnalysis(type);
        try {
            const response = await getAIAnalysis(type);
            setAiAnalysis(response.data);
        } catch (error) {
            toast.error('Erro ao gerar análise de IA');
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

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6" data-testid="relatorios-page">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-bold text-white">Relatórios</h1>
                        <p className="text-slate-400">Análises e projeções financeiras</p>
                    </div>
                    <div className="flex gap-2">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-32 bg-black/20 border-white/10 text-white" data-testid="year-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-paper border-white/10">
                                {years.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* DRE Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-white font-heading flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                DRE - Demonstrativo de Resultado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Receitas</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Total</span>
                                            <span className="text-success font-medium">{formatCurrency(dre?.total_revenue || 0)}</span>
                                        </div>
                                        {Object.entries(dre?.revenue_by_category || {}).map(([key, value]) => (
                                            <div key={key} className="flex justify-between text-sm">
                                                <span className="text-slate-500">{key}</span>
                                                <span className="text-slate-400">{formatCurrency(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Despesas</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Fixas</span>
                                            <span className="text-danger font-medium">{formatCurrency(dre?.fixed_expenses || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Variáveis</span>
                                            <span className="text-warning font-medium">{formatCurrency(dre?.variable_expenses || 0)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-white/10 pt-2">
                                            <span className="text-slate-300">Total</span>
                                            <span className="text-danger font-medium">{formatCurrency(dre?.total_expenses || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Resultado</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Lucro Bruto</span>
                                            <span className={cn("font-medium", (dre?.gross_profit || 0) >= 0 ? "text-success" : "text-danger")}>
                                                {formatCurrency(dre?.gross_profit || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Lucro Líquido</span>
                                            <span className={cn("font-medium", (dre?.net_profit || 0) >= 0 ? "text-success" : "text-danger")}>
                                                {formatCurrency(dre?.net_profit || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Margens</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Margem Bruta</span>
                                            <span className="text-primary font-medium">{(dre?.gross_margin || 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Margem Líquida</span>
                                            <span className="text-primary font-medium">{(dre?.net_margin || 0).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Charts Tabs */}
                <Tabs defaultValue="monthly" className="space-y-6">
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            Evolução Mensal
                        </TabsTrigger>
                        <TabsTrigger value="category" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            Por Categoria
                        </TabsTrigger>
                        <TabsTrigger value="contact" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            Por Cliente/Fornecedor
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            Análise IA
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="monthly">
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="text-white font-heading">Evolução Mensal {selectedYear}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                                            <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="revenue_total" name="Receita Prevista" fill="#10B981" opacity={0.5} />
                                            <Bar dataKey="revenue_paid" name="Receita Recebida" fill="#10B981" />
                                            <Bar dataKey="expense_total" name="Despesa Prevista" fill="#EF4444" opacity={0.5} />
                                            <Bar dataKey="expense_paid" name="Despesa Paga" fill="#EF4444" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="category">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="text-white font-heading flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-success" />
                                        Receitas por Categoria
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={revenueByCategory}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    dataKey="total"
                                                    nameKey="name"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {revenueByCategory.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="text-white font-heading flex items-center gap-2">
                                        <TrendingDown className="w-5 h-5 text-danger" />
                                        Despesas por Categoria
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={expenseByCategory}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    dataKey="total"
                                                    nameKey="name"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {expenseByCategory.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="contact">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="text-white font-heading">Top Clientes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={revenueByContact.slice(0, 10)} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis type="number" stroke="#64748B" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={100} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="total" name="Total" fill="#10B981" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="text-white font-heading">Top Fornecedores</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={expenseByContact.slice(0, 10)} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis type="number" stroke="#64748B" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={100} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="total" name="Total" fill="#EF4444" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="ai">
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="text-white font-heading flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Análise com Inteligência Artificial
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={() => handleAIAnalysis('projection')}
                                            disabled={aiLoading}
                                            data-testid="ai-projection-btn"
                                            className={cn(
                                                "transition-all",
                                                selectedAnalysis === 'projection' ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                                            )}
                                        >
                                            Projeções
                                        </Button>
                                        <Button
                                            onClick={() => handleAIAnalysis('trend')}
                                            disabled={aiLoading}
                                            data-testid="ai-trend-btn"
                                            className={cn(
                                                "transition-all",
                                                selectedAnalysis === 'trend' ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                                            )}
                                        >
                                            Tendências
                                        </Button>
                                        <Button
                                            onClick={() => handleAIAnalysis('recommendation')}
                                            disabled={aiLoading}
                                            data-testid="ai-recommendation-btn"
                                            className={cn(
                                                "transition-all",
                                                selectedAnalysis === 'recommendation' ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                                            )}
                                        >
                                            Recomendações
                                        </Button>
                                    </div>

                                    {aiLoading && (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                            <span className="ml-3 text-slate-400">Gerando análise...</span>
                                        </div>
                                    )}

                                    {aiAnalysis && !aiLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white/5 rounded-xl p-6 border border-white/10"
                                        >
                                            <div className="prose prose-invert max-w-none">
                                                <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                                                    {aiAnalysis.content}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-4">
                                                Gerado em: {new Date(aiAnalysis.generated_at).toLocaleString('pt-BR')}
                                            </p>
                                        </motion.div>
                                    )}

                                    {!aiAnalysis && !aiLoading && (
                                        <div className="text-center py-12 text-slate-500">
                                            Selecione um tipo de análise para gerar insights com IA
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default RelatoriosPage;
