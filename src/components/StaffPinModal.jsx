import React, { useState, useEffect } from 'react';
import { staffService, normalizeStaffRole } from '../services/staffService';
import { Lock, User, CheckCircle2, X, Users, ChevronLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ROLE_LABELS = {
    admin: '👑 Gerente / Admin',
    waiter: '🤵 Garçom / Sala (Terminal de Mesas)',
    kitchen: '👨‍🍳 Chef / Cozinha (Ecrã KDS)',
    reception: '💵 Caixa POS / Faturação'
};

const StaffPinModal = ({ isOpen, onClose, restaurantId, onLogin }) => {
    const [pin, setPin] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setIsShaking(false);
            loadRestaurantStaff();
        }
    }, [isOpen, restaurantId]);

    const loadRestaurantStaff = async () => {
        setLoadingStaff(true);
        try {
            const list = await staffService.getStaff(restaurantId);
            setStaffList(list || []);
            // Se houver apenas 1 colaborador registado, pré-selecionar
            if (list && list.length === 1) {
                setSelectedStaff(list[0]);
            } else {
                setSelectedStaff(null);
            }
        } catch (e) {
            console.warn('Erro ao carregar equipa no modal:', e);
        } finally {
            setLoadingStaff(false);
        }
    };

    if (!isOpen) return null;

    const handleNumberClick = (num) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (!selectedStaff) {
            toast.error("Selecione primeiro o seu Nome / Operador na lista.");
            return;
        }
        if (pin.length < 4) {
            toast.error("O PIN deve ter pelo menos 4 dígitos.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await staffService.validatePin(restaurantId, pin, selectedStaff.id);

            if (result.valid) {
                localStorage.setItem(`jindungo_staff_id_${restaurantId}`, result.staff.id);
                localStorage.setItem(`jindungo_staff_name_${restaurantId}`, result.staff.name);
                localStorage.setItem(`jindungo_staff_role_${restaurantId}`, result.staff.role);
                localStorage.setItem(`jindungo_staff_login_time_${restaurantId}`, Date.now().toString());

                toast.success(`Turno iniciado: Bem-vindo(a), ${result.staff.name}!`);
                onLogin(result.staff);
                setPin('');
                onClose();
            } else {
                setIsShaking(true);
                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
                toast.error(result.message || "PIN incorreto para este colaborador.");
                setPin('');
                setTimeout(() => setIsShaking(false), 500);
            }
        } catch (error) {
            toast.error("Erro ao validar acesso do colaborador.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearStaff = () => {
        localStorage.removeItem(`jindungo_staff_id_${restaurantId}`);
        localStorage.removeItem(`jindungo_staff_name_${restaurantId}`);
        localStorage.removeItem(`jindungo_staff_role_${restaurantId}`);
        toast.success("Sessão de operador terminada.");
        onLogin(null);
        onClose();
    };

    const currentStaffName = localStorage.getItem(`jindungo_staff_name_${restaurantId}`);

    return (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
            <div className={`bg-[#0E0E10] w-full max-w-md rounded-[32px] p-6 sm:p-8 relative border border-[#D4AF37]/30 shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-transform duration-300 ${isShaking ? 'animate-shake border-red-500/60' : 'animate-fade-in-up'}`}>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    <X size={22} />
                </button>

                {/* Header */}
                <div className="text-center mb-6 mt-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 border transition-all duration-500 ${isShaking ? 'bg-red-500/10 border-red-500/30' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]'}`}>
                        {selectedStaff ? (
                            <Lock size={26} className={isShaking ? 'text-red-400' : 'text-[#D4AF37]'} />
                        ) : (
                            <Users size={26} className="text-[#D4AF37]" />
                        )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-white">
                        {selectedStaff ? `Olá, ${selectedStaff.name}` : 'Identificação de Equipa'}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">
                        {selectedStaff
                            ? ` Cargo: ${ROLE_LABELS[selectedStaff.role] || 'Operador'} — Insira o seu PIN pessoal`
                            : 'Passo 1: Selecione o seu nome na lista para entrar no turno'}
                    </p>
                </div>

                {/* STEP 1: CHOOSE STAFF MEMBER */}
                {!selectedStaff ? (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar mb-4">
                        {loadingStaff ? (
                            <div className="text-center py-8 text-xs text-gray-400">A carregar membros da equipa...</div>
                        ) : staffList.length === 0 ? (
                            <div className="text-center py-8 text-xs text-gray-400">
                                Nenhum colaborador registado. Adicione membros na aba "Equipa & Staff".
                            </div>
                        ) : (
                            staffList.map((member) => (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedStaff(member);
                                        setPin('');
                                    }}
                                    className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-[#D4AF37]/15 border border-white/10 hover:border-[#D4AF37]/50 flex items-center justify-between transition-all group cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-serif font-black flex items-center justify-center text-sm shrink-0">
                                            {(member.name || 'O').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white group-hover:text-[#D4AF37] truncate transition-colors">
                                                {member.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                                                {ROLE_LABELS[member.role] || member.role}
                                                {member.email ? ` • ${member.email}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg border border-[#D4AF37]/20 shrink-0">
                                        Selecionar →
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    /* STEP 2: ENTER PERSONAL PIN FOR SELECTED STAFF */
                    <>
                        <div className="flex justify-center mb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedStaff(null);
                                    setPin('');
                                }}
                                className="text-xs text-gray-400 hover:text-[#D4AF37] flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={14} /> Trocar de Colaborador
                            </button>
                        </div>

                        {/* PIN Dots */}
                        <div className="flex justify-center gap-3.5 mb-6">
                            {[0, 1, 2, 3].map((index) => (
                                <div
                                    key={index}
                                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                        pin.length > index
                                            ? 'bg-[#D4AF37] scale-110 shadow-[0_0_10px_rgba(212,175,55,0.8)]'
                                            : 'bg-gray-800 border border-white/10'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Keypad */}
                        <div className="grid grid-cols-3 gap-2.5 mb-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleNumberClick(num.toString())}
                                    className="h-14 rounded-2xl bg-white/5 text-white text-xl font-bold hover:bg-white/10 active:bg-white/20 transition-colors border border-white/5 cursor-pointer"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={handleBackspace}
                                className="h-14 rounded-2xl bg-white/5 text-gray-400 text-lg font-bold hover:bg-white/10 active:bg-white/20 transition-colors border border-white/5 flex items-center justify-center cursor-pointer"
                            >
                                ⌫
                            </button>
                            <button
                                type="button"
                                onClick={() => handleNumberClick('0')}
                                className="h-14 rounded-2xl bg-white/5 text-white text-xl font-bold hover:bg-white/10 active:bg-white/20 transition-colors border border-white/5 cursor-pointer"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                onClick={handleLogin}
                                disabled={isLoading || pin.length < 4}
                                className={`h-14 rounded-2xl font-bold text-lg flex items-center justify-center transition-all cursor-pointer ${
                                    pin.length >= 4
                                        ? 'bg-[#D4AF37] text-black hover:brightness-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                        : 'bg-white/5 text-gray-500 border border-white/5'
                                }`}
                            >
                                {isLoading ? '...' : <CheckCircle2 size={22} />}
                            </button>
                        </div>
                    </>
                )}

                {currentStaffName && (
                    <div className="border-t border-white/10 pt-4 mt-2">
                        <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
                                    <ShieldCheck size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Turno Ativo</p>
                                    <p className="text-sm font-bold text-white">{currentStaffName}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearStaff}
                                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 bg-red-400/10 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                                Sair do Turno
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffPinModal;
