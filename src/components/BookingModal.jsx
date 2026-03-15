import React, { useState } from 'react';
import { X, Calendar, Users, Clock, Send, CheckCircle2, Phone, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const BookingModal = ({ isOpen, onClose, restaurantId, restaurantName }) => {
    const [step, setStep] = useState(1); // 1: Info, 2: Contacts, 3: Success
    const [bookingData, setBookingData] = useState({
        customer_name: '',
        customer_phone: '',
        num_people: 2,
        num_tables: 1,
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '20:00',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('reservations')
                .insert([{
                    restaurant_id: restaurantId,
                    ...bookingData
                }]);

            if (error) throw error;
            setStep(3);
        } catch (error) {
            console.error('Error saving reservation:', error);
            toast.error("Erro ao solicitar reserva. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
            <div className="bg-[#121212] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent pointer-events-none" />
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="text-[#D4AF37]" size={20} />
                            Reservar Mesa
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">Reserve no {restaurantName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                        <Calendar size={12} /> Data
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                        value={bookingData.reservation_date}
                                        onChange={(e) => setBookingData({ ...bookingData, reservation_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                        <Clock size={12} /> Hora
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                        value={bookingData.reservation_time}
                                        onChange={(e) => setBookingData({ ...bookingData, reservation_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                        <Users size={12} /> Pessoas
                                    </label>
                                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setBookingData({ ...bookingData, num_people: Math.max(1, bookingData.num_people - 1) })}
                                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold hover:bg-white/10 active:scale-95 active:bg-[#D4AF37]/20 transition-all text-white border border-white/5 active:border-[#D4AF37]/40 shadow-inner"
                                        >-</button>
                                        <span className="flex-1 text-center font-black text-xl text-white tabular-nums">{bookingData.num_people}</span>
                                        <button
                                            type="button"
                                            onClick={() => setBookingData({ ...bookingData, num_people: bookingData.num_people + 1 })}
                                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold hover:bg-white/10 active:scale-110 active:bg-[#D4AF37]/20 transition-all text-white border border-white/5 active:border-[#D4AF37]/40 shadow-lg active:shadow-[#D4AF37]/20"
                                        >+</button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="m5 8 14 0" /><path d="m5 16 14 0" /></svg> Mesas
                                    </label>
                                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setBookingData({ ...bookingData, num_tables: Math.max(1, bookingData.num_tables - 1) })}
                                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold hover:bg-white/10 active:scale-95 active:bg-[#D4AF37]/20 transition-all text-white border border-white/5 active:border-[#D4AF37]/40 shadow-inner"
                                        >-</button>
                                        <span className="flex-1 text-center font-black text-xl text-white tabular-nums">{bookingData.num_tables}</span>
                                        <button
                                            type="button"
                                            onClick={() => setBookingData({ ...bookingData, num_tables: bookingData.num_tables + 1 })}
                                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold hover:bg-white/10 active:scale-110 active:bg-[#D4AF37]/20 transition-all text-white border border-white/5 active:border-[#D4AF37]/40 shadow-lg active:shadow-[#D4AF37]/20"
                                        >+</button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-2xl shadow-lg hover:shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                Continuar <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <User size={12} /> Nome Completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Como devemos chamar-lhe?"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                    value={bookingData.customer_name}
                                    onChange={(e) => setBookingData({ ...bookingData, customer_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Phone size={12} /> Telemóvel / WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="Para confirmar o seu lugar"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                    value={bookingData.customer_phone}
                                    onChange={(e) => setBookingData({ ...bookingData, customer_phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    Observações (Opcional)
                                </label>
                                <textarea
                                    placeholder="Ex: Aniversário, lugar calmo, alergias..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none min-h-[80px]"
                                    value={bookingData.notes}
                                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-white/5 text-gray-400 font-bold py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] bg-[#D4AF37] text-black font-bold py-4 rounded-2xl shadow-lg hover:shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Poder d@ Jindungo...' : <><Send size={18} /> Solicitar Reserva</>}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="text-center py-10 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                                <CheckCircle2 className="text-green-500" size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Pedido Enviado!</h3>
                            <p className="text-gray-400 mb-8 max-w-[250px] mx-auto text-sm">
                                O seu pedido de reserva foi enviado. O restaurante entrará em contacto para confirmar.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full bg-white/5 text-white font-bold py-4 rounded-2xl border border-white/10 hover:bg-[#D4AF37] hover:text-black transition-all"
                            >
                                Fechar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper components for icons not imported
const ChevronRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

export default BookingModal;
