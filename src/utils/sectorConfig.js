// ====================================================================
// CONFIGURAÇÃO DOS SECTORES DE NEGÓCIO UNIVERSAIS (PRESETS ERP AGT)
// Suporta todo o tipo de atividade comercial, industrial e de serviços onde a faturação é obrigatória pela AGT
// ====================================================================

export const SECTORS = {
    RETAIL: 'retail',
    SUPERMARKET: 'supermarket',
    WHOLESALE: 'wholesale',
    BAKERY: 'bakery',
    RESTAURANT: 'restaurant',
    PHARMACY: 'pharmacy',
    HEALTH_MEDICAL: 'health_medical',
    EDUCATION: 'education',
    HOTEL: 'hotel',
    AUTOMOTIVE: 'automotive',
    CONSTRUCTION_REALESTATE: 'construction_realestate',
    BEAUTY_SPA: 'beauty_spa',
    TRANSPORT_LOGISTICS: 'transport_logistics',
    TECH_TELECOM: 'tech_telecom',
    CONSULTING_LEGAL: 'consulting_legal',
    AGRI_FISHERIES: 'agri_fisheries',
    EVENTS_MEDIA: 'events_media',
    SECURITY_CLEANING: 'security_cleaning',
    SERVICES: 'services'
};

export const SECTOR_PRESETS = [
    {
        id: SECTORS.RETAIL,
        name: 'Comércio & Retalho',
        icon: '🏪',
        iconName: 'Store',
        badge: 'Retalho',
        description: 'Lojas de Roupa, Calçado, Eletrónica, Conveniência e Lojas Comerciais',
        theme: {
            primary: '#3B82F6',
            secondary: '#2563EB',
            badgeBg: 'bg-blue-500/10',
            badgeText: 'text-blue-400',
            badgeBorder: 'border-blue-500/30',
            glow: 'rgba(59, 130, 246, 0.25)',
            glowCss: '0 0 25px rgba(59, 130, 246, 0.3)',
            gradient: 'from-blue-500 to-indigo-600',
            borderAccent: 'hover:border-blue-500/40',
            btnBg: 'bg-blue-500 text-white hover:bg-blue-400',
            activeTabBg: 'bg-blue-500/15 border-blue-500 text-blue-400'
        },
        terms: {
            establishment: 'Loja Comercial',
            item: 'Artigo / Produto',
            items: 'Artigos',
            sales: 'Vendas & POS',
            pos: 'Ponto de Venda (POS)',
            cashClosedTitle: 'Caixa da Loja Fechado',
            cashClosedSubtitle: 'Abra o turno de caixa para começar a faturar vendas no balcão e registar movimentações financeiras.',
            welcomeMessage: 'Gestão de vendas e controlo de stock de retalho em tempo real.',
            stockLabel: 'Stock de Produtos & Artigos',
            invoiceHeaderNote: 'Venda a retalho com faturação eletrónica certificada AGT.'
        },
        fields: {
            showBarcode: true,
            showUnit: true,
            showDiscount: true
        }
    },
    {
        id: SECTORS.SUPERMARKET,
        name: 'Supermercados, Talhos & Peixarias',
        icon: '🛒',
        iconName: 'ShoppingCart',
        badge: 'Supermercado',
        description: 'Supermercados, Minimercados, Talhos, Peixarias e Frutarias',
        theme: {
            primary: '#0284C7',
            secondary: '#0369A1',
            badgeBg: 'bg-sky-500/10',
            badgeText: 'text-sky-400',
            badgeBorder: 'border-sky-500/30',
            glow: 'rgba(2, 132, 199, 0.25)',
            glowCss: '0 0 25px rgba(2, 132, 199, 0.3)',
            gradient: 'from-sky-500 to-cyan-600',
            borderAccent: 'hover:border-sky-500/40',
            btnBg: 'bg-sky-500 text-white hover:bg-sky-400',
            activeTabBg: 'bg-sky-500/15 border-sky-500 text-sky-400'
        },
        terms: {
            establishment: 'Supermercado / Mercado',
            item: 'Produto / Código de Barras',
            items: 'Produtos de Consumo',
            sales: 'Caixa & Vendas',
            pos: 'Caixa Rápida POS',
            cashClosedTitle: 'Caixa do Supermercado Fechado',
            cashClosedSubtitle: 'Abra o turno de caixa para começar a passar produtos no leitor de código de barras e faturar clientes.',
            welcomeMessage: 'Vendas rápidas com código de barras, balança e faturação AGT.',
            stockLabel: 'Stock de Mercearia & Produtos',
            invoiceHeaderNote: 'Venda de supermercado a retalho com leitor de código de barras.'
        },
        fields: {
            showBarcode: true,
            showUnit: true,
            showDiscount: true,
            showExpiry: true
        }
    },
    {
        id: SECTORS.WHOLESALE,
        name: 'Venda por Grosso & Armazéns',
        icon: '📦',
        iconName: 'Package',
        badge: 'Grossista',
        description: 'Armazéns de Distribuição, Revendedores e Venda em Lote',
        theme: {
            primary: '#6366F1',
            secondary: '#4F46E5',
            badgeBg: 'bg-indigo-500/10',
            badgeText: 'text-indigo-400',
            badgeBorder: 'border-indigo-500/30',
            glow: 'rgba(99, 102, 241, 0.25)',
            glowCss: '0 0 25px rgba(99, 102, 241, 0.3)',
            gradient: 'from-indigo-500 to-blue-600',
            borderAccent: 'hover:border-indigo-500/40',
            btnBg: 'bg-indigo-500 text-white hover:bg-indigo-400',
            activeTabBg: 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
        },
        terms: {
            establishment: 'Armazém / Distribuidora',
            item: 'Produto / Lote',
            items: 'Artigos em Lote',
            sales: 'Faturação & Guias',
            pos: 'Emissão de Faturas',
            cashClosedTitle: 'Caixa do Armazém Fechado',
            cashClosedSubtitle: 'Abra o caixa para faturar vendas por grosso, emitir guias de transporte e gerir pagamentos de clientes.',
            welcomeMessage: 'Faturação eletrónica AGT e controlo de lotes para distribuição.',
            stockLabel: 'Stock de Armazém & Lotes',
            invoiceHeaderNote: 'Venda por grosso e distribuição comercial.'
        },
        fields: {
            showBatch: true,
            showUnit: true,
            showBarcode: true,
            showDiscount: true
        }
    },
    {
        id: SECTORS.BAKERY,
        name: 'Padarias & Pastarias',
        icon: '🍞',
        iconName: 'Coffee',
        badge: 'Padaria',
        description: 'Padarias, Confeitarias e Fabrico Próprio de Pão e Bolos',
        theme: {
            primary: '#F59E0B',
            secondary: '#D97706',
            badgeBg: 'bg-amber-500/10',
            badgeText: 'text-amber-400',
            badgeBorder: 'border-amber-500/30',
            glow: 'rgba(245, 158, 11, 0.25)',
            glowCss: '0 0 25px rgba(245, 158, 11, 0.3)',
            gradient: 'from-amber-500 to-orange-600',
            borderAccent: 'hover:border-amber-500/40',
            btnBg: 'bg-amber-500 text-black hover:bg-amber-400',
            activeTabBg: 'bg-amber-500/15 border-amber-500 text-amber-400'
        },
        terms: {
            establishment: 'Padaria / Pastaria',
            item: 'Produto / Fornada',
            items: 'Produtos de Pastaria',
            sales: 'Vendas de Balcão',
            pos: 'Caixa Balcão Rápido',
            cashClosedTitle: 'Caixa da Padaria Fechado',
            cashClosedSubtitle: 'Abra o turno de caixa para registar vendas diretas de balcão de pão, bolos e fornadas de fabrico próprio.',
            welcomeMessage: 'Vendas rápidas de balcão e faturação eletrónica certificada.',
            stockLabel: 'Stock de Ingredientes & Fornadas',
            invoiceHeaderNote: 'Fabrico próprio e venda ao balcão de padaria/pastelaria.'
        },
        fields: {
            showBatch: true,
            showUnit: true,
            showDiscount: true
        }
    },
    {
        id: SECTORS.RESTAURANT,
        name: 'Restauração, Bares & Catering',
        icon: '🍽️',
        iconName: 'ChefHat',
        badge: 'Restaurante',
        description: 'Restaurantes, Bares, Cafés, Lanchonetes, Fast Food e Catering',
        theme: {
            primary: '#D4AF37',
            secondary: '#E2B755',
            badgeBg: 'bg-[#D4AF37]/10',
            badgeText: 'text-[#D4AF37]',
            badgeBorder: 'border-[#D4AF37]/30',
            glow: 'rgba(212, 175, 55, 0.25)',
            glowCss: '0 0 25px rgba(212, 175, 55, 0.3)',
            gradient: 'from-[#D4AF37] to-[#F1C40F]',
            borderAccent: 'hover:border-[#D4AF37]/40',
            btnBg: 'bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black hover:brightness-110',
            activeTabBg: 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
        },
        terms: {
            establishment: 'Restaurante / Bar',
            item: 'Prato / Bebida',
            items: 'Ementa / Cardápio',
            sales: 'Pedidos & Faturas',
            pos: 'Caixa / POS Restaurante',
            cashClosedTitle: 'Turno de Caixa Fechado',
            cashClosedSubtitle: 'Abra o turno de caixa para começar a faturar pedidos no salão, mesas, take-away e entregas.',
            welcomeMessage: 'Gestão de ementa digital, pedidos de mesa e faturação eletrónica AGT.',
            stockLabel: 'Stock de Bebidas & Ingredientes',
            invoiceHeaderNote: 'Serviço de restauração e bebidas.'
        },
        fields: {
            showTableNumber: true,
            showWaiter: true
        }
    },
    {
        id: SECTORS.PHARMACY,
        name: 'Farmácias & Produtos de Saúde',
        icon: '💊',
        iconName: 'Pill',
        badge: 'Farmácia',
        description: 'Farmácias, Postos de Medicamentos e Ortopedias',
        theme: {
            primary: '#10B981',
            secondary: '#059669',
            badgeBg: 'bg-emerald-500/10',
            badgeText: 'text-emerald-400',
            badgeBorder: 'border-emerald-500/30',
            glow: 'rgba(16, 185, 129, 0.25)',
            glowCss: '0 0 25px rgba(16, 185, 129, 0.3)',
            gradient: 'from-emerald-500 to-teal-600',
            borderAccent: 'hover:border-emerald-500/40',
            btnBg: 'bg-emerald-500 text-black hover:bg-emerald-400',
            activeTabBg: 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
        },
        terms: {
            establishment: 'Farmácia / Posto de Saúde',
            item: 'Medicamento / Fármaco',
            items: 'Medicamentos & Produtos',
            sales: 'Dispensação & Vendas',
            pos: 'Caixa POS Farmácia',
            cashClosedTitle: 'Caixa da Farmácia Fechado',
            cashClosedSubtitle: 'Abra o turno de caixa para começar a dispensar medicamentos, processar receitas médicas e emitir faturas AGT.',
            welcomeMessage: 'Dispensação de medicamentos e faturação eletrónica AGT.',
            stockLabel: 'Stock de Medicamentos & Fármacos',
            invoiceHeaderNote: 'Dispensação de medicamentos sob controlo sanitário e lote.'
        },
        fields: {
            showBatch: true,
            showExpiry: true,
            showDosage: true,
            showPrescription: true,
            showHealthExemption: true
        }
    },
    {
        id: SECTORS.HEALTH_MEDICAL,
        name: 'Clínicas & Serviços Médicos',
        icon: '🩺',
        iconName: 'Activity',
        badge: 'Saúde & Clínicas',
        description: 'Clínicas Médicas, Consultórios, Laboratórios de Análises e Dentistas',
        theme: {
            primary: '#14B8A6',
            secondary: '#0D9488',
            badgeBg: 'bg-teal-500/10',
            badgeText: 'text-teal-400',
            badgeBorder: 'border-teal-500/30',
            glow: 'rgba(20, 184, 166, 0.25)',
            glowCss: '0 0 25px rgba(20, 184, 166, 0.3)',
            gradient: 'from-teal-500 to-emerald-600',
            borderAccent: 'hover:border-teal-500/40',
            btnBg: 'bg-teal-500 text-black hover:bg-teal-400',
            activeTabBg: 'bg-teal-500/15 border-teal-500 text-teal-400'
        },
        terms: {
            establishment: 'Clínica / Centro Médico',
            item: 'Consulta / Exame',
            items: 'Atos Médicos & Exames',
            sales: 'Faturação Médica',
            pos: 'Recepção / Faturação',
            cashClosedTitle: 'Caixa da Recepção Clínica Fechado',
            cashClosedSubtitle: 'Abra a tesouraria da clínica para faturar consultas médicas, exames de diagnóstico e tratamentos.',
            welcomeMessage: 'Faturação eletrónica de consultas, exames e serviços de saúde.',
            stockLabel: 'Stock de Consumíveis Clínicos',
            invoiceHeaderNote: 'Prestação de atos médicos e exames de diagnóstico.'
        },
        fields: {
            showDoctorName: true,
            showPatientName: true,
            showHealthExemption: true
        }
    },
    {
        id: SECTORS.EDUCATION,
        name: 'Educação, Colégios & Academias',
        icon: '🎓',
        iconName: 'BookOpen',
        badge: 'Educação',
        description: 'Colégios, Escolas, Universidades, Institutos e Centros de Formação',
        theme: {
            primary: '#8B5CF6',
            secondary: '#7C3AED',
            badgeBg: 'bg-purple-500/10',
            badgeText: 'text-purple-400',
            badgeBorder: 'border-purple-500/30',
            glow: 'rgba(139, 92, 246, 0.25)',
            glowCss: '0 0 25px rgba(139, 92, 246, 0.3)',
            gradient: 'from-purple-500 to-indigo-600',
            borderAccent: 'hover:border-purple-500/40',
            btnBg: 'bg-purple-500 text-white hover:bg-purple-400',
            activeTabBg: 'bg-purple-500/15 border-purple-500 text-purple-400'
        },
        terms: {
            establishment: 'Escola / Colégio',
            item: 'Propina / Serviço Escolar',
            items: 'Taxas & Mensalidades',
            sales: 'Faturação de Propinas',
            pos: 'Caixa Tesouraria',
            cashClosedTitle: 'Tesouraria Escolar Fechada',
            cashClosedSubtitle: 'Abra o caixa para cobrar propinas, inscrições, mensalidades e emissão de declarações académicas.',
            welcomeMessage: 'Faturação eletrónica de propinas, inscrições e mensalidades.',
            stockLabel: 'Stock de Material Escolar & Livros',
            invoiceHeaderNote: 'Emissão de recibo de propinas e serviços escolares.'
        },
        fields: {
            showStudentInfo: true,
            showMonthYear: true
        }
    },
    {
        id: SECTORS.HOTEL,
        name: 'Hotelaria & Alojamento',
        icon: '🏨',
        iconName: 'Building',
        badge: 'Hotelaria',
        description: 'Hotéis, Pousadas, Resorts, Motéis e Alojamento Local',
        theme: {
            primary: '#EC4899',
            secondary: '#DB2777',
            badgeBg: 'bg-pink-500/10',
            badgeText: 'text-pink-400',
            badgeBorder: 'border-pink-500/30',
            glow: 'rgba(236, 72, 153, 0.25)',
            glowCss: '0 0 25px rgba(236, 72, 153, 0.3)',
            gradient: 'from-pink-500 to-rose-600',
            borderAccent: 'hover:border-pink-500/40',
            btnBg: 'bg-pink-500 text-white hover:bg-pink-400',
            activeTabBg: 'bg-pink-500/15 border-pink-500 text-pink-400'
        },
        terms: {
            establishment: 'Hotel / Pousada',
            item: 'Quarto / Estadia',
            items: 'Alojamento & Consumos',
            sales: 'Estadias & Faturas',
            pos: 'Recepção / POS Hotel',
            cashClosedTitle: 'Caixa da Recepção Fechado',
            cashClosedSubtitle: 'Abra o turno da recepção para faturar estadias, diárias de quartos, consumos de minibar e serviços de quarto.',
            welcomeMessage: 'Faturação de estadias, diárias e consumos anexos.',
            stockLabel: 'Stock de Minibar & Amenities',
            invoiceHeaderNote: 'Prestação de serviços de alojamento turístico e hotelaria.'
        },
        fields: {
            showRoomNumber: true,
            showCheckInCheckOut: true,
            showGuestName: true
        }
    },
    {
        id: SECTORS.AUTOMOTIVE,
        name: 'Oficinas, Peças & Automóvel',
        icon: '🚗',
        iconName: 'Wrench',
        badge: 'Automóvel',
        description: 'Oficinas Mecânicas, Bate-Chapa, Stands de Automóveis, Peças e Lavagens',
        theme: {
            primary: '#F97316',
            secondary: '#EA580C',
            badgeBg: 'bg-orange-500/10',
            badgeText: 'text-orange-400',
            badgeBorder: 'border-orange-500/30',
            glow: 'rgba(249, 115, 22, 0.25)',
            glowCss: '0 0 25px rgba(249, 115, 22, 0.3)',
            gradient: 'from-orange-500 to-amber-600',
            borderAccent: 'hover:border-orange-500/40',
            btnBg: 'bg-orange-500 text-black hover:bg-orange-400',
            activeTabBg: 'bg-orange-500/15 border-orange-500 text-orange-400'
        },
        terms: {
            establishment: 'Oficina / Stand',
            item: 'Peça / Serviço Técnico',
            items: 'Peças & Manutenção',
            sales: 'Orçamentos & Faturas',
            pos: 'Faturação de Oficina',
            cashClosedTitle: 'Caixa da Oficina Fechado',
            cashClosedSubtitle: 'Abra o turno de caixa para registar pagamentos de reparações automóveis, peças e folhas de obra.',
            welcomeMessage: 'Faturação de peças, mão de obra mecânica e reparações.',
            stockLabel: 'Stock de Peças & Lubrificantes',
            invoiceHeaderNote: 'Serviço de manutenção automóvel e peças sobresselentes.'
        },
        fields: {
            showVehiclePlate: true,
            showMileage: true,
            showLaborVsParts: true
        }
    },
    {
        id: SECTORS.CONSTRUCTION_REALESTATE,
        name: 'Construção, Obras & Imobiliária',
        icon: '🏗️',
        iconName: 'Building',
        badge: 'Construção',
        description: 'Construtoras, Empreiteiros, Materiais de Construção e Imobiliárias',
        theme: {
            primary: '#84CC16',
            secondary: '#65A30D',
            badgeBg: 'bg-lime-500/10',
            badgeText: 'text-lime-400',
            badgeBorder: 'border-lime-500/30',
            glow: 'rgba(132, 204, 22, 0.25)',
            glowCss: '0 0 25px rgba(132, 204, 22, 0.3)',
            gradient: 'from-lime-500 to-emerald-600',
            borderAccent: 'hover:border-lime-500/40',
            btnBg: 'bg-lime-500 text-black hover:bg-lime-400',
            activeTabBg: 'bg-lime-500/15 border-lime-500 text-lime-400'
        },
        terms: {
            establishment: 'Empresa de Construção / Imobiliária',
            item: 'Serviço de Obra / Imóvel',
            items: 'Autos de Medição / Materiais',
            sales: 'Faturação de Obras',
            pos: 'Emissão de Faturas de Obra',
            cashClosedTitle: 'Caixa de Faturação de Obras Fechado',
            cashClosedSubtitle: 'Abra a tesouraria para registar adiantamentos, autos de medição e fornecimento de materiais de obra.',
            welcomeMessage: 'Faturação de autos de medição, adjudicações e materiais.',
            stockLabel: 'Stock de Materiais de Construção',
            invoiceHeaderNote: 'Emissão de fatura referente a autos de medição e obras.'
        },
        fields: {
            showContractRef: true,
            showMeasurementAct: true
        }
    },
    {
        id: SECTORS.BEAUTY_SPA,
        name: 'Beleza, Barba & Estética',
        icon: '✂️',
        iconName: 'Scissors',
        badge: 'Beleza & Estética',
        description: 'Salões de Beleza, Barbearias, Centros de Estética e Spas',
        theme: {
            primary: '#F43F5E',
            secondary: '#E11D48',
            badgeBg: 'bg-rose-500/10',
            badgeText: 'text-rose-400',
            badgeBorder: 'border-rose-500/30',
            glow: 'rgba(244, 63, 94, 0.25)',
            glowCss: '0 0 25px rgba(244, 63, 94, 0.3)',
            gradient: 'from-rose-500 to-pink-600',
            borderAccent: 'hover:border-rose-500/40',
            btnBg: 'bg-rose-500 text-white hover:bg-rose-400',
            activeTabBg: 'bg-rose-500/15 border-rose-500 text-rose-400'
        },
        terms: {
            establishment: 'Salão de Beleza / Barbearia',
            item: 'Serviço / Produto de Estética',
            items: 'Tratamentos & Cortes',
            sales: 'Atendimento & Caixa',
            pos: 'Caixa Salão',
            cashClosedTitle: 'Caixa do Salão Fechado',
            cashClosedSubtitle: 'Abra o turno de caixa para registar pagamentos de cortes, estéticas e venda de cosméticos.',
            welcomeMessage: 'Faturação rápida de serviços de estética, cortes e cosméticos.',
            stockLabel: 'Stock de Cosméticos & Champôs',
            invoiceHeaderNote: 'Prestação de serviços de beleza, estética e cabeleireiro.'
        },
        fields: {
            showProfessionalName: true,
            showDiscount: true
        }
    },
    {
        id: SECTORS.SERVICES,
        name: 'Serviços Gerais & Freelancers',
        icon: '💼',
        iconName: 'Briefcase',
        badge: 'Serviços Gerais',
        description: 'Prestadores de Serviços Individuais, Oficinas de Pequeno Porte e Outros Serviços',
        theme: {
            primary: '#06B6D4',
            secondary: '#0891B2',
            badgeBg: 'bg-cyan-500/10',
            badgeText: 'text-cyan-400',
            badgeBorder: 'border-cyan-500/30',
            glow: 'rgba(6, 182, 212, 0.25)',
            glowCss: '0 0 25px rgba(6, 182, 212, 0.3)',
            gradient: 'from-cyan-500 to-blue-600',
            borderAccent: 'hover:border-cyan-500/40',
            btnBg: 'bg-cyan-500 text-black hover:bg-cyan-400',
            activeTabBg: 'bg-cyan-500/15 border-cyan-500 text-cyan-400'
        },
        terms: {
            establishment: 'Empresa de Serviços / Profissional',
            item: 'Serviço Prestado',
            items: 'Serviços',
            sales: 'Faturação de Serviços',
            pos: 'Emissão de Faturas',
            cashClosedTitle: 'Caixa de Tesouraria Fechado',
            cashClosedSubtitle: 'Abra o turno para emitir faturas de prestação de serviços, proformas e gerir retenção na fonte IRT.',
            welcomeMessage: 'Faturação eletrónica universal para prestadores de serviços.',
            stockLabel: 'Catálogo de Serviços & Tabela',
            invoiceHeaderNote: 'Prestação de serviços profissionais gerais.'
        },
        fields: {
            showIrtRetention: true,
            showServiceDetails: true
        }
    }
];

