import React, { useState, useEffect } from 'react';
import { staffService } from '../services/staffService';
import { Lock, User, CheckCircle2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StaffPinModal = ({ isOpen, onClose, restaurantId, onLogin }) => {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setIsShaking(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNumberClick = (num) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            // Haptic feedback if available
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (pin.length < 4) {
            toast.error("O PIN deve ter pelo menos 4 dígitos");
            return;
        }

        setIsLoading(true);
        try {
            const result = await staffService.validatePin(restaurantId, pin);
            
            if (result.valid) {
                // Save to local storage for persistence across tabs
                localStorage.setItem(`jindungo_staff_id_${restaurantId}`, result.staff.id);
                localStorage.setItem(`jindungo_staff_name_${restaurantId}`, result.staff.name);
                localStorage.setItem(`jindungo_staff_role_${restaurantId}`, result.staff.role);
                localStorage.setItem(`jindungo_staff_login_time_${restaurantId}`, Date.now().toString());
                
                toast.success(`Bem-vindo, ${result.staff.name}!`);
                onLogin(result.staff);
                setPin('');
                onClose();
            } else {
                setIsShaking(true);
                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
                toast.error(result.message);
                setPin(''); 
                setTimeout(() => setIsShaking(false), 500);
            }
        } catch (error) {
            toast.error("Erro na ligação ao servidor");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearStaff = () => {
        localStorage.removeItem(`jindungo_staff_id_${restaurantId}`);
        localStorage.removeItem(`jindungo_staff_name_${restaurantId}`);
        localStorage.removeItem(`jindungo_staff_role_${restaurantId}`);
        toast.success("Sessão da equipa terminada");
        onLogin(null);
        onClose();
    };

    const currentStaffName = localStorage.getItem(`jindungo_staff_name_${restaurantId}`);

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
            <div className={`bg-[#121212] w-full max-w-sm rounded-[32px] p-8 relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-300 ${isShaking ? 'animate-shake border-red-500/50' : 'animate-fade-in-up'}`}>
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8 mt-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border transition-all duration-500 ${isShaking ? 'bg-red-500/10 border-red-500/30' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]'}`}>
                        <Lock size={28} className={isShaking ? 'text-red-400' : 'text-[#D4AF37]'} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-white mb-2">Acesso Restrito</h2>
                    <p className="text-gray-400 text-sm">Insira o seu PIN de Garçom ou Gerente</p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map((index) => (
                        <div 
                            key={index}
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                pin.length > index 
                                ? 'bg-[#D4AF37] scale-110 shadow-[0_0_10px_rgba(212,175,55,0.8)]' 
                                : 'bg-gray-800'
                            }`}
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-16 rounded-2xl bg-white/5 text-white text-2xl font-bold hover:bg-white/10 active:bg-white/20 transition-colors border border-white/5"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleBackspace}
                        className="h-16 rounded-2xl bg-white/5 text-gray-400 text-xl font-bold hover:bg-white/10 active:bg-white/20 transition-colors border border-white/5 flex items-center justify-center"
                    >
                        ⌫
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-16 rounded-2xl bg-white/5 text-white text-2xl font-bold hover:bg-white/10 active:bg-white/20 transition-colors border border-white/5"
                    >
                        0
                    </button>
                    <button
                        onClick={handleLogin}
                        disabled={isLoading || pin.length < 4}
                        className={`h-16 rounded-2xl font-bold text-xl flex items-center justify-center transition-all ${
                            pin.length >= 4 
                            ? 'bg-[#D4AF37] text-black hover:brightness-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                            : 'bg-white/5 text-gray-500 border border-white/5'
                        }`}
                    >
                        {isLoading ? '...' : <CheckCircle2 size={24} />}
                    </button>
                </div>

                {currentStaffName && (
                    <div className="border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Logado como</p>
                                    <p className="text-sm font-bold text-white">{currentStaffName}</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleClearStaff}
                                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 bg-red-400/10 rounded-lg font-bold transition-colors"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffPinModal;
