import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
}

export function getPaymentTypeLabel(type) {
    const labels = {
        'pix': 'PIX',
        'ted': 'TED',
        'cash': 'Dinheiro',
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito',
        'installment': 'Parcelado',
        'boleto': 'Boleto'
    };
    return labels[type] || type;
}

export function getExpenseTypeLabel(type) {
    const labels = {
        'fixed': 'Fixa',
        'variable': 'Variável'
    };
    return labels[type] || type;
}
