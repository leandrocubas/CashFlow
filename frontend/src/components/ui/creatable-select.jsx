import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const CreatableSelect = ({ 
    options = [], 
    value, 
    onChange, 
    onCreateNew,
    placeholder = "Selecione ou digite para criar...",
    emptyMessage = "Nenhum resultado encontrado",
    createMessage = "Criar",
    disabled = false,
    "data-testid": testId
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const filteredOptions = options.filter(opt => 
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    const showCreateOption = search.trim() && 
        !options.some(opt => opt.name.toLowerCase() === search.toLowerCase().trim());

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange(option);
        setSearch('');
        setOpen(false);
    };

    const handleCreate = async () => {
        if (!search.trim() || creating) return;
        setCreating(true);
        try {
            const newOption = await onCreateNew(search.trim());
            if (newOption) {
                onChange(newOption);
                setSearch('');
                setOpen(false);
            }
        } finally {
            setCreating(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (showCreateOption) {
                handleCreate();
            } else if (filteredOptions.length === 1) {
                handleSelect(filteredOptions[0]);
            }
        }
        if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const selectedOption = options.find(opt => opt.id === value);

    return (
        <div ref={containerRef} className="relative w-full">
            <div
                className={cn(
                    "flex items-center w-full h-10 rounded-lg border bg-black/20 border-white/10 px-3 cursor-pointer transition-all",
                    open && "border-primary/50 ring-1 ring-primary/50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && setOpen(true)}
                data-testid={testId}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={open ? search : (selectedOption?.name || '')}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        if (!open) setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 bg-transparent text-white placeholder:text-slate-600 outline-none text-sm"
                />
                <ChevronsUpDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-paper border border-white/10 rounded-lg shadow-xl overflow-hidden animate-scale-in">
                    <div className="max-h-60 overflow-y-auto scrollbar-thin">
                        {filteredOptions.length === 0 && !showCreateOption && (
                            <div className="px-3 py-6 text-center text-sm text-slate-500">
                                {emptyMessage}
                            </div>
                        )}
                        
                        {filteredOptions.map((option) => (
                            <div
                                key={option.id}
                                onClick={() => handleSelect(option)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors",
                                    "hover:bg-white/5",
                                    option.id === value && "bg-primary/10"
                                )}
                            >
                                <span className="text-sm text-white">{option.name}</span>
                                {option.id === value && (
                                    <Check className="w-4 h-4 text-primary" />
                                )}
                            </div>
                        ))}

                        {showCreateOption && (
                            <div
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors hover:bg-primary/10 border-t border-white/5"
                            >
                                {creating ? (
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4 text-primary" />
                                )}
                                <span className="text-sm text-primary">
                                    {createMessage} "<span className="font-medium">{search.trim()}</span>"
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export { CreatableSelect };
