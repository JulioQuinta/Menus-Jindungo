import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
    QrCode, Download, AlertTriangle, Printer, TrendingUp, Sparkles, 
    Maximize2, Check, ChevronRight, ChevronLeft, Sliders, Table, 
    Layers, Info, ExternalLink, Share2, Copy, BarChart2, Sparkle
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, Tooltip 
} from 'recharts';
import { toast } from 'react-hot-toast';

const QRCodeGenerator = ({ url = "https://menusjindungo.com/menu/demo", restaurantName = "Restaurante Jindungo", logoUrl }) => {
    const qrRef = useRef();
    const acrylicQrRef = useRef();
    const stickerQrRef = useRef();
    const [tableNumber, setTableNumber] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [showMetrics, setShowMetrics] = useState(true);
    const [activeMockup, setActiveMockup] = useState('acrylic'); // 'acrylic' | 'sticker'
    const [activeAiTip, setActiveAiTip] = useState(0);

    // Generate URL with optional table parameter
    const finalUrl = tableNumber ? `${url}?mesa=${tableNumber}` : url;
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
    const qrLogoSrc = logoUrl || '/jindungo_icon.png';

    const downloadQRCode = (specificRef = qrRef, filenameSuffix = '') => {
        try {
            const canvas = specificRef.current?.querySelector('canvas');
            if (!canvas) {
                toast.error("Erro ao localizar o canvas do QR Code.");
                return;
            }
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `${restaurantName.replace(/\s+/g, '_')}_${tableNumber ? `Mesa_${tableNumber}` : 'Geral'}${filenameSuffix}_QR.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("QR Code baixado em alta resolução!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao gerar download do QR Code.");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(finalUrl);
        setIsCopied(true);
        toast.success("Link copiado para a área de transferência!");
        setTimeout(() => setIsCopied(false), 2500);
    };

    // Recharts Demo Metrics for QR Scans
    const weeklyScansData = [
        { day: 'Seg', leituras: 140 },
        { day: 'Ter', leituras: 210 },
        { day: 'Qua', leituras: 180 },
        { day: 'Qui', leituras: 290 },
        { day: 'Sex', leituras: 480 },
        { day: 'Sáb', leituras: 620 },
        { day: 'Dom', leituras: 510 },
    ];

    const hourlyScansData = [
        { hour: '11h', scans: 45 }, { hour: '12h', scans: 120 }, { hour: '13h', scans: 145 }, 
        { hour: '14h', scans: 90 }, { hour: '18h', scans: 110 }, { hour: '19h', scans: 180 }, 
        { hour: '20h', scans: 240 }, { hour: '21h', scans: 210 }, { hour: '22h', scans: 130 },
    ];

    // AI Tips for Printing
    const aiTips = [
        { title: "Tamanho Ideal para Mesas", desc: "Recomendamos impressão mínima de 7x7 cm para displays acrílicos e 5x5 cm para autocolantes, garantindo foco ultrarrápido em ambientes com pouca luz.", badge: "Dimensões" },
        { title: "Materiais de Alta Durabilidade", desc: "Utilize PVC fosco ou acrílico antirreflexo. Superfícies brilhantes ou plastificadas refletem luzes de teto e dificultam a leitura da câmara dos clientes.", badge: "Material" },
        { title: "Contraste e Borda de Segurança", desc: "Mantenha sempre uma margem branca de 3 a 5 milímetros em torno do QR Code para que leitores antigos calibrem o contraste instantaneamente.", badge: "Design" }
    ];

    useEffect(() => {
        const interval = setInterval(() => { setActiveAiTip((prev) => (prev + 1) % aiTips.length); }, 12000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-white font-sans max-w-[1600px] mx-auto">
            
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-[#181818]/95 via-[#141414]/95 to-[#101010]/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 blur-[90px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                <div className="z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                            WORKSPACE &gt; ACESSO DIGITAL
                        </span>
                        <span className="text-gray-400 text-xs flex items-center gap-1 font-mono">
                            <Sparkles size={12} className="text-amber-400 animate-spin" /> Alta Resolução 300 DPI
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                        Gerador de QR Code &amp; Maquetes
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Gere códigos inteligentes para mesas específicas e simule a impressão em materiais premium.
                    </p>
                </div>

                <div className="flex items-center gap-4 z-10 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setShowMetrics(!showMetrics)}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black px-5 py-3.5 rounded-2xl transition-all flex items-center gap-2 text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-md"
                    >
                        <BarChart2 size={16} className="text-[#D4AF37]" />
                        <span>{showMetrics ? 'Ocultar Métricas' : 'Métricas de Acesso'}</span>
                    </button>
                </div>
            </div>

            {/* Main Layout: Left = Generator + Mockups, Right = Collapsible Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Area (Cols 12 or 8 depending on showMetrics) */}
                <div className={`${showMetrics ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8 transition-all duration-500`}>
                    
                    {/* Pilar 1: Central Card (Glassmorphism & Neon Glow) */}
                    <div className="bg-gradient-to-br from-[#1E1E24]/95 via-[#16161A]/95 to-[#0E0E12]/95 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-amber-500/30 shadow-[0_20px_70px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        {/* Radial Neon Glow behind QR */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 blur-[100px] rounded-full pointer-events-none z-0" />

                        {/* Dark Amber Localhost Banner replacing ugly warning */}
                        {isLocalhost && (
                            <div className="relative z-10 mb-8 bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border border-amber-500/40 rounded-2xl p-4 text-amber-200 text-xs font-medium shadow-lg flex items-center gap-3 backdrop-blur-md animate-pulse">
                                <AlertTriangle size={20} className="text-amber-400 shrink-0" />
                                <div>
                                    <span className="font-bold text-amber-300 uppercase tracking-wide">Aviso de Teste Local:</span> O link gerado aponta para o endereço <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-400 font-mono">localhost</code>. Para leitura via telemóvel na rede, configure o IP da máquina ou utilize o domínio de produção.
                                </div>
                            </div>
                        )}

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            
                            {/* Left Side of Card: QR Code Container with Golden Border */}
                            <div className="flex flex-col items-center gap-3 shrink-0">
                                <div className="p-1 rounded-3xl bg-gradient-to-tr from-[#EAB308] via-yellow-300 to-amber-600 shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.5)] transition-all duration-500 group">
                                    <div ref={qrRef} className="p-5 bg-white rounded-[1.35rem] shadow-inner flex items-center justify-center transition-transform group-hover:scale-[1.02] duration-300">
                                        <QRCodeCanvas
                                            value={finalUrl}
                                            size={240}
                                            level={"H"}
                                            includeMargin={true}
                                            imageSettings={{
                                                src: qrLogoSrc,
                                                height: logoUrl ? 50 : 38,
                                                width: logoUrl ? 50 : 38,
                                                excavate: true,
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <QrCode size={12} /> {tableNumber ? `MESA ${tableNumber}` : 'GERAL ULTRA HD'}
                                </span>
                            </div>

                            {/* Right Side of Card: Configuration & Actions */}
                            <div className="flex-1 w-full space-y-6">
                                <div>
                                    <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-black">Personalização Direta</span>
                                    <h3 className="text-2xl font-serif font-black text-white tracking-tight mt-1">
                                        {tableNumber ? `QR Code da Mesa ${tableNumber}` : 'QR Code Geral de Acesso'}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                        Os clientes que escanearem este código acederão imediatamente à ementa digital otimizada.
                                    </p>
                                </div>

                                {/* Table Input with Focus Micro-animation */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center justify-between">
                                        <span>Número da Mesa Específica</span>
                                        <span className="text-gray-500 font-mono font-normal">Opcional</span>
                                    </label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:scale-125 transition-transform duration-300 font-bold">
                                            <Table size={18} />
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="Ex: 12 (Deixe em branco para código geral)"
                                            value={tableNumber}
                                            onChange={(e) => setTableNumber(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-black/60 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308] outline-none transition-all text-white font-bold text-sm shadow-inner"
                                        />
                                    </div>
                                </div>

                                {/* Link Output & Copy */}
                                <div className="flex items-center gap-2 bg-black/50 border border-white/10 p-3 rounded-2xl text-xs font-mono text-gray-300 shadow-inner">
                                    <span className="truncate flex-1 text-[#EAB308] pl-1">{finalUrl}</span>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-2 bg-white/10 hover:bg-[#D4AF37] hover:text-black rounded-xl text-white transition-colors flex items-center gap-1 shrink-0 font-sans font-bold text-[11px] cursor-pointer"
                                        title="Copiar Link"
                                    >
                                        {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                                    </button>
                                </div>

                                {/* Premium Golden Download Button */}
                                <button
                                    onClick={() => downloadQRCode(qrRef)}
                                    className="w-full py-4 bg-gradient-to-r from-[#F5C542] via-[#EAC775] to-[#D4AF37] text-gray-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_45px_rgba(234,179,8,0.6)] hover:brightness-110 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
                                >
                                    <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                                    <span>Baixar QR Code {tableNumber ? `(Mesa ${tableNumber})` : 'Geral'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pilar 2: Visual Print Mockups (Maquetes de Impressão) */}
                    <div className="bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                            <div>
                                <span className="text-xs font-mono text-[#D4AF37] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Printer size={14} /> Pré-visualização Realista
                                </span>
                                <h3 className="text-xl font-serif font-bold text-white mt-1">Maquetes de Impressão para o Salão</h3>
                            </div>

                            {/* Mockup Switcher */}
                            <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10">
                                <button
                                    onClick={() => setActiveMockup('acrylic')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                        activeMockup === 'acrylic' 
                                            ? 'bg-[#D4AF37] text-black shadow-lg font-black' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <span>🏢 Display Acrílico</span>
                                </button>
                                <button
                                    onClick={() => setActiveMockup('sticker')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                        activeMockup === 'sticker' 
                                            ? 'bg-[#D4AF37] text-black shadow-lg font-black' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <span>🔴 Autocolante Redondo</span>
                                </button>
                            </div>
                        </div>

                        {/* Interactive Display Area */}
                        <div className="bg-gradient-to-b from-[#1C1C20] to-[#121215] rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

                            {activeMockup === 'acrylic' ? (
                                /* Acrylic Stand Mockup */
                                <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                                    {/* Acrylic Plate */}
                                    <div className="w-64 h-84 rounded-t-3xl bg-gradient-to-b from-white/15 via-white/10 to-black/40 backdrop-blur-md border-2 border-white/30 p-6 flex flex-col items-center justify-between shadow-[0_25px_50px_rgba(0,0,0,0.8)] relative z-10">
                                        <div className="absolute top-2 left-2 right-2 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                        
                                        <div className="text-center space-y-1">
                                            <h4 className="font-serif font-black text-[#EAB308] tracking-wider text-base">{restaurantName}</h4>
                                            <p className="text-[10px] font-mono tracking-widest text-white uppercase font-bold">EMENTA DIGITAL</p>
                                        </div>

                                        {/* QR inside acrylic */}
                                        <div ref={acrylicQrRef} className="p-3 bg-white rounded-2xl shadow-xl">
                                            <QRCodeCanvas
                                                value={finalUrl} size={150} level={"H"} includeMargin={false}
                                                imageSettings={{ src: qrLogoSrc, height: 30, width: 30, excavate: true }}
                                            />
                                        </div>

                                        <div className="text-center space-y-1 w-full bg-black/40 py-2 px-3 rounded-xl border border-white/10">
                                            <span className="text-[10px] font-bold text-gray-300 flex items-center justify-center gap-1">
                                                <span>Aponte a câmara do telemóvel</span>
                                            </span>
                                            {tableNumber && <span className="text-xs font-mono font-black text-[#EAB308]">MESA {tableNumber}</span>}
                                        </div>
                                    </div>

                                    {/* Wooden / Golden Stand Base */}
                                    <div className="w-72 h-8 bg-gradient-to-r from-[#886E1B] via-[#D4AF37] to-[#886E1B] rounded-b-2xl shadow-[0_15px_30px_rgba(212,175,55,0.4)] relative z-20 border-t border-yellow-200 flex items-center justify-center">
                                        <div className="w-20 h-1 bg-black/30 rounded-full" />
                                    </div>

                                    <button 
                                        onClick={() => downloadQRCode(acrylicQrRef, '_Acrilico')}
                                        className="mt-6 z-20 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                                    >
                                        <Download size={14} className="text-[#EAB308]" /> Baixar Imagem da Maquete Acrílica
                                    </button>
                                </div>
                            ) : (
                                /* Round Sticker Mockup */
                                <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-72 h-72 rounded-full bg-gradient-to-br from-[#1A1A1E] via-[#24242A] to-[#121216] border-4 border-[#EAB308] p-6 flex flex-col items-center justify-between shadow-[0_25px_60px_rgba(234,179,8,0.25)] relative z-10 group">
                                        <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />

                                        <div className="text-center">
                                            <span className="text-[10px] font-black tracking-widest text-[#EAB308] uppercase font-mono">SCAN TO ORDER</span>
                                        </div>

                                        {/* QR inside sticker */}
                                        <div ref={stickerQrRef} className="p-3.5 bg-white rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                            <QRCodeCanvas
                                                value={finalUrl} size={140} level={"H"} includeMargin={false}
                                                imageSettings={{ src: qrLogoSrc, height: 28, width: 28, excavate: true }}
                                            />
                                        </div>

                                        <div className="text-center">
                                            <span className="text-xs font-serif font-bold text-white block">{restaurantName}</span>
                                            {tableNumber && <span className="text-[11px] font-mono font-black text-amber-400">Mesa {tableNumber}</span>}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => downloadQRCode(stickerQrRef, '_Autocolante')}
                                        className="mt-8 z-20 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                                    >
                                        <Download size={14} className="text-[#EAB308]" /> Baixar Imagem do Autocolante Redondo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pilar 3: Painel de Insights e Métricas (AI Business Assistant) */}
                {showMetrics && (
                    <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        
                        {/* Metrics Card */}
                        <div className="bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2 tracking-wide">
                                        <BarChart2 className="text-[#D4AF37]" size={20} /> Métricas de Acesso
                                    </h3>
                                    <p className="text-xs text-gray-400">Dados de leituras de QR nos últimos 7 dias</p>
                                </div>
                                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono font-bold">
                                    +18.4%
                                </span>
                            </div>

                            {/* Weekly Scans Area Chart */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-bold">Total de Leituras da Semana</span>
                                    <span className="text-white font-mono font-black text-sm text-[#EAB308]">2,430 Scans</span>
                                </div>
                                <div className="h-40 w-full pt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={weeklyScansData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.6} />
                                                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="day" stroke="#666" fontSize={10} tickLine={false} />
                                            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#EAB308', borderRadius: '12px', fontSize: '12px' }} />
                                            <Area type="monotone" dataKey="leituras" stroke="#EAB308" strokeWidth={2.5} fill="url(#scansGrad)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Peak Scanning Hours Bar Chart */}
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-bold">Horários de Maior Escaneamento</span>
                                    <span className="text-blue-400 font-mono font-bold">Pico às 20h</span>
                                </div>
                                <div className="h-40 w-full pt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={hourlyScansData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                                            <XAxis dataKey="hour" stroke="#666" fontSize={9} tickLine={false} />
                                            <YAxis stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#3B82F6', borderRadius: '12px', fontSize: '12px' }} />
                                            <Bar dataKey="scans" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* AI Tips for Printing */}
                        <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-[2.5rem] p-7 shadow-[0_0_40px_rgba(212,175,55,0.2)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                            <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] text-gray-950 flex items-center justify-center font-black shadow-[0_0_20px_rgba(212,175,55,0.4)] shrink-0">
                                        <Sparkle size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-serif font-black text-white text-base tracking-wide">Dicas da IA para Impressão</h3>
                                        <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase font-mono">Conselheiro de Design</span>
                                    </div>
                                </div>
                                <span className="flex h-2 w-2 relative shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
                                </span>
                            </div>

                            {/* Rotating AI Tips */}
                            <div className="space-y-4 relative z-10">
                                {aiTips.map((tip, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setActiveAiTip(idx)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                            idx === activeAiTip 
                                                ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                                                : 'bg-black/40 border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h4 className="font-serif font-bold text-white text-xs">
                                                {tip.title}
                                            </h4>
                                            <span className="text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30 font-mono">
                                                {tip.badge}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-300 leading-relaxed font-sans line-clamp-3">
                                            {tip.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRCodeGenerator;
