import React, { useRef } from 'react';
import QRCodeGenerator from './QRCodeGenerator';
import { UploadCloud, Check } from 'lucide-react';

const COLOR_SWATCHES = [
    { value: '#ff6b6b', label: 'Vermelho Jindungo' },
    { value: '#ff9f1c', label: 'Laranja Vibrante' },
    { value: '#ffd93d', label: 'Amarelo Sol' },
    { value: '#6bcb77', label: 'Verde Fresco' },
    { value: '#4ecdc4', label: 'Turquesa' },
    { value: '#4d96ff', label: 'Azul Oceano' },
    { value: '#1a535c', label: 'Deep Teal' },
    { value: '#ff4757', label: 'Carmim' },
    { value: '#2f3542', label: 'Dark Mode' },
];

// Tailwind utility variables
const inputClasses = "w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white font-medium";
const labelClasses = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 first:mt-0";

// Modern Toggle Switch
const ToggleSwitch = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 overflow-hidden ${checked ? 'bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-gray-700'}`}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

const StyleControls = ({ config, setConfig, onReset, onLogoUpload, slug, onSlugChange, restaurantName, onNameChange }) => {
    const fileInputRef = useRef(null);
    const [localSlug, setLocalSlug] = React.useState(slug || '');
    const [isSavingSlug, setIsSavingSlug] = React.useState(false);

    React.useEffect(() => {
        if (slug) setLocalSlug(slug);
    }, [slug]);

    const handleSaveSlug = async () => {
        if (!onSlugChange) return;
        setIsSavingSlug(true);
        const success = await onSlugChange(localSlug);
        if (!success) setLocalSlug(slug);
        setIsSavingSlug(false);
    };

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const originUrl = window.location.origin;
    const publicUrl = `${originUrl}/${slug}`;

    return (
        <div className="bg-black/60 backdrop-blur-xl text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col gap-8 w-full transition-all">

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-serif font-bold text-white">Personalização Visual</h2>
                <div className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded-full border border-[#D4AF37]/30">
                    Geral
                </div>
            </div>

            {/* Restaurant Form elements... */}
            {/* Restaurant Name */}
            <div>
                <label className={labelClasses}>Nome do Restaurante</label>
                <input
                    type="text"
                    className={inputClasses}
                    value={restaurantName || ''}
                    onChange={(e) => onNameChange && onNameChange(e.target.value)}
                    placeholder="Ex: Restaurante Jindungo"
                />
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
                    Dica: Use "Teste" ou "Demo" no nome para ativar o gerador de produtos de teste.
                </p>
            </div>

            {/* Custom URL Slug */}
            <div>
                <label className={labelClasses}>Link Público do Menu (Slug)</label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        className={inputClasses}
                        value={localSlug}
                        onChange={(e) => setLocalSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        placeholder="Ex: meu-restaurante"
                    />
                    <button
                        onClick={handleSaveSlug}
                        disabled={isSavingSlug || localSlug === slug || !localSlug.trim()}
                        className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${localSlug !== slug && localSlug.trim()
                            ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 hover:-translate-y-0.5'
                            : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                            }`}
                    >
                        {isSavingSlug ? '...' : (localSlug !== slug ? 'Salvar Novo' : 'Salvo')}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                    O seu link atual é: <span className="text-[#D4AF37] font-mono bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-500/20">{originUrl}/{slug}</span>
                </p>
            </div>

            {/* Logo Upload Dropzone */}
            <div>
                <label className={labelClasses}>Logotipo do Restaurante</label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full relative group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/5 transition-all duration-300"></div>
                    <div className="relative p-8 flex flex-col items-center justify-center gap-3 text-center">
                        {config.logoUrl ? (
                            <div className="relative w-32 h-32 mb-2 group-hover:scale-105 transition-transform duration-300">
                                <img src={config.logoUrl} alt="Logotipo do Restaurante" className="w-full h-full object-contain drop-shadow-md rounded-xl bg-black/50 backdrop-blur" />
                                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <UploadCloud size={28} className="text-[#D4AF37] drop-shadow-lg" />
                                </div>
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-black/50 border border-white/10 shadow-sm flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/50 transition-all duration-500">
                                <UploadCloud size={28} />
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-gray-200">
                                {config.logoUrl ? "Clique para alterar o Logo" : "Clique para carregar o seu Logo"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1.5">PNG, JPG, transparente. Máx 5MB.</p>
                        </div>
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={onLogoUpload}
                    className="hidden"
                />
            </div>

            {/* Toggles Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-bold text-white">Modo Noturno (VIP)</label>
                        <p className="text-xs text-gray-400 mt-0.5">Ativa a interface escura para clientes.</p>
                    </div>
                    <ToggleSwitch
                        checked={config.darkMode || false}
                        onChange={(val) => handleChange('darkMode', val)}
                    />
                </div>

                {/* Table Bill Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-bold text-white">Impressão na Cozinha</label>
                        <p className="text-xs text-gray-400 mt-0.5">Permite a impressão mágica (Conta de Conferência).</p>
                    </div>
                    <ToggleSwitch
                        checked={config.enableTableBill !== false}
                        onChange={(val) => handleChange('enableTableBill', val)}
                    />
                </div>
            </div>

            {/* QR Code section */}
            <div>
                <label className={labelClasses}>QR Code para Mesas</label>
                <div className="bg-black/30 p-6 rounded-2xl border border-white/10 flex justify-center backdrop-blur-xl">
                    <div className="p-4 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <QRCodeGenerator url={publicUrl} restaurantName={slug} />
                    </div>
                </div>
            </div>

            {/* WhatsApp Integration */}
            <div>
                <label className={labelClasses}>WhatsApp de Receção</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+</span>
                    <input
                        type="tel"
                        className={`${inputClasses} pl-8`}
                        value={config.whatsappNumber || ''}
                        onChange={(e) => handleChange('whatsappNumber', e.target.value.replace(/\D/g, ''))}
                        placeholder="244923456789"
                    />
                </div>
                <p className="text-xs text-gray-400 mt-2">Os pedidos dos clientes serão encaminhados para este número automaticamente.</p>
            </div>

            {/* Layout Mode */}
            <div>
                <label className={labelClasses}>Layout do Menu Público</label>
                <div className="grid grid-cols-3 gap-3 p-1.5 bg-black/50 border border-white/10 rounded-xl">
                    {['grid', 'list', 'minimal'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleChange('layoutMode', mode)}
                            className={`py-3 px-2 rounded-lg text-sm font-bold transition-all tracking-wide ${config.layoutMode === mode
                                ? 'bg-white/10 text-white shadow-sm border border-white/20'
                                : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                        >
                            {mode === 'grid' && 'Grade de Fotos'}
                            {mode === 'list' && 'Lista Clássica'}
                            {mode === 'minimal' && 'Minimalista'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Brand Color */}
            <div>
                <label className={labelClasses}>Cor Principal (Branding)</label>

                <div className="flex flex-wrap gap-3 mb-4">
                    {COLOR_SWATCHES.map(swatch => (
                        <button
                            key={swatch.value}
                            onClick={() => handleChange('primaryColor', swatch.value)}
                            title={swatch.label}
                            className={`w-10 h-10 rounded-full transition-all relative outline-none ring-2 ring-offset-4 ring-offset-[#141414] shadow-lg ${config.primaryColor === swatch.value ? 'ring-[#D4AF37] scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'ring-transparent hover:scale-110 hover:shadow-white/20'} `}
                            style={{ backgroundColor: swatch.value }}
                        >
                            {config.primaryColor === swatch.value && (
                                <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/10 shadow-inner group cursor-pointer focus-within:ring-[#D4AF37] transition-colors">
                        <input
                            type="color"
                            value={config.primaryColor || '#D4AF37'}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="absolute -inset-2 w-20 h-20 cursor-pointer border-0"
                        />
                    </div>
                    <input
                        type="text"
                        className={`${inputClasses} flex-1 uppercase font-mono tracking-wider`}
                        value={config.primaryColor}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                        placeholder="#HEX"
                        maxLength={7}
                    />
                </div>
            </div>

            {/* Background Color */}
            <div>
                <label className={labelClasses}>Cor de Fundo do Menu</label>
                <p className="text-xs text-gray-400 mb-3">Se definida, irá sobrepor o Modo Noturno. O texto adaptar-se-á automaticamente para continuar legível.</p>

                <div className="flex flex-wrap gap-3 mb-4">
                    {[
                        { value: '', label: 'Padrão (Fundo Limpo)' },
                        { value: '#ffffff', label: 'Branco Puro' },
                        { value: '#121212', label: 'Preto (Noturno)' },
                        { value: '#fdf6e3', label: 'Papiro / Creme' },
                        { value: '#2d3436', label: 'Cinza Escuro' }
                    ].map(swatch => (
                        <button
                            key={swatch.value || 'default'}
                            onClick={() => handleChange('backgroundColor', swatch.value)}
                            title={swatch.label}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all relative outline-none ring-2 ring-offset-2 ring-offset-[#141414] shadow-sm flex items-center gap-2 ${(config.backgroundColor || '') === swatch.value
                                    ? 'ring-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)] text-white'
                                    : 'ring-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                                }`}
                            style={{ backgroundColor: swatch.value || 'rgba(255,255,255,0.05)' }}
                        >
                            <span
                                className="w-4 h-4 rounded-full border border-gray-500/50 block"
                                style={{ backgroundColor: swatch.value || 'transparent' }}
                            ></span>
                            <span className={swatch.value === '#ffffff' ? 'text-gray-800' : ''}>
                                {swatch.label}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/10 shadow-inner group cursor-pointer focus-within:ring-[#D4AF37] transition-colors">
                        <input
                            type="color"
                            value={config.backgroundColor || '#ffffff'}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            className="absolute -inset-2 w-20 h-20 cursor-pointer border-0 bg-transparent"
                        />
                    </div>
                    <input
                        type="text"
                        className={`${inputClasses} flex-1 uppercase font-mono tracking-wider`}
                        value={config.backgroundColor || ''}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        placeholder="Ex: #1A1A1A ou deixe vazio"
                        maxLength={7}
                    />
                </div>
            </div>

            {/* Typography */}
            <div>
                <label className={labelClasses}>Tipografia</label>
                <div className="relative">
                    <select
                        className={`${inputClasses} appearance-none cursor-pointer`}
                        value={config.fontFamily}
                        onChange={(e) => handleChange('fontFamily', e.target.value)}
                    >
                        <option value="Inter, sans-serif">Inter (Moderno & Limpo)</option>
                        <option value="Playfair Display, serif">Playfair Display (Premium Elegance)</option>
                        <option value="Fira Code, monospace">Fira Code (Tech/Café)</option>
                        <option value="Lato, sans-serif">Lato (Simples)</option>
                        <option value="Montserrat, sans-serif">Montserrat (Geométrico)</option>
                        <option value="Open Sans, sans-serif">Open Sans (Muito Legível)</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Reset Area */}
            <div className="mt-4 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
                <button
                    onClick={onReset}
                    className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors uppercase tracking-wider"
                >
                    Repor Definições de Fábrica
                </button>
                <div className="bg-green-900/20 text-green-400 text-xs font-bold px-4 py-3 rounded-xl w-full text-center border border-green-500/20 shadow-sm flex items-center justify-center gap-2">
                    <span className="flex h-2 w-2 relative mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                    Sincronização Ativa: As alterações visuais são salvas na nuvem Jindungo em tempo real.
                </div>
            </div>
        </div>
    );
};

export default StyleControls;
