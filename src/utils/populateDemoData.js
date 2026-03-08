import { supabase } from '../lib/supabaseClient';

export const populateDemoData = async (restaurantId) => {
    if (!restaurantId) return { success: false, message: 'ID DO RESTAURANTE é obrigatório' };

    const demoCategories = [
        {
            name: '☕ Pequeno-Almoço',
            description: 'Para começar bem o dia',
            items: [
                { name: 'Menu Matabicho', description: 'Café, torrada e sumo natural', price: 2500, status: 'available' },
                { name: 'Ovos Mexidos com Bacon', description: 'Acompanha pão torrado', price: 3000, status: 'available' },
            ]
        },
        {
            name: '🌮 Entradas',
            description: 'Pequenas maravilhas para abrir o apetite',
            items: [
                { name: 'Chamuças de Carne', description: 'Porção de 3 unidades bem recheadas', price: 1500, status: 'available' },
                { name: 'Tábua de Queijos e Enchidos', description: 'Seleção premium para partilhar', price: 8500, status: 'available' },
                { name: 'Pão de Alho', description: 'Com queijo derretido', price: 1200, status: 'available' }
            ]
        },
        {
            name: '🍲 Sopas',
            description: 'Quentes e reconfortantes',
            items: [
                { name: 'Caldo Verde', description: 'Tradicional com chouriço', price: 2000, status: 'available' },
                { name: 'Sopa de Legumes Frescos', description: 'Super saudável', price: 1800, status: 'available' }
            ]
        },
        {
            name: '🥘 Pratos de Carne',
            description: 'As melhores carnes na grelha e no tacho',
            items: [
                { name: 'Bife à Casa Jindungo', description: 'Bife da vazia com molho secreto e batatas', price: 9500, status: 'available' },
                { name: 'Mufete Tradicional', description: 'Peixe assado com feijão de óleo de palma e mandioca', price: 7500, status: 'available' },
                { name: 'Frango Assado à Brasa', description: 'Acompanhado com arroz e salada mista', price: 6000, status: 'available' }
            ]
        },
        {
            name: '🐟 Pratos de Peixe',
            description: 'Frescos direto do mar',
            items: [
                { name: 'Bacalhau com Natas', description: 'O clássico irresistível', price: 8500, status: 'available' },
                { name: 'Peixe Cacusso Frito', description: 'Com funge e molho caseiro', price: 5500, status: 'available' }
            ]
        },
        {
            name: '🍝 Massas & Pizzas',
            description: 'Sabores de Itália',
            items: [
                { name: 'Esparguete Bolonhesa', description: 'Carne picada selecionada com molho de tomate', price: 5000, status: 'available' },
                { name: 'Pizza Margherita', description: 'Queijo Mozzarella e Manjericão fresco', price: 6500, status: 'available' }
            ]
        },
        {
            name: '🥗 Saladas',
            description: 'Opções leves e rápidas',
            items: [
                { name: 'Salada César', description: 'Frango grelhado, alface, croutons e molho especial', price: 4500, status: 'available' },
                { name: 'Salada Mista', description: 'Alface, tomate, cebola e pepino', price: 2500, status: 'available' }
            ]
        },
        {
            name: '🍰 Sobremesas',
            description: 'O momento doce da refeição',
            items: [
                { name: 'Mousse de Maracujá', description: 'Feita com fruta fresca', price: 2000, status: 'available' },
                { name: 'Pudim Caseiro', description: 'A receita secreta da Avó', price: 2500, status: 'available' },
                { name: 'Salada de Fruta', description: 'Frutas da época selecionadas', price: 1500, status: 'available' }
            ]
        },
        {
            name: '🥤 Bebidas Frias',
            description: 'Para matar a sede',
            items: [
                { name: 'Refrigerante em Lata', description: 'Bebidas gasosas diversas', price: 1000, status: 'available' },
                { name: 'Água Mineral', description: '500ml', price: 500, status: 'available' },
                { name: 'Sumo Natural de Laranja', description: 'Feito no momento', price: 2000, status: 'available' }
            ]
        },
        {
            name: '🍷 Vinhos & Bebidas Alcoólicas',
            description: 'Celebre com as nossas opções',
            items: [
                { name: 'Cerveja Cuca Branca', description: 'Fresquinha', price: 800, status: 'available' },
                { name: 'Vinho Tinto da Casa', description: 'Garrafa 750ml', price: 12000, status: 'available' },
                { name: 'Cocktail Jindungo', description: 'A nossa especialidade picante e doce', price: 3500, status: 'available' }
            ]
        }
    ];

    try {
        let insertedCategoriesCount = 0;
        let insertedItemsCount = 0;

        for (let i = 0; i < demoCategories.length; i++) {
            const cat = demoCategories[i];

            // 1. Inserir Categoria
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .insert([{
                    restaurant_id: restaurantId,
                    label: cat.name,
                    sort_order: i
                }])
                .select()
                .single();

            if (catError) {
                console.error("Erro ao criar categoria:", catError);
                return { success: false, message: `Erro Categoria: ${catError.message || catError.details || 'Permissão negada (RLS)'}` };
            }

            insertedCategoriesCount++;

            // 2. Inserir Produtos dessa categoria
            if (catData && cat.items && cat.items.length > 0) {
                const itemsToInsert = cat.items.map((item, index) => ({
                    category_id: catData.id,
                    restaurant_id: restaurantId,
                    name: item.name,
                    desc_text: item.description,
                    price: item.price,
                    available: true,
                    position: index,
                    img_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80' // Generic premium food image
                }));

                const { error: itemError } = await supabase
                    .from('menu_items')
                    .insert(itemsToInsert);

                if (itemError) {
                    console.error("Erro ao inserir itens:", itemError);
                    return { success: false, message: `Erro Itens: ${itemError.message || itemError.details}` };
                } else {
                    insertedItemsCount += itemsToInsert.length;
                }
            }
        }

        return { success: true, message: `${insertedCategoriesCount} Categorias e ${insertedItemsCount} Pratos carregados com sucesso!` };

    } catch (error) {
        console.error("Erro Fatal no Populate Demo:", error);
        return { success: false, message: error.message };
    }
};
