import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Tag,
    Users,
    Trash2,
    Plus,
    Loader2
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { getCategories, createCategory, deleteCategory, getContacts, createContact, deleteContact } from '../services/api';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const ConfiguracoesPage = () => {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '', type: 'revenue' });
    const [newContact, setNewContact] = useState({ name: '', type: 'client' });
    const [savingCategory, setSavingCategory] = useState(false);
    const [savingContact, setSavingContact] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [categoriesRes, contactsRes] = await Promise.all([
                getCategories(),
                getContacts()
            ]);
            setCategories(categoriesRes.data);
            setContacts(contactsRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) return;
        
        setSavingCategory(true);
        try {
            await createCategory(newCategory);
            toast.success('Categoria criada');
            setNewCategory({ name: '', type: newCategory.type });
            fetchData();
        } catch (error) {
            toast.error('Erro ao criar categoria');
        } finally {
            setSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Deseja excluir esta categoria?')) return;
        try {
            await deleteCategory(id);
            toast.success('Categoria excluída');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir categoria');
        }
    };

    const handleCreateContact = async (e) => {
        e.preventDefault();
        if (!newContact.name.trim()) return;
        
        setSavingContact(true);
        try {
            await createContact(newContact);
            toast.success('Contato criado');
            setNewContact({ name: '', type: newContact.type });
            fetchData();
        } catch (error) {
            toast.error('Erro ao criar contato');
        } finally {
            setSavingContact(false);
        }
    };

    const handleDeleteContact = async (id) => {
        if (!window.confirm('Deseja excluir este contato?')) return;
        try {
            await deleteContact(id);
            toast.success('Contato excluído');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir contato');
        }
    };

    const revenueCategories = categories.filter(c => c.type === 'revenue');
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const clients = contacts.filter(c => c.type === 'client');
    const suppliers = contacts.filter(c => c.type === 'supplier');

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
            <div className="space-y-6" data-testid="configuracoes-page">
                {/* Header */}
                <div>
                    <h1 className="font-heading text-3xl font-bold text-white">Configurações</h1>
                    <p className="text-slate-400">Gerencie categorias e contatos</p>
                </div>

                <Tabs defaultValue="categories" className="space-y-6">
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Tag className="w-4 h-4 mr-2" />
                            Categorias
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Users className="w-4 h-4 mr-2" />
                            Contatos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="categories">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue Categories */}
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="text-white font-heading flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-success" />
                                        Categorias de Receita
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <form onSubmit={handleCreateCategory} className="flex gap-2">
                                        <Input
                                            placeholder="Nova categoria..."
                                            value={newCategory.type === 'revenue' ? newCategory.name : ''}
                                            onChange={(e) => setNewCategory({ name: e.target.value, type: 'revenue' })}
                                            data-testid="new-revenue-category-input"
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                        <Button 
                                            type="submit" 
                                            disabled={savingCategory || newCategory.type !== 'revenue'}
                                            className="bg-success hover:bg-success/90 text-white"
                                        >
                                            {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        </Button>
                                    </form>
                                    <ScrollArea className="h-64">
                                        <div className="space-y-2">
                                            {revenueCategories.map((cat) => (
                                                <div 
                                                    key={cat.id} 
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="text-white">{cat.name}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="text-slate-400 hover:text-danger hover:bg-danger/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {revenueCategories.length === 0 && (
                                                <p className="text-center text-slate-500 py-8">Nenhuma categoria</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Expense Categories */}
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="text-white font-heading flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-danger" />
                                        Categorias de Despesa
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <form onSubmit={handleCreateCategory} className="flex gap-2">
                                        <Input
                                            placeholder="Nova categoria..."
                                            value={newCategory.type === 'expense' ? newCategory.name : ''}
                                            onChange={(e) => setNewCategory({ name: e.target.value, type: 'expense' })}
                                            data-testid="new-expense-category-input"
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                        <Button 
                                            type="submit" 
                                            disabled={savingCategory || newCategory.type !== 'expense'}
                                            className="bg-danger hover:bg-danger/90 text-white"
                                        >
                                            {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        </Button>
                                    </form>
                                    <ScrollArea className="h-64">
                                        <div className="space-y-2">
                                            {expenseCategories.map((cat) => (
                                                <div 
                                                    key={cat.id} 
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="text-white">{cat.name}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="text-slate-400 hover:text-danger hover:bg-danger/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {expenseCategories.length === 0 && (
                                                <p className="text-center text-slate-500 py-8">Nenhuma categoria</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="contacts">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Clients */}
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="text-white font-heading flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-success" />
                                        Clientes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <form onSubmit={handleCreateContact} className="flex gap-2">
                                        <Input
                                            placeholder="Novo cliente..."
                                            value={newContact.type === 'client' ? newContact.name : ''}
                                            onChange={(e) => setNewContact({ name: e.target.value, type: 'client' })}
                                            data-testid="new-client-input"
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                        <Button 
                                            type="submit" 
                                            disabled={savingContact || newContact.type !== 'client'}
                                            className="bg-success hover:bg-success/90 text-white"
                                        >
                                            {savingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        </Button>
                                    </form>
                                    <ScrollArea className="h-64">
                                        <div className="space-y-2">
                                            {clients.map((contact) => (
                                                <div 
                                                    key={contact.id} 
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="text-white">{contact.name}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteContact(contact.id)}
                                                        className="text-slate-400 hover:text-danger hover:bg-danger/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {clients.length === 0 && (
                                                <p className="text-center text-slate-500 py-8">Nenhum cliente</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Suppliers */}
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="text-white font-heading flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-warning" />
                                        Fornecedores
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <form onSubmit={handleCreateContact} className="flex gap-2">
                                        <Input
                                            placeholder="Novo fornecedor..."
                                            value={newContact.type === 'supplier' ? newContact.name : ''}
                                            onChange={(e) => setNewContact({ name: e.target.value, type: 'supplier' })}
                                            data-testid="new-supplier-input"
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                        <Button 
                                            type="submit" 
                                            disabled={savingContact || newContact.type !== 'supplier'}
                                            className="bg-warning hover:bg-warning/90 text-black"
                                        >
                                            {savingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        </Button>
                                    </form>
                                    <ScrollArea className="h-64">
                                        <div className="space-y-2">
                                            {suppliers.map((contact) => (
                                                <div 
                                                    key={contact.id} 
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="text-white">{contact.name}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteContact(contact.id)}
                                                        className="text-slate-400 hover:text-danger hover:bg-danger/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {suppliers.length === 0 && (
                                                <p className="text-center text-slate-500 py-8">Nenhum fornecedor</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default ConfiguracoesPage;
