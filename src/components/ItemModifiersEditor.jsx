import React from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Layers, Sliders, ChevronDown } from 'lucide-react';

const PRESET_TEMPLATES = [
    {
        id: 'ponto_carne',
        name: '🥩 Ponto da Carne',
        group: {
            id: 'mod_ponto_' + Date.now(),
            title: 'Ponto da Carne',
            required: true,
            min: 1,
            max: 1,
            options: [
                { name: 'Mal Passada', price: 0 },
                { name: 'Ao Ponto', price: 0 },
                { name: 'Bem Passada', price: 0 }
            ]
        }
    },
    {
        id: 'acompanhamentos',
        name: '🍟 Acompanhamentos (Grátis)',
        group: {
            id: 'mod_acomp_' + Date.now(),
            title: 'Escolha os Acompanhamentos',
            required: false,
            min: 0,
            max: 2,
            options: [
                { name: 'Batata Frita Rústica', price: 0 },
                { name: 'Arroz Branco Soltinho', price: 0 },
                { name: 'Mandioca Frita Crocante', price: 0 },
                { name: 'Salada Mista Fresca', price: 0 }
            ]
        }
    },
    {
        id: 'extras_pagos',
        name: '🥓 Extras Pagos (+Kz)',
        group: {
            id: 'mod_extras_' + Date.now(),
            title: 'Deseja Extras ou Toppings?',
            required: false,
            min: 0,
            max: 4,
            options: [
                { name: 'Ovo Estrelado', price: 500 },
                { name: 'Bacon Crocante', price: 800 },
                { name: 'Queijo Cheddar Derretido', price: 700 },
                { name: 'Molho de Alho Especial', price: 300 }
            ]
        }
    },
    {
        id: 'temperatura_bebida',
        name: '🧊 Opções de Bebida / Gelo',
        group: {
            id: 'mod_bebida_' + Date.now(),
            title: 'Serviço da Bebida',
            required: false,
            min: 0,
            max: 1,
            options: [
                { name: 'Bem Gelada com Gelo e Limão', price: 0 },
                { name: 'Apenas Gelada (Sem Gelo)', price: 0 },
                { name: 'Natural / Temperatura Ambiente', price: 0 }
            ]
        }
    }
];

