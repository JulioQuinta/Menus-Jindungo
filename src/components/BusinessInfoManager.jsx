import React, { useState } from 'react';
import { Save, Clock, MapPin, Share2, Instagram, Facebook, Phone, Plus, Trash2 } from 'lucide-react';

const DAYS = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira',
    'Sexta-feira', 'Sábado', 'Domingo'
];

const BusinessInfoManager = ({ info, onSave, isLoading }) => {
    const [localInfo, setLocalInfo] = useState(() => {
        const defaultHours = DAYS.map(day => ({
            day,
            open: '08:00',
            close: '22:00',
            closed: false
        }));

        const initialInfo = info || {};

        // Merge or replace hours to ensure all 7 days exist
        let hours = initialInfo.opening_hours || [];
        if (hours.length === 0) {
            hours = defaultHours;
        } else {
            // Ensure all days are present (in case DB has partial list)
            hours = DAYS.map(day => {
                const existing = (initialInfo.opening_hours || []).find(h => h.day === day);
                return existing || { day, open: '08:00', close: '22:00', closed: true };
            });
        }

        return {
            opening_hours: hours,
            location: initialInfo.location || { address: '', maps_link: '' },
            socials: initialInfo.socials || { instagram: '', facebook: '', phone: '' },
            share_text: initialInfo.share_text || 'Veja o nosso menu digital!',
            table_map: initialInfo.table_map || []
        };
    });

    const formatAngolaPhone = (value) => {
        // Remove everything except digits and +
        let cleaned = value.replace(/[^\d+]/g, '');

        // If it has 9 digits and no +, assume Angola prefix is needed
        if (cleaned.length === 9 && !cleaned.startsWith('+')) {
            return `+244${cleaned}`;
        }

        // If it starts with 244 and has 12 digits, add the +
        if (cleaned.length === 12 && cleaned.startsWith('244')) {
            return `+${cleaned}`;
        }

        return cleaned;
    };

    const handleChange = (section, key, value) => {
        let finalValue = value;
        if (key === 'phone') {
            finalValue = formatAngolaPhone(value);
        }

        setLocalInfo(prev => ({
            ...prev,
            [section]: { ...prev[section], [key]: finalValue }
        }));
    };

    const handleHourChange = (index, field, value) => {
        const newHours = [...localInfo.opening_hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setLocalInfo(prev => ({ ...prev, opening_hours: newHours }));
    };

    const inputClasses = "w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white text-sm";
    const labelClasses = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-white">Informações do Negócio</h2>
                    <p className="text-sm text-gray-400">Configure como os clientes veem o seu restaurante.</p>
                </div>
                <button
                    onClick={() => onSave(localInfo)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black px-6 py-3 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                >
                    <Save size={18} />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Hours */}
                <div className="bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                            <Clock size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-white">Horário de Funcionamento</h3>
                    </div>

                    <div className="space-y-3">
                        {localInfo.opening_hours.map((item, idx) => (
                            <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border ${item.closed ? 'bg-red-500/5 border-red-500/10 opacity-70' : 'bg-white/5 border-white/5'}`}>
                                <span className="text-sm font-medium text-gray-300 w-28">{item.day}</span>

                                {!item.closed ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="time"
                                            value={item.open}
                                            onChange={(e) => handleHourChange(idx, 'open', e.target.value)}
                                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]"
                                        />
                                        <span className="text-gray-500 text-xs text-center w-4">às</span>
                                        <input
                                            type="time"
                                            value={item.close}
                                            onChange={(handleHourChange.bind(null, idx, 'close'))}
                                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1 text-xs font-bold text-red-400 uppercase tracking-tighter italic">Fechado</div>
                                )}

                                <button
                                    onClick={() => handleHourChange(idx, 'closed', !item.closed)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${item.closed ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                                >
                                    {item.closed ? 'Abrir' : 'Fechar'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Location & Socials */}
                <div className="space-y-6">

                    {/* Location */}
                    <div className="bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <MapPin size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-white">Localização</h3>
                        </div>

                        <div>
                            <label className={labelClasses}>Endereço Físico</label>
                            <textarea
                                className={`${inputClasses} resize-none`}
                                rows={2}
                                value={localInfo.location.address}
                                onChange={(e) => handleChange('location', 'address', e.target.value)}
                                placeholder="Ex: Rua Direita da Samba, Luanda"
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Link Google Maps</label>
                            <input
                                type="url"
                                className={inputClasses}
                                value={localInfo.location.maps_link}
                                onChange={(e) => handleChange('location', 'maps_link', e.target.value)}
                                placeholder="https://goo.gl/maps/..."
                            />
                            <p className="text-[10px] text-gray-500 mt-2 italic">* O cliente poderá clicar para abrir o GPS.</p>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                                <Share2 size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-white">Redes Sociais & Contacto</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Instagram</label>
                                <div className="relative">
                                    <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        className={`${inputClasses} pl-9`}
                                        value={localInfo.socials.instagram}
                                        onChange={(e) => handleChange('socials', 'instagram', e.target.value)}
                                        placeholder="@jindungo"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Facebook</label>
                                <div className="relative">
                                    <Facebook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        className={`${inputClasses} pl-9`}
                                        value={localInfo.socials.facebook}
                                        onChange={(e) => handleChange('socials', 'facebook', e.target.value)}
                                        placeholder="jindungo_restaurante"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Telefone Secundário (Reservas)</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="tel"
                                    className={`${inputClasses} pl-9`}
                                    value={localInfo.socials.phone}
                                    onChange={(e) => handleChange('socials', 'phone', e.target.value)}
                                    placeholder="9xx xxx xxx"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Texto de Partilha</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={localInfo.share_text}
                                onChange={(e) => setLocalInfo(prev => ({ ...prev, share_text: e.target.value }))}
                                placeholder="Ex: Vem conhecer o nosso menu!"
                            />
                        </div>
                    </div>

                    {/* [NEW] Table Map Configuration */}
                    <div className="bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="m5 8 14 0" /><path d="m5 16 14 0" /></svg>
                            </div>
                            <h3 className="font-bold text-lg text-white">Mapa de Mesas</h3>
                        </div>

                        <p className="text-xs text-gray-400 mb-4 italic">Defina os nomes ou letras das mesas do seu restaurante (ex: 1, 2, A, B, VIP).</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {localInfo.table_map.map((table, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-1.5 rounded-xl text-sm font-bold">
                                    {table}
                                    <button
                                        onClick={() => {
                                            const newMap = localInfo.table_map.filter((_, i) => i !== idx);
                                            setLocalInfo(prev => ({ ...prev, table_map: newMap }));
                                        }}
                                        className="hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                id="new-table-input"
                                type="text"
                                className={inputClasses}
                                placeholder="Nome/No da Mesa"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.target.value.trim();
                                        if (val && !localInfo.table_map.includes(val)) {
                                            setLocalInfo(prev => ({ ...prev, table_map: [...prev.table_map, val] }));
                                            e.target.value = '';
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('new-table-input');
                                    const val = input.value.trim();
                                    if (val && !localInfo.table_map.includes(val)) {
                                        setLocalInfo(prev => ({ ...prev, table_map: [...prev.table_map, val] }));
                                        input.value = '';
                                    }
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl border border-white/10 transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BusinessInfoManager;
