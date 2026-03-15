import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Save, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const DeliverySettings = ({ restaurantId, initialConfig = {}, features = {} }) => {
    const [config, setConfig] = useState({
        enabled: false,
        type: 'zone',
        zones: [],
        ...(initialConfig || {})
    });
    const [isSaving, setIsSaving] = useState(false);

    const addZone = () => {
        if (!features.hasDeliveryCalculator && config.zones.length >= 1) {
            toast.error("O Plano Start permite apenas 1 Taxa Fixa. Upgrade para Corporate para zonas ilimitadas.");
            return;
        }
        setConfig(prev => ({
            ...prev,
            zones: [...prev.zones, { name: 'Taxa Fixa (Geral)', fee: 0 }]
        }));
    };

    const removeZone = (index) => {
        const newZones = [...config.zones];
        newZones.splice(index, 1);
        setConfig(prev => ({ ...prev, zones: newZones }));
    };

    const updateZone = (index, field, value) => {
        const newZones = [...config.zones];
        newZones[index] = { ...newZones[index], [field]: field === 'fee' ? Number(value) : value };
        setConfig(prev => ({ ...prev, zones: newZones }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ delivery_config: config })
                .eq('id', restaurantId);

            if (error) throw error;
            toast.success("Definições de entrega guardadas!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao guardar definições.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 sm:p-8 bg-white/90 dark:bg-[#141414]/90 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Taxa de Entrega</h3>
                        <p className="text-sm text-gray-500">
                            {features.hasDeliveryCalculator
                                ? "Configure taxas dinâmicas por bairro/zona."
                                : "Defina uma taxa fixa para todas as suas entregas."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${features.hasDeliveryCalculator ? 'text-amber-500 bg-amber-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                        {features.hasDeliveryCalculator ? 'Corporate' : 'Start/Business'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={config.enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            {config.enabled && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                {features.hasDeliveryCalculator ? "Zonas de Entrega (Bairros)" : "Configuração de Taxa Única"}
                            </label>
                            <button
                                onClick={addZone}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold"
                            >
                                <Plus size={14} /> Adicionar Zona
                            </button>
                        </div>

                        <div className="grid gap-3">
                            {config.zones.map((zone, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <MapPin size={18} className="text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Ex: Talatona"
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-white focus:ring-0"
                                        value={zone.name}
                                        onChange={(e) => updateZone(idx, 'name', e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="Taxa"
                                            className="w-24 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1 text-sm font-bold text-blue-600 outline-none"
                                            value={zone.fee}
                                            onChange={(e) => updateZone(idx, 'fee', e.target.value)}
                                        />
                                        <span className="text-xs font-bold text-gray-400">Kz</span>
                                    </div>
                                    <button
                                        onClick={() => removeZone(idx)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {config.zones.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                    <p className="text-sm text-gray-400">Nenhuma zona configurada. Adicione bairros para cobrar entrega.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isSaving ? 'A guardar...' : 'Guardar Alterações'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliverySettings;
