// Configuração Central Multi-Setorial para ERP / Faturação Jindungo v3.1

export const SECTORS = {
    PHARMACY: 'farmacia',
    BAKERY: 'padaria',
    SUPERMARKET: 'supermercado',
    RETAIL: 'loja',
    AUTOMOTIVE: 'oficina',
    BEAUTY: 'salao',
    MEDICAL: 'clinica',
    SERVICES: 'servicos',
    RESTAURANT: 'restaurante'
};

const SECTOR_ILLUSTRATIONS = {
    farmacia: {
        'rx': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
        'receita': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
        'mnsr': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80',
        'sem receita': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80',
        'xarope': 'https://images.unsplash.com/photo-1550572017-edf99c5a5874?w=600&q=80',
        'curativo': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&q=80',
        'vitamina': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&q=80',
        'bebe': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80',
        'cosmetica': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
        'dispositivos': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80',
        'default': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80'
    },
    padaria: {
        'pao': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
        'pastelaria': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
        'bolos': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
        'default': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80'
    },
    supermercado: {
        'mercearia': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
        'frescos': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80',
        'lacticinios': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80',
        'default': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&q=80'
    },
    loja: {
        'default': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80'
    },
    restaurante: {
        'default': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80'
    }
};

export const getSectorCategoryIllustration = (label = '', sectorId = 'farmacia') => {
    const sId = (sectorId || 'farmacia').toLowerCase();
    const l = (label || '').toLowerCase();
    const sectorDict = SECTOR_ILLUSTRATIONS[sId] || SECTOR_ILLUSTRATIONS['farmacia'];

    for (const key of Object.keys(sectorDict)) {
        if (key !== 'default' && l.includes(key)) {
            return sectorDict[key];
        }
    }
    return sectorDict['default'] || SECTOR_ILLUSTRATIONS['farmacia']['default'];
};

export const getSectorTerminology = (sectorId = 'farmacia') => {
    const sId = (sectorId || 'farmacia').toLowerCase();

    if (sId.includes('farm') || sId.includes('saude') || sId.includes('pharma')) {
        return {
            sectorName: 'Farmácia Enterprise',
            sectorBadge: 'GESTÃO DE MEDICAMENTOS & PRODUTOS',
            itemSingle: 'Medicamento / Fármaco',
            itemPlural: 'Medicamentos & Produtos',
            categorySingle: 'Categoria Farmacêutica',
            categoryPlural: 'Categorias de Fármacos',
            addItemButton: 'NOVO MEDICAMENTO / FÁRMACO',
            itemPlaceholderName: 'Ex: Omeprazol 20mg Cápsulas',
            itemPlaceholderDesc: 'Composição, dosagem, indicação terapêutica e laboratório...',
            stockResetPrompt: 'Deseja repor o stock de TODOS os medicamentos com controlo ativo?',
            deleteConfirm: 'Tem certeza que deseja apagar este medicamento?',
            activatedToast: 'Medicamento ativado no catálogo!',
            deactivatedToast: 'Medicamento suspenso do catálogo.',
            createdToast: 'Medicamento registado com sucesso!',
            updatedToast: 'Medicamento atualizado com sucesso!',
            deletedToast: 'Medicamento removido do catálogo.',
            iconEmoji: '💊',
            bgGlowColor: 'rgba(16, 185, 129, 0.15)',
            themeAccent: '#10B981'
        };
    } else if (sId.includes('padar') || sId.includes('bakery')) {
        return {
            sectorName: 'Padaria & Pastelaria',
            sectorBadge: 'PRODUTOS DE PADARIA',
            itemSingle: 'Produto de Padaria',
            itemPlural: 'Produtos & Pães',
            categorySingle: 'Categoria de Padaria',
            categoryPlural: 'Categorias de Padaria',
            addItemButton: 'NOVO PRODUTO DE PADARIA',
            itemPlaceholderName: 'Ex: Pão Cacete de Luanda',
            itemPlaceholderDesc: 'Farinha, peso, fornadas diárias...',
            stockResetPrompt: 'Deseja repor o stock de todos os produtos de padaria?',
            deleteConfirm: 'Deseja remover este produto de padaria?',
            activatedToast: 'Produto ativado!',
            deactivatedToast: 'Produto desativado.',
            createdToast: 'Produto de padaria registado!',
            updatedToast: 'Produto atualizado!',
            deletedToast: 'Produto removido.',
            iconEmoji: '🍞',
            bgGlowColor: 'rgba(245, 158, 11, 0.15)',
            themeAccent: '#F59E0B'
        };
    } else if (sId.includes('super') || sId.includes('market')) {
        return {
            sectorName: 'Supermercado POS',
            sectorBadge: 'CATÁLOGO DE ARTIGOS',
            itemSingle: 'Artigo / Produto',
            itemPlural: 'Artigos & Produtos',
            categorySingle: 'Secção / Categoria',
            categoryPlural: 'Secções de Artigos',
            addItemButton: 'NOVO ARTIGO DE SUPERMERCADO',
            itemPlaceholderName: 'Ex: Arroz Tio Lucas 5kg',
            itemPlaceholderDesc: 'Código de barras, marca, peso e especificações...',
            stockResetPrompt: 'Deseja repor o stock de todos os artigos do supermercado?',
            deleteConfirm: 'Deseja eliminar este artigo?',
            activatedToast: 'Artigo ativado!',
            deactivatedToast: 'Artigo desativado.',
            createdToast: 'Artigo registado!',
            updatedToast: 'Artigo atualizado!',
            deletedToast: 'Artigo eliminado.',
            iconEmoji: '🛒',
            bgGlowColor: 'rgba(59, 130, 246, 0.15)',
            themeAccent: '#3B82F6'
        };
    }

    return {
        sectorName: 'Restaurante & Bar',
        sectorBadge: 'GESTÃO DE PRATOS & MENUS',
        itemSingle: 'Prato / Item',
        itemPlural: 'Pratos & Bebidas',
        categorySingle: 'Categoria do Menu',
        categoryPlural: 'Categorias',
        addItemButton: 'NOVO PRATO / BEBIDA',
        itemPlaceholderName: 'Ex: Bitoque da Casa',
        itemPlaceholderDesc: 'Ingredientes, preparação e sabor...',
        stockResetPrompt: 'Deseja repor o stock de TODOS os pratos com controlo ativo?',
        deleteConfirm: 'Tem certeza que deseja apagar este prato?',
        activatedToast: 'Prato ativado!',
        deactivatedToast: 'Prato desativado.',
        createdToast: 'Prato criado com sucesso!',
        updatedToast: 'Prato atualizado com sucesso!',
        deletedToast: 'Prato removido com sucesso.',
        iconEmoji: '🍽️',
        bgGlowColor: 'rgba(245, 197, 66, 0.15)',
        themeAccent: '#F5C542'
    };
};
