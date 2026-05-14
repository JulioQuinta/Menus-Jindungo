import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, MapPin, Navigation, Truck, Settings2 } from 'lucide-react';
import MapPicker from './MapPicker';

const DeliverySettings = ({ restaurantId, initialConfig = {}, features = {} }) => {
    const [config, setConfig] = useState({
        enabled: false,
        type: 'zone', // 'zone' | 'distance'
        zones: [],
        base_fee: 0,
        fee_per_km: 0,
        min_fee: 0,
        restaurant_location: null, // {lat, lng}
        ...(initialConfig || {})
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ delivery_config: config })
                .eq('id', restaurantId);

            if (error) throw error;
            toast.success('Configurações de entrega guardadas!');
        } catch (err) {
            toast.error('Erro ao guardar: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const addZone = () => {
        setConfig(prev => ({
            ...prev,
            zones: [...prev.zones, { name: '', fee: 0 }]
        }));
    };

    const removeZone = (idx) => {
        const newZones = [...config.zones];
        newZones.splice(idx, 1);
        setConfig(prev => ({ ...prev, zones: newZones }));
    };

    const updateZone = (idx, field, value) => {
        const newZones = [...config.zones];
        newZones[idx][field] = field === 'fee' ? parseFloat(value) || 0 : value;
        setConfig(prev => ({ ...prev, zones: newZones }));
    };

    return (
        <div className="bg-white/90 dark:bg-[#141414]/90 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-white/5 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Taxa de Entrega</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {config.type === 'distance' 
                                ? "Cálculo automático baseado na distância do cliente." 
                                : "Configuração por bairros ou zonas específicas."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200 dark:border-white/5">
                    <button
                        onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`relative inline-flex h-10 w-20 flex-shrink-0 cursor-pointer rounded-xl border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                    >
                        <span className={`pointer-events-none inline-block h-9 w-9 transform rounded-lg bg-white shadow ring-0 transition duration-200 ease-in-out ${config.enabled ? 'translate-x-10' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {config.enabled && (
                <div className="space-y-8">
                    {/* Delivery Method Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setConfig(prev => ({ ...prev, type: 'zone' }))}
                            className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${config.type === 'zone' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300'}`}
                        >
                            <MapPin size={20} />
                            <div className="text-left">
                                <p className="font-bold text-sm">Por Zonas (Bairros)</p>
                                <p className="text-[10px] opacity-70 uppercase tracking-wider">Configuração Manual</p>
                            </div>
                        </button>
                        <button
                            onClick={() => setConfig(prev => ({ ...prev, type: 'distance' }))}
                            className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${config.type === 'distance' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300'}`}
                        >
                            <Navigation size={20} />
                            <div className="text-left">
                                <p className="font-bold text-sm">Por Distância (KM)</p>
                                <p className="text-[10px] opacity-70 uppercase tracking-wider">Cálculo Automático</p>
                            </div>
                        </button>
                    </div>

                    {config.type === 'distance' ? (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                                <p className="text-xs text-blue-500 font-bold mb-4 flex items-center gap-2">
                                    <MapPin size={14} /> ONDE FICA O SEU RESTAURANTE? (Ponto de Partida)
                                </p>
                                <MapPicker 
                                    onLocationSelected={(pos) => setConfig(prev => ({ ...prev, restaurant_location: pos }))}
                                    defaultLat={config.restaurant_location?.lat || -8.8390}
                                    defaultLng={config.restaurant_location?.lng || 13.2894}
                                />
                                {config.restaurant_location && (
                                    <p className="text-[10px] text-green-500 mt-2 font-mono">
                                        ✓ Localização Definida: {config.restaurant_location.lat.toFixed(5)}, {config.restaurant_location.lng.toFixed(5)}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Taxa Base (Kz)</label>
                                    <input 
                                        type="number" 
                                        value={config.base_fee} 
                                        onChange={(e) => setConfig(prev => ({ ...prev, base_fee: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 p-3 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-white font-bold"
                                        placeholder="Ex: 500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preço por KM (Kz)</label>
                                    <input 
                                        type="number" 
                                        value={config.fee_per_km} 
                                        onChange={(e) => setConfig(prev => ({ ...prev, fee_per_km: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 p-3 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-white font-bold"
                                        placeholder="Ex: 200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Taxa Mínima (Kz)</label>
                                    <input 
                                        type="number" 
                                        value={config.min_fee} 
                                        onChange={(e) => setConfig(prev => ({ ...prev, min_fee: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 p-3 rounded-xl outline-none focus:border-[#D4AF37] text-gray-900 dark:text-white font-bold"
                                        placeholder="Ex: 1000"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Zonas de Entrega (Bairros)</h3>
                                <button
                                    onClick={addZone}
                                    className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] hover:scale-105 transition-all"
                                >
                                    <Plus size={16} /> Adicionar Zona
                                </button>
                            </div>

                            {config.zones.length === 0 && (
                                <div className="p-10 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[24px] text-center">
                                    <p className="text-gray-400 text-sm">Nenhuma zona configurada. Adicione bairros para cobrar entrega.</p>
                                </div>
                            )}

                            {config.zones.map((zone, idx) => (
                                <div key={idx} className="flex gap-3 items-center group animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex-1 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-3 flex gap-3">
                                        <input
                                            className="flex-1 bg-transparent border-0 outline-none text-sm font-bold text-gray-900 dark:text-white"
                                            placeholder="Ex: Talatona"
                                            value={zone.name}
                                            onChange={(e) => updateZone(idx, 'name', e.target.value)}
                                        />
                                        <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />
                                        <input
                                            className="w-24 bg-transparent border-0 outline-none text-sm font-black text-[#D4AF37] text-right"
                                            type="number"
                                            placeholder="1500"
                                            value={zone.fee}
                                            onChange={(e) => updateZone(idx, 'fee', e.target.value)}
                                        />
                                        <span className="text-[10px] font-black text-gray-400 flex items-center">Kz</span>
                                    </div>
                                    <button
                                        onClick={() => removeZone(idx)}
                                        className="p-3 text-red-500 bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${isSaving ? 'opacity-50' : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.01] active:scale-[0.99]'}`}
                    >
                        <Save size={20} />
                        {isSaving ? 'A guardar...' : 'Guardar Alterações'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default DeliverySettings;
