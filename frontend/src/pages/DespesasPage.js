import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Edit, Loader2 } from 'lucide-react';
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
import { CreatableSelect } from '../components/ui/creatable-select';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories, createCategory, getContacts, createContact } from '../services/api';
import { formatCurrency, formatDate, getExpenseTypeLabel, cn } from '../lib/utils';
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

const EXPENSE_TYPES = [
    { value: 'fixed', label: 'Fixa' },
    { value: 'variable', label: 'Variável' },
];

const initialFormData = {
    name: '',
    description: '',
    contact_id: '',
    contact_name: '',
    category_id: '',
    category_name: '',
    total_amount: '',
    expense_type: 'variable',
    payment_type: 'pix',
    installments: 1,
    due_date: '',
    paid: false,
    paid_date: '',
    paid_amount: 0,
    partial_payment: false
};

const DespesasPage = () => {
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPaid, setFilterPaid] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [saving, setSaving] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [expensesRes, categoriesRes, contactsRes] = await Promise.all([
                getExpenses(),
                getCategories('expense'),
                getContacts('supplier')
            ]);
            setExpenses(expensesRes.data);
            setCategories(categoriesRes.data);
            setContacts(contactsRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const matchesSearch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPaid = filterPaid === 'all' || 
                (filterPaid === 'paid' && exp.paid) || 
                (filterPaid === 'pending' && !exp.paid);
            const matchesType = filterType === 'all' || exp.expense_type === filterType;
            return matchesSearch && matchesPaid && matchesType;
        });
    }, [expenses, searchTerm, filterPaid, filterType]);

    const handleOpenDialog = (expense = null) => {
        if (expense) {
            setEditingId(expense.id);
            setFormData({
                ...expense,
                total_amount: expense.total_amount.toString()
            });
        } else {
            setEditingId(null);
            setFormData(initialFormData);
        }
        setDialogOpen(true);
    };

    const handleCreateCategory = async (name) => {
        try {
            const res = await createCategory({ name, type: 'expense' });
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
            const res = await createContact({ name, type: 'supplier' });
            setContacts([...contacts, res.data]);
            toast.success('Fornecedor criado');
            return res.data;
        } catch (error) {
            toast.error('Erro ao criar fornecedor');
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const paidAmount = formData.paid 
                ? (formData.partial_payment ? parseFloat(formData.paid_amount) : parseFloat(formData.total_amount))
                : 0;
            
            const data = {
                ...formData,
                total_amount: parseFloat(formData.total_amount),
                paid_amount: paidAmount
            };

            if (editingId) {
                await updateExpense(editingId, data);
                toast.success('Despesa atualizada');
            } else {
                await createExpense(data);
                toast.success('Despesa criada');
            }
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Erro ao salvar despesa');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente excluir esta despesa?')) return;
        try {
            await deleteExpense(id);
            toast.success('Despesa excluída');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir despesa');
        }
    };

    const totalExpected = filteredExpenses.reduce((acc, e) => acc + e.total_amount, 0);
    const totalPaid = filteredExpenses.filter(e => e.paid).reduce((acc, e) => acc + e.paid_amount, 0);
    const fixedTotal = filteredExpenses.filter(e => e.expense_type === 'fixed').reduce((acc, e) => acc + e.total_amount, 0);
    const variableTotal = filteredExpenses.filter(e => e.expense_type === 'variable').reduce((acc, e) => acc + e.total_amount, 0);

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
            <div className="space-y-6" data-testid="despesas-page">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-bold text-white">Despesas</h1>
                        <p className="text-slate-400">Gerencie suas saídas financeiras</p>
                    </div>
                    <Button
                        onClick={() => handleOpenDialog()}
                        data-testid="add-expense-btn"
                        className="bg-danger hover:bg-danger/90 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Despesa
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="glass">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-400">Total Previsto</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(totalExpected)}</p>
                        </CardContent>
                    </Card>
                    <Card className="glass">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-400">Total Pago</p>
                            <p className="text-xl font-bold text-danger">{formatCurrency(totalPaid)}</p>
                        </CardContent>
                    </Card>
                    <Card className="glass">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-400">Despesas Fixas</p>
                            <p className="text-xl font-bold text-primary">{formatCurrency(fixedTotal)}</p>
                        </CardContent>
                    </Card>
                    <Card className="glass">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-400">Despesas Variáveis</p>
                            <p className="text-xl font-bold text-warning">{formatCurrency(variableTotal)}</p>
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
                                    placeholder="Buscar despesas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    data-testid="search-expense-input"
                                    className="pl-10 bg-black/20 border-white/10 text-white"
                                />
                            </div>
                            <Select value={filterPaid} onValueChange={setFilterPaid}>
                                <SelectTrigger className="w-full md:w-40 bg-black/20 border-white/10 text-white" data-testid="filter-paid-select">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-paper border-white/10">
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="paid">Pagos</SelectItem>
                                    <SelectItem value="pending">Pendentes</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-full md:w-40 bg-black/20 border-white/10 text-white" data-testid="filter-type-select">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent className="bg-paper border-white/10">
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="fixed">Fixas</SelectItem>
                                    <SelectItem value="variable">Variáveis</SelectItem>
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
                                        <TableHead className="text-slate-400">Fornecedor</TableHead>
                                        <TableHead className="text-slate-400">Categoria</TableHead>
                                        <TableHead className="text-slate-400">Tipo</TableHead>
                                        <TableHead className="text-slate-400">Vencimento</TableHead>
                                        <TableHead className="text-slate-400">Valor</TableHead>
                                        <TableHead className="text-slate-400">Status</TableHead>
                                        <TableHead className="text-slate-400 text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExpenses.map((expense) => (
                                        <TableRow 
                                            key={expense.id} 
                                            className="border-white/5 hover:bg-white/5"
                                            data-testid={`expense-row-${expense.id}`}
                                        >
                                            <TableCell className="font-medium text-white">{expense.name}</TableCell>
                                            <TableCell className="text-slate-300">{expense.contact_name}</TableCell>
                                            <TableCell className="text-slate-300">{expense.category_name}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "text-xs",
                                                    expense.expense_type === 'fixed' 
                                                        ? "bg-primary/20 text-primary border-primary/30" 
                                                        : "bg-warning/20 text-warning border-warning/30"
                                                )}>
                                                    {getExpenseTypeLabel(expense.expense_type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-300">{formatDate(expense.due_date)}</TableCell>
                                            <TableCell className="text-danger font-medium">{formatCurrency(expense.total_amount)}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "text-xs",
                                                    expense.paid 
                                                        ? "bg-success/20 text-success border-success/30" 
                                                        : "bg-warning/20 text-warning border-warning/30"
                                                )}>
                                                    {expense.paid ? 'Pago' : 'Pendente'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(expense)}
                                                        className="text-slate-400 hover:text-white hover:bg-white/10"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="text-slate-400 hover:text-danger hover:bg-danger/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredExpenses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-slate-500 py-12">
                                                Nenhuma despesa encontrada
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
                                {editingId ? 'Editar Despesa' : 'Nova Despesa'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Nome *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        data-testid="expense-name-input"
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
                                        data-testid="expense-amount-input"
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
                                    data-testid="expense-description-input"
                                    className="bg-black/20 border-white/10 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Fornecedor *</Label>
                                    <CreatableSelect
                                        options={contacts}
                                        value={formData.contact_id}
                                        onChange={(opt) => setFormData({ ...formData, contact_id: opt.id, contact_name: opt.name })}
                                        onCreateNew={handleCreateContact}
                                        placeholder="Selecione ou digite para criar..."
                                        createMessage="Criar fornecedor"
                                        data-testid="expense-contact-select"
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
                                        data-testid="expense-category-select"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Tipo de Despesa</Label>
                                    <Select value={formData.expense_type} onValueChange={(val) => setFormData({ ...formData, expense_type: val })}>
                                        <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="expense-type-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-paper border-white/10">
                                            {EXPENSE_TYPES.map(et => (
                                                <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Tipo de Pagamento</Label>
                                    <Select value={formData.payment_type} onValueChange={(val) => setFormData({ ...formData, payment_type: val })}>
                                        <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="expense-payment-type-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-paper border-white/10">
                                            {PAYMENT_TYPES.map(pt => (
                                                <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Vencimento *</Label>
                                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-black/20 border-white/10 text-white hover:bg-white/10"
                                                data-testid="expense-date-picker"
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

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="paid"
                                        checked={formData.paid}
                                        onCheckedChange={(checked) => setFormData({ ...formData, paid: checked, partial_payment: checked ? formData.partial_payment : false })}
                                        data-testid="expense-paid-checkbox"
                                    />
                                    <Label htmlFor="paid" className="text-slate-300 cursor-pointer">Marcar como pago</Label>
                                </div>

                                {formData.paid && (
                                    <div className="flex items-center space-x-2 ml-6">
                                        <Checkbox
                                            id="partial"
                                            checked={formData.partial_payment}
                                            onCheckedChange={(checked) => setFormData({ ...formData, partial_payment: checked })}
                                            data-testid="expense-partial-checkbox"
                                        />
                                        <Label htmlFor="partial" className="text-slate-300 cursor-pointer">Pagamento parcial</Label>
                                    </div>
                                )}

                                {formData.paid && formData.partial_payment && (
                                    <div className="ml-6 space-y-2">
                                        <Label className="text-slate-300">Valor pago</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.paid_amount}
                                            onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={saving} className="bg-danger hover:bg-danger/90 text-white" data-testid="expense-save-btn">
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

export default DespesasPage;