export const getSectorDetails = (sectorId) => {
    const found = SECTOR_PRESETS.find(s => s.id === sectorId);
    return found || SECTOR_PRESETS.find(s => s.id === SECTORS.RESTAURANT) || SECTOR_PRESETS[0];
};

export const getSectorTheme = (sectorId) => {
    const details = getSectorDetails(sectorId);
    return details.theme;
};

export const getSectorCategoryIllustration = (label = '', sectorId = '') => {
    const l = String(label).toLowerCase();
    
    if (sectorId === SECTORS.PHARMACY || l.includes('medicamento') || l.includes('fármaco') || l.includes('receita') || l.includes('xarope') || l.includes('comprimido') || l.includes('vacina') || l.includes('farmácia')) {
        if (l.includes('receita') || l.includes('sujeito')) return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80';
        if (l.includes('mnsr') || l.includes('sem receita')) return 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80';
        if (l.includes('xarope') || l.includes('respirat') || l.includes('tosse')) return 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&q=80';
        if (l.includes('socorro') || l.includes('curativo') || l.includes('gaze') || l.includes('álcool')) return 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&q=80';
        if (l.includes('vitamina') || l.includes('suplemento') || l.includes('mineral')) return 'https://images.unsplash.com/photo-1550572017-edf792891f13?w=500&q=80';
        if (l.includes('bebé') || l.includes('infantil') || l.includes('puericultura') || l.includes('leite')) return 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&q=80';
        if (l.includes('cosmétic') || l.includes('cuidados') || l.includes('pele') || l.includes('solar')) return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80';
        if (l.includes('aparelho') || l.includes('dispositivo') || l.includes('medição') || l.includes('tensio')) return 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80';
        return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80';
    }

    if (sectorId === SECTORS.BAKERY || l.includes('pão') || l.includes('bolo') || l.includes('pastel') || l.includes('croissant') || l.includes('fornada')) {
        if (l.includes('pão') || l.includes('carcaça')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80';
        if (l.includes('croissant') || l.includes('folhado')) return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80';
        if (l.includes('pastel') || l.includes('doce') || l.includes('nata')) return 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=80';
        if (l.includes('bolo') || l.includes('aniversário')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80';
        return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80';
    }

    if (sectorId === SECTORS.SUPERMARKET || l.includes('mercearia') || l.includes('talho') || l.includes('lacticínio') || l.includes('supermercado')) {
        if (l.includes('mercearia') || l.includes('grão')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80';
        if (l.includes('talho') || l.includes('carne')) return 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&q=80';
        if (l.includes('leite') || l.includes('lacticínio')) return 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&q=80';
        if (l.includes('limpeza') || l.includes('detergente')) return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80';
        return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80';
    }

    if (sectorId === SECTORS.RETAIL || l.includes('vestuário') || l.includes('roupa') || l.includes('calçado') || l.includes('eletrónica')) {
        if (l.includes('roupa') || l.includes('vestuário')) return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80';
        if (l.includes('calçado') || l.includes('sapatilha')) return 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80';
        if (l.includes('eletrónic') || l.includes('gadget') || l.includes('cabo')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
        return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80';
    }

    if (sectorId === SECTORS.AUTOMOTIVE || l.includes('óleo') || l.includes('peça') || l.includes('oficina') || l.includes('travão')) {
        if (l.includes('óleo') || l.includes('lubrificante')) return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&q=80';
        if (l.includes('peça') || l.includes('travão') || l.includes('filtro')) return 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&q=80';
        if (l.includes('serviço') || l.includes('mão de obra')) return 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=500&q=80';
        return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&q=80';
    }

    if (sectorId === SECTORS.BEAUTY_SPA || l.includes('corte') || l.includes('barba') || l.includes('unha') || l.includes('estética')) {
        if (l.includes('cabelo') || l.includes('corte') || l.includes('barba')) return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80';
        if (l.includes('unha') || l.includes('manicure') || l.includes('pedicure')) return 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80';
        if (l.includes('cosmétic') || l.includes('champô')) return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80';
        return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80';
    }

    if (sectorId === SECTORS.HEALTH_MEDICAL || l.includes('consulta') || l.includes('exame') || l.includes('médic')) {
        if (l.includes('consulta') || l.includes('clínica')) return 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&q=80';
        if (l.includes('exame') || l.includes('análise')) return 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&q=80';
        return 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&q=80';
    }

    if (sectorId === SECTORS.SERVICES || l.includes('consultoria') || l.includes('serviço')) {
        return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80';
    }

    // Default Restaurant fallback
    if (l.includes('pequeno') || l.includes('matabicho')) return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&q=80';
    if (l.includes('entrada')) return 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=500&q=80';
    if (l.includes('carne')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80';
    if (l.includes('peixe')) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80';
    if (l.includes('sobremesa') || l.includes('doce')) return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80';
    if (l.includes('bebida') || l.includes('sumo')) return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80';

    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80';
};
