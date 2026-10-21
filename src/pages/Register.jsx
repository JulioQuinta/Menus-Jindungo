import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ChefHat, Utensils, CheckCircle, Smartphone, Mail, Award, Lock, ArrowLeft, FileCheck } from 'lucide-react';

const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-transparent w-0' };
    if (pass.length < 6) return { score: 1, text: 'Muito Fraca', color: 'bg-red-500 w-1/4' };
    if (pass.length < 8) return { score: 1, text: 'Fraca', color: 'bg-red-400 w-2/4' };
    
    let strength = 0;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z\d]/.test(pass)) strength++;
    
    if (strength <= 2) return { score: 2, text: 'Média', color: 'bg-yellow-500 w-3/4' };
    return { score: 3, text: 'Forte', color: 'bg-green-500 w-full' };
};

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('business'); // 'start' | 'business' | 'corporate' | 'billing_only'
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { signUp } = useAuth();
    const { logoUrl } = useSettings();
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('As palavras-passe não coincidem');
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return setError('A palavra-passe deve ter pelo menos 8 caracteres e conter pelo menos uma letra e um número para garantir a segurança da sua conta.');
        }

        if (!fullName || !phone || !restaurantName) {
            return setError('Por favor, preencha todos os campos.');
        }

        const moduleType = selectedPlan === 'billing_only' ? 'billing_only' : 'full_suite';

        setError('');
        setIsLoading(true);
        try {
            const { error } = await signUp(email, password, {
                data: {
                    full_name: fullName,
                    phone: phone,
                    restaurant_name: restaurantName,
                    module_type: moduleType,
                    selected_plan: selectedPlan,
                    business_sector: 'restaurant'
                }
            });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 6000);
        } catch (err) {
            setError('Falha ao efectuar o registo: ' + err.message);
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0D0B09] font-sans">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/10 blur-[120px]"></div>
                </div>

                <div className="relative z-10 p-12 bg-[#14110E]/90 backdrop-blur-3xl border border-[#D4AF37]/20 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full animate-fade-in-up">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-2xl shadow-[#D4AF37]/20">
                        <CheckCircle size={48} className="text-black" />
                    </div>
                    <h2 className="text-3xl font-serif font-black text-white mb-4">Pedido Recebido!</h2>
                    <div className="space-y-4">
                        <p className="text-gray-400 leading-relaxed">
                            A conta do seu restaurante está a aguardar <strong className="text-white">activação da nossa equipa</strong>. Entraremos em contacto brevemente via WhatsApp.
                        </p>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest">Próximo Passo</p>
                            <p className="text-white text-sm mt-1">Fique atento ao seu telemóvel.</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-10 font-mono tracking-widest uppercase">Redireccionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#0D0B09] font-sans selection:bg-[#D4AF37] selection:text-black relative">
            
            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 z-20">
                <button
                    onClick={() => navigate('/')}
                    className="p-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:border-[#D4AF37]/50 text-white hover:text-[#D4AF37] transition-all flex items-center justify-center shadow-lg cursor-pointer"
                    title="Voltar ao Início"
                >
                    <ArrowLeft size={18} />
                </button>
            </div>
            
            {/* Left Side: Visual & Value Prop (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-white/5">
                <div className={`absolute inset-0 transition-transform duration-[20s] ease-linear transform ${mounted ? 'scale-110' : 'scale-100'}`}>
                    <img
                        src="https://images.unsplash.com/photo-1550966841-3ee4ad6c10d3?q=80&w=2070&auto=format&fit=crop"
                        alt="Ambiente de Restaurante"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0D0B09] via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0B09] via-transparent to-transparent"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-between p-20 w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center p-2">
                             <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white font-serif font-black text-xl tracking-tighter">Menús <span className="text-[#D4AF37]">Jindungo</span></span>
                    </div>

                    <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-6">
                             <Award size={12} /> 100% Especializado em Restauração
                        </div>
                        <h1 className="text-5xl font-serif font-black text-white leading-tight mb-5">
                            Modernize o seu <span className="text-[#D4AF37]">Restaurante</span>.
                        </h1>
                        <p className="text-base text-gray-300 leading-relaxed font-light mb-6">
                            Menu Digital QR interactivo, Terminais separados para Garçom e Cozinha (KDS), Rastreio ao Vivo de Mesa, Take-Away e Entrega, e Facturação Electrónica Certificada pela AGT.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                            <FileCheck size={15} /> Certificado Oficial AGT N.º FE/305/AGT/2026
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        <div className="flex flex-col">
                            <span className="text-[#D4AF37] font-black text-2xl">15.000 Kz</span>
                            <span className="text-gray-400 text-xs uppercase tracking-widest">Plano Start</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#D4AF37] font-black text-2xl">25.000 Kz</span>
                            <span className="text-gray-400 text-xs uppercase tracking-widest">Business / POS AGT</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#D4AF37] font-black text-2xl">40.000 Kz</span>
                            <span className="text-gray-400 text-xs uppercase tracking-widest">Corporate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                <div className="lg:hidden absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/5 blur-[100px]"></div>
                </div>

                <div className={`w-full max-w-[500px] relative z-10 transition-all duration-1000 transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    
                    <div className="bg-[#14110E]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">
                        
                        <div className="mb-8 lg:hidden text-center">
                             <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-16 h-16 mx-auto mb-3" />
                             <h2 className="text-2xl font-serif font-black text-white">Registar Restaurante</h2>
                        </div>

                        <div className="hidden lg:block mb-8">
                             <h2 className="text-3xl font-serif font-black text-white mb-1.5">Solicitar Adesão</h2>
                             <p className="text-gray-400 text-sm">Preencha os dados do seu restaurante para começar.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-300 flex items-center gap-3">
                                    <Shield size={16} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                        <ChefHat size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                        placeholder="Nome do seu Restaurante, Café ou Esplanada"
                                        value={restaurantName}
                                        onChange={(e) => setRestaurantName(e.target.value)}
                                    />
                                </div>

                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                        <Utensils size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                        placeholder="Nome completo do Proprietário / Responsável"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                            <Smartphone size={18} />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                            placeholder="Telemóvel / WhatsApp"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                            placeholder="Correio Electrónico"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                            placeholder="Palavra-passe"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>

                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                            placeholder="Confirmar senha"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {password && (
                                    <div className="space-y-1.5 px-1 select-none">
                                        <div className="flex justify-between items-center text-[10px] font-black tracking-wider uppercase">
                                            <span className="text-gray-500">Segurança da Palavra-passe</span>
                                            <span className={
                                                getPasswordStrength(password).score === 1 ? 'text-red-400' :
                                                getPasswordStrength(password).score === 2 ? 'text-yellow-400' : 'text-green-400'
                                            }>
                                                {getPasswordStrength(password).text}
                                            </span>
                                        </div>
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ${getPasswordStrength(password).color}`}></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Escolha do Plano Actualizado */}
                            <div className="space-y-2.5 pt-2">
                                <label className="text-xs font-black text-gray-300 uppercase tracking-widest block">
                                    Seleccione o Plano Pretendido
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        { id: 'start', name: 'Plano Start', price: '15.000 Kz/mês', desc: 'Menu QR + Pedidos WhatsApp' },
                                        { id: 'business', name: 'Plano Business', price: '25.000 Kz/mês', desc: 'Salão, Cozinha KDS + Rastreio' },
                                        { id: 'corporate', name: 'Plano Corporate', price: '40.000 Kz/mês', desc: 'Completo + Facturação AGT' },
                                        { id: 'billing_only', name: 'Facturação POS AGT', price: '25.000 Kz/mês', desc: 'Certificado FE/305/AGT/2026' }
                                    ].map((plan) => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                selectedPlan === plan.id
                                                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-black text-white">{plan.name}</h4>
                                                    {selectedPlan === plan.id && <CheckCircle size={13} className="text-[#D4AF37]" />}
                                                </div>
                                                <p className="text-xs font-black text-[#D4AF37] mt-1">{plan.price}</p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">{plan.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full group relative overflow-hidden py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-[#D4AF37]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
                            >
                                <span className="relative flex items-center justify-center gap-2">
                                    {isLoading ? 'A processar...' : 'Solicitar Adesão do Restaurante'}
                                </span>
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-400">
                                Já tem conta activa? {' '}
                                <Link to="/login" className="text-[#D4AF37] font-bold hover:underline">
                                    Entrar no Painel
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