const ItemModifiersEditor = ({ groups = [], onChange }) => {
    const handleAddGroup = () => {
        const newGroup = {
            id: 'group_' + Date.now(),
            title: 'Nova Opção / Acompanhamento',
            required: false,
            min: 0,
            max: 1,
            options: [
                { name: 'Opção 1', price: 0 },
                { name: 'Opção 2', price: 0 }
            ]
        };
        onChange([...groups, newGroup]);
    };

    const handleApplyPreset = (preset) => {
        const cloned = JSON.parse(JSON.stringify(preset.group));
        cloned.id = 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        onChange([...groups, cloned]);
    };

    const handleUpdateGroup = (groupIndex, field, value) => {
        const updated = groups.map((g, idx) => {
            if (idx !== groupIndex) return g;
            return { ...g, [field]: value };
        });
        onChange(updated);
    };

    const handleRemoveGroup = (groupIndex) => {
        const updated = groups.filter((_, idx) => idx !== groupIndex);
        onChange(updated);
    };

    const handleAddOption = (groupIndex) => {
        const updated = groups.map((g, idx) => {
            if (idx !== groupIndex) return g;
            const opts = g.options || [];
            return {
                ...g,
                options: [...opts, { name: `Nova Opção ${opts.length + 1}`, price: 0 }]
            };
        });
        onChange(updated);
    };

    const handleUpdateOption = (groupIndex, optionIndex, field, value) => {
        const updated = groups.map((g, gIdx) => {
            if (gIdx !== groupIndex) return g;
            const updatedOpts = g.options.map((opt, oIdx) => {
                if (oIdx !== optionIndex) return opt;
                return { ...opt, [field]: value };
            });
            return { ...g, options: updatedOpts };
        });
        onChange(updated);
    };

    const handleRemoveOption = (groupIndex, optionIndex) => {
        const updated = groups.map((g, gIdx) => {
            if (gIdx !== groupIndex) return g;
            return {
                ...g,
                options: g.options.filter((_, oIdx) => oIdx !== optionIndex)
            };
        });
        onChange(updated);
    };

    return (
        <div className="space-y-4 pt-4 border-t border-[#2A2A2A]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                            <Sliders size={14} className="text-[#F5C542]" />
                            Modificadores & Acompanhamentos do Prato
                        </span>
                        <span className="text-[10px] font-bold bg-[#F5C542]/10 text-[#F5C542] px-2 py-0.5 rounded-full border border-[#F5C542]/30">
                            {groups.length} {groups.length === 1 ? 'Grupo' : 'Grupos'}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        Permita ao cliente escolher o ponto da carne, acompanhamentos ou adicionar extras pagos.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAddGroup}
                    className="px-3.5 py-2 bg-[#F5C542]/10 hover:bg-[#F5C542] text-[#F5C542] hover:text-black rounded-xl border border-[#F5C542]/40 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                >
                    <Plus size={14} strokeWidth={3} />
                    <span>Novo Grupo</span>
                </button>
            </div>

            {/* PRESETS DE 1-CLIQUE */}
            <div className="bg-[#111112] p-3 rounded-2xl border border-white/5 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Sparkles size={11} className="text-[#F5C542]" /> Modelos Rápidos (Clique para Adicionar):
                </span>
                <div className="flex flex-wrap gap-2">
                    {PRESET_TEMPLATES.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => handleApplyPreset(p)}
                            className="px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#2A2A2E] text-gray-200 hover:text-[#F5C542] border border-white/10 hover:border-[#F5C542]/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                            <Plus size={12} className="text-[#F5C542]" />
                            <span>{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* LISTA DE GRUPOS CONFIGURADOS */}
            {groups.length === 0 ? (
                <div className="text-center py-6 px-4 border border-dashed border-white/10 rounded-2xl bg-black/20">
                    <Layers size={24} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-xs text-gray-400 font-medium">Nenhum modificador configurado para este prato.</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                        Use um dos modelos rápidos acima ou crie um grupo personalizado.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map((group, groupIndex) => (
                        <div 
                            key={group.id || groupIndex}
                            className="bg-[#141416] border border-[#2E2E32] rounded-2xl p-4 sm:p-5 space-y-4 shadow-md transition-all hover:border-[#F5C542]/30"
                        >
                            {/* Cabeçalho do Grupo */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                        Título do Grupo (ex: Ponto da Carne / Acompanhamentos)
                                    </label>
                                    <input
                                        type="text"
                                        value={group.title || ''}
                                        onChange={e => handleUpdateGroup(groupIndex, 'title', e.target.value)}
                                        placeholder="Ex: Escolha o Ponto da Carne"
                                        className="w-full px-3.5 py-2 bg-[#1C1C1F] border border-white/10 rounded-xl text-sm font-bold text-white focus:border-[#F5C542] outline-none transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateGroup(groupIndex, 'required', !group.required)}
                                        className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 cursor-pointer ${
                                            group.required
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                                        }`}
                                    >
                                        <CheckCircle2 size={13} className={group.required ? 'text-amber-400' : 'text-gray-500'} />
                                        <span>{group.required ? 'Obrigatório' : 'Opcional'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveGroup(groupIndex)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                                        title="Eliminar este grupo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Configuração de Limites */}
                            <div className="flex items-center gap-4 text-xs text-gray-400 bg-black/40 px-3.5 py-2.5 rounded-xl border border-white/5">
                                <span className="font-bold text-gray-300">Regra de Seleção:</span>
                                <div className="flex items-center gap-2">
                                    <span>Máximo de opções permitidas:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={group.max || 1}
                                        onChange={e => handleUpdateGroup(groupIndex, 'max', parseInt(e.target.value) || 1)}
                                        className="w-16 px-2 py-1 bg-[#1C1C1F] border border-white/10 rounded-lg text-white font-bold text-center focus:border-[#F5C542] outline-none"
                                    />
                                </div>
                                <span className="text-[11px] text-gray-500 italic hidden sm:inline">
                                    ({group.max === 1 ? 'O cliente só pode escolher 1 opção' : `O cliente pode escolher até ${group.max} opções`})
                                </span>
                            </div>

                            {/* Lista de Opções do Grupo */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider px-1">
                                    <span>Opções / Itens</span>
                                    <span>Preço Adicional (Kz)</span>
                                </div>

                                {(group.options || []).map((option, optionIndex) => (
                                    <div 
                                        key={optionIndex}
                                        className="flex items-center gap-2 bg-[#1A1A1D] p-2 rounded-xl border border-white/5"
                                    >
                                        <input
                                            type="text"
                                            value={option.name || ''}
                                            onChange={e => handleUpdateOption(groupIndex, optionIndex, 'name', e.target.value)}
                                            placeholder="Nome da opção (ex: Batata Frita)"
                                            className="flex-1 px-3 py-1.5 bg-[#121214] border border-white/10 rounded-lg text-xs font-semibold text-white focus:border-[#F5C542] outline-none"
                                        />

                                        <div className="flex items-center gap-1.5 w-36">
                                            <span className="text-xs text-[#F5C542] font-black font-mono">+</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="50"
                                                value={option.price || 0}
                                                onChange={e => handleUpdateOption(groupIndex, optionIndex, 'price', parseInt(e.target.value) || 0)}
                                                placeholder="0 Kz"
                                                className="w-full px-2 py-1.5 bg-[#121214] border border-white/10 rounded-lg text-xs font-mono font-bold text-[#F5C542] focus:border-[#F5C542] outline-none text-right"
                                            />
                                            <span className="text-[10px] text-gray-400 font-mono">Kz</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(groupIndex, optionIndex)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                            title="Remover opção"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => handleAddOption(groupIndex)}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-dashed border-white/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                                >
                                    <Plus size={13} />
                                    <span>Adicionar Outra Opção</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ItemModifiersEditor;
