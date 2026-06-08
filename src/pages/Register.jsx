import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ChefHat, Utensils, CheckCircle, Smartphone, Mail, Award, Lock, ArrowLeft } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
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
            return setError('As senhas não coincidem');
        }

        if (password.length < 6) {
            return setError('A senha deve ter pelo menos 6 caracteres');
        }

        if (!fullName || !phone || !restaurantName) {
            return setError('Por favor, preencha todos os campos.');
        }

        setError('');
        setIsLoading(true);
        try {
            const { error } = await signUp(email, password, {
                data: {
                    full_name: fullName,
                    phone: phone,
                    restaurant_name: restaurantName
                }
            });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 6000);
        } catch (err) {
            setError('Falha ao registar: ' + err.message);
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0A0A0A] font-sans">
                {/* Background Refraction */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/10 blur-[120px]"></div>
                </div>

                <div className="relative z-10 p-12 bg-[#111111]/90 backdrop-blur-3xl border border-[#D4AF37]/20 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full animate-fade-in-up">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-2xl shadow-[#D4AF37]/20">
                        <CheckCircle size={48} className="text-black" />
                    </div>
                    <h2 className="text-3xl font-serif font-black text-white mb-4">Pedido Recebido!</h2>
                    <div className="space-y-4">
                        <p className="text-gray-400 leading-relaxed">
                            A sua conta está a aguardar <strong className="text-white">aprovação da nossa equipa</strong>. Entraremos em contacto brevemente via WhatsApp.
                        </p>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest">Próximo Passo</p>
                            <p className="text-white text-sm mt-1">Fique atento ao seu telefone.</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-10 font-mono tracking-widest uppercase">Redirecionando para login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#0A0A0A] font-sans selection:bg-[#D4AF37] selection:text-black relative">
            
            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 z-20">
                <button
                    onClick={() => navigate('/')}
                    className="p-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:border-[#D4AF37]/50 text-white hover:text-[#D4AF37] transition-all flex items-center justify-center shadow-lg"
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
                        alt="Restaurant Ambience"
                        className="w-full h-full object-cover opacity-60 grayscale-[0.2]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-between p-20 w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center p-2">
                             <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white font-serif font-black text-xl tracking-tighter">Menús <span className="text-[#D4AF37]">Jindungo</span></span>
                    </div>

                    <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-8">
                             <Award size={12} /> Líder em Ementas Digitais
                        </div>
                        <h1 className="text-6xl font-serif font-black text-white leading-tight mb-6">
                            Transforme o seu <span className="text-[#D4AF37]">Restaurante</span>.
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed font-light">
                            Junte-se a dezenas de estabelecimentos que já modernizaram o atendimento com a plataforma Menús Jindungo.
                        </p>
                    </div>

                    <div className="flex items-center gap-10">
                        <div className="flex flex-col">
                            <span className="text-white font-black text-2xl">99.9%</span>
                            <span className="text-gray-500 text-xs uppercase tracking-widest">Uptime</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black text-2xl">+50</span>
                            <span className="text-gray-500 text-xs uppercase tracking-widest">Restaurantes</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black text-2xl">24/7</span>
                            <span className="text-gray-500 text-xs uppercase tracking-widest">Suporte</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Background glow for mobile */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/5 blur-[100px]"></div>
                </div>

                <div className={`w-full max-w-[480px] relative z-10 transition-all duration-1000 transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    
                    <div className="bg-[#111111]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl">
                        
                        <div className="mb-10 lg:hidden text-center">
                             <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-16 h-16 mx-auto mb-4" />
                             <h2 className="text-2xl font-serif font-black text-white">Criar Conta</h2>
                        </div>

                        <div className="hidden lg:block mb-10">
                             <h2 className="text-3xl font-serif font-black text-white mb-2">Solicitar Adesão</h2>
                             <p className="text-gray-500 text-sm">Preencha os dados do seu negócio para começar.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-300 animate-shake flex items-center gap-3">
                                    <Shield size={16} /> {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-4">
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                            <ChefHat size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                            placeholder="Nome do seu Restaurante"
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
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                            placeholder="Seu nome completo"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="relative group/field">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                                <Smartphone size={18} />
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                                placeholder="WhatsApp"
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
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                                placeholder="E-mail"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                            placeholder="Escolha uma palavra-passe"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/field:text-[#D4AF37] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all text-sm"
                                            placeholder="Confirme a palavra-passe"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full group relative overflow-hidden py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-[#D4AF37]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <span className="position-relative flex items-center justify-center gap-2">
                                    {isLoading ? 'A processar...' : 'Começar Agora'}
                                </span>
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-500">
                                Já é membro? {' '}
                                <Link to="/login" className="text-white font-bold hover:text-[#D4AF37] transition-all underline underline-offset-4 decoration-[#D4AF37]/40">
                                    Fazer Login
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-6 opacity-30 grayscale pointer-events-none">
                         <div className="text-[10px] text-white font-black tracking-widest uppercase">Segurança Ponta-a-Ponta</div>
                         <Shield size={12} className="text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
