import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Edit, Loader2, Check } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Switch } from '../components/ui/switch';
import { CreatableSelect } from '../components/ui/creatable-select';
import { getRevenues, createRevenue, updateRevenue, deleteRevenue, getCategories, createCategory, getContacts, createContact } from '../services/api';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAYMENT_TYPES = [
    { value: 'pix', label: 'PIX' },
    { value: 'ted', label: 'TED' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'installment', label: 'Parcelado' },
];

const initialFormData = {
    name: '',
    description: '',
    contact_id: '',
    contact_name: '',
    category_id: '',
    category_name: '',
    total_amount: '',
    payment_type: 'pix',
    installments: 1,
    payment_method: '',
    due_date: '',
    paid: false,
    paid_date: '',
    paid_amount: 0
};

const ReceitasPage = () => {
    const [loading, setLoading] = useState(true);
    const [revenues, setRevenues] = useState([]);
    const [categories, setCategories] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPaid, setFilterPaid] = useState('all');
    const [saving, setSaving] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [revenuesRes, categoriesRes, contactsRes] = await Promise.all([
                getRevenues(),
                getCategories('revenue'),
                getContacts('client')
            ]);
            setRevenues(revenuesRes.data);
            setCategories(categoriesRes.data);
            setContacts(contactsRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const filteredRevenues = useMemo(() => {
        return revenues.filter(rev => {
            const matchesSearch = rev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rev.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPaid = filterPaid === 'all' || 
                (filterPaid === 'paid' && rev.paid) || 
                (filterPaid === 'pending' && !rev.paid);
            return matchesSearch && matchesPaid;
        });
    }, [revenues, searchTerm, filterPaid]);

    const handleOpenDialog = (revenue = null) => {
        if (revenue) {
            setEditingId(revenue.id);
            setFormData({
                ...revenue,
                total_amount: revenue.total_amount.toString()
            });
        } else {
            setEditingId(null);
            setFormData(initialFormData);
        }
        setDialogOpen(true);
    };

    const handleCreateCategory = async (name) => {
        try {
            const res = await createCategory({ name, type: 'revenue' });
            setCategories([...categories, res.data]);
            toast.success('Categoria criada');
            return res.data;
        } catch (error) {
            toast.error('Erro ao criar categoria');
            return null;
        }
    };

    const handleCreateContact = async (name) => {
        try {
            const res = await createContact({ name, type: 'client' });
            setContacts([...contacts, res.data]);
            toast.success('Cliente criado');
            return res.data;
        } catch (error) {
            toast.error('Erro ao criar cliente');
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = {
                ...formData,
                total_amount: parseFloat(formData.total_amount),
                paid_amount: formData.paid ? parseFloat(formData.total_amount) : 0
            };

            if (editingId) {
                await updateRevenue(editingId, data);
                toast.success('Receita atualizada');
            } else {
                await createRevenue(data);
                toast.success('Receita criada');
            }
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Erro ao salvar receita');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente excluir esta receita?')) return;
        try {
            await deleteRevenue(id);
            toast.success('Receita excluída');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir receita');
        }
    };

    const handleTogglePaid = async (revenue) => {
        try {
            const newPaidStatus = !revenue.paid;
            const data = {
                ...revenue,
                paid: newPaidStatus,
                paid_amount: newPaidStatus ? revenue.total_amount : 0,
                paid_date: newPaidStatus ? new Date().toISOString() : ''
            };
            await updateRevenue(revenue.id, data);
            toast.success(newPaidStatus ? 'Receita marcada como recebida' : 'Receita marcada como pendente');
            fetchData();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const totalExpected = filteredRevenues.reduce((acc, r) => acc + r.total_amount, 0);
    const totalPaid = filteredRevenues.filter(r => r.paid).reduce((acc, r) => acc + r.paid_amount, 0);

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
            <div className="space-y-6" data-testid="receitas-page">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-bold text-white">Receitas</h1>
                        <p className="text-slate-400">Gerencie suas entradas financeiras</p>
                    </div>
                    <Button
                        onClick={() => handleOpenDialog()}
                        data-testid="add-revenue-btn"
                        className="bg-success hover:bg-success/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Receita
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="glass">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-400">Total Previsto</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(totalExpected)}</p>
                        </CardContent>
                    </Card>
                    <Card className="glass">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-400">Total Recebido</p>
                            <p className="text-xl font-bold text-success">{formatCurrency(totalPaid)}</p>
                        </CardContent>
                    </Card>
                    <Card className="glass">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-400">A Receber</p>
                            <p className="text-xl font-bold text-warning">{formatCurrency(totalExpected - totalPaid)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="glass">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    placeholder="Buscar receitas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    data-testid="search-revenue-input"
                                    className="pl-10 bg-black/20 border-white/10 text-white"
                                />
                            </div>
                            <Select value={filterPaid} onValueChange={setFilterPaid}>
                                <SelectTrigger className="w-full md:w-48 bg-black/20 border-white/10 text-white" data-testid="filter-status-select">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-paper border-white/10">
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="paid">Recebidos</SelectItem>
                                    <SelectItem value="pending">Pendentes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="glass">
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-slate-400">Nome</TableHead>
                                        <TableHead className="text-slate-400">Cliente</TableHead>
                                        <TableHead className="text-slate-400">Categoria</TableHead>
                                        <TableHead className="text-slate-400">Vencimento</TableHead>
                                        <TableHead className="text-slate-400">Valor</TableHead>
                                        <TableHead className="text-slate-400">Status</TableHead>
                                        <TableHead className="text-slate-400 text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRevenues.map((revenue) => (
                                        <TableRow 
                                            key={revenue.id} 
                                            className="border-white/5 hover:bg-white/5"
                                            data-testid={`revenue-row-${revenue.id}`}
                                        >
                                            <TableCell className="font-medium text-white">{revenue.name}</TableCell>
                                            <TableCell className="text-slate-300">{revenue.contact_name}</TableCell>
                                            <TableCell className="text-slate-300">{revenue.category_name}</TableCell>
                                            <TableCell className="text-slate-300">{formatDate(revenue.due_date)}</TableCell>
                                            <TableCell className="text-success font-medium">{formatCurrency(revenue.total_amount)}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "text-xs",
                                                    revenue.paid 
                                                        ? "bg-success/20 text-success border-success/30" 
                                                        : "bg-warning/20 text-warning border-warning/30"
                                                )}>
                                                    {revenue.paid ? 'Recebido' : 'Pendente'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(revenue)}
                                                        className="text-slate-400 hover:text-white hover:bg-white/10"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(revenue.id)}
                                                        className="text-slate-400 hover:text-danger hover:bg-danger/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredRevenues.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                                                Nenhuma receita encontrada
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="bg-paper border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="font-heading text-xl">
                                {editingId ? 'Editar Receita' : 'Nova Receita'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Nome *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        data-testid="revenue-name-input"
                                        className="bg-black/20 border-white/10 text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Valor *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.total_amount}
                                        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                        data-testid="revenue-amount-input"
                                        className="bg-black/20 border-white/10 text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Descrição</Label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    data-testid="revenue-description-input"
                                    className="bg-black/20 border-white/10 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Cliente *</Label>
                                    <CreatableSelect
                                        options={contacts}
                                        value={formData.contact_id}
                                        onChange={(opt) => setFormData({ ...formData, contact_id: opt.id, contact_name: opt.name })}
                                        onCreateNew={handleCreateContact}
                                        placeholder="Selecione ou digite para criar..."
                                        createMessage="Criar cliente"
                                        data-testid="revenue-contact-select"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Categoria *</Label>
                                    <CreatableSelect
                                        options={categories}
                                        value={formData.category_id}
                                        onChange={(opt) => setFormData({ ...formData, category_id: opt.id, category_name: opt.name })}
                                        onCreateNew={handleCreateCategory}
                                        placeholder="Selecione ou digite para criar..."
                                        createMessage="Criar categoria"
                                        data-testid="revenue-category-select"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Tipo de Pagamento</Label>
                                    <Select value={formData.payment_type} onValueChange={(val) => setFormData({ ...formData, payment_type: val })}>
                                        <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="revenue-payment-type-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-paper border-white/10">
                                            {PAYMENT_TYPES.map(pt => (
                                                <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.payment_type === 'installment' && (
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Parcelas</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={formData.installments}
                                            onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Vencimento *</Label>
                                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-black/20 border-white/10 text-white hover:bg-white/10"
                                                data-testid="revenue-date-picker"
                                            >
                                                {formData.due_date ? format(new Date(formData.due_date), 'dd/MM/yyyy') : 'Selecionar data'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-paper border-white/10" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.due_date ? new Date(formData.due_date) : undefined}
                                                onSelect={(date) => {
                                                    setFormData({ ...formData, due_date: date ? date.toISOString() : '' });
                                                    setDatePickerOpen(false);
                                                }}
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="paid"
                                    checked={formData.paid}
                                    onCheckedChange={(checked) => setFormData({ ...formData, paid: checked })}
                                    data-testid="revenue-paid-checkbox"
                                />
                                <Label htmlFor="paid" className="text-slate-300 cursor-pointer">Marcar como recebido</Label>
                            </div>

                            <DialogFooter className="gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={saving} className="bg-success hover:bg-success/90 text-white" data-testid="revenue-save-btn">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
};

export default ReceitasPage;
