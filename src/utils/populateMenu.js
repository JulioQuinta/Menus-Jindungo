
import { supabase } from '../lib/supabaseClient';

export const populateMenu = async (restaurantId) => {
    if (!restaurantId) {
        alert("Erro: Restaurante não identificado.");
        return;
    }

    if (!window.confirm("Isso vai adicionar itens de exemplo ao seu menu. Continuar?")) return;

    try {
        console.log("Starting population for restaurant:", restaurantId);

        // 1. Categories Data
        const categoriesData = [
            { label: 'Entradas', sort_order: 1, subcategories: ['Quentes', 'Frias', 'Petiscos'] },
            { label: 'Pratos Principais', sort_order: 2, subcategories: ['Carnes', 'Peixes', 'Vegetariano', 'Massas'] },
            { label: 'Bebidas', sort_order: 3, subcategories: ['Refrigerantes', 'Cervejas', 'Vinhos', 'Cocktails'] },
            { label: 'Sobremesas', sort_order: 4, subcategories: ['Doces', 'Frutas', 'Gelados'] }
        ];

        // 2. Insert Categories and get IDs
        const catMap = {}; // label -> id

        for (const cat of categoriesData) {
            // Check if exists
            const { data: existing } = await supabase
                .from('categories')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('label', cat.label)
                .single();

            let catId;
            if (existing) {
                // Update subcategories just in case
                await supabase.from('categories').update({ subcategories: cat.subcategories }).eq('id', existing.id);
                catId = existing.id;
            } else {
                const { data: newCat, error } = await supabase
                    .from('categories')
                    .insert([{ ...cat, restaurant_id: restaurantId }])
                    .select()
                    .single();

                if (error) throw error;
                catId = newCat.id;
            }
            catMap[cat.label] = catId;
        }

        console.log("Categories ready:", catMap);

        // 3. Menu Items Data
        const itemsData = [
            // Entradas
            { category: 'Entradas', name: 'Chamuças de Carne (3un)', price: '1500', subcategory: 'Quentes', desc_text: 'Crocantes e recheadas com carne.', img_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800' },
            { category: 'Entradas', name: 'Salada Caprese', price: '3200', subcategory: 'Frias', desc_text: 'Tomate, mozzarella e manjericão.', img_url: 'https://images.unsplash.com/photo-1529312266912-b33cf6227e2f?w=800' },

            // Pratos
            { category: 'Pratos Principais', name: 'Bitoque da Casa', price: '5800', subcategory: 'Carnes', desc_text: 'Bife, ovo, batata e arroz.', img_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800' },
            { category: 'Pratos Principais', name: 'Bacalhau com Natas', price: '6500', subcategory: 'Peixes', desc_text: 'Bacalhau gratinado com natas.', img_url: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcf0?w=800' },
            { category: 'Pratos Principais', name: 'Hambúrguer Artesanal', price: '4200', subcategory: 'Carnes', desc_text: '180g de carne com cheddar.', img_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800' },

            // Bebidas
            { category: 'Bebidas', name: 'Coca-Cola', price: '800', subcategory: 'Refrigerantes', desc_text: 'Lata 330ml.', img_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800' },
            { category: 'Bebidas', name: 'Mojito', price: '3000', subcategory: 'Cocktails', desc_text: 'Rum, lima e hortelã.', img_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800' },

            // Sobremesas
            { category: 'Sobremesas', name: 'Mousse de Chocolate', price: '1800', subcategory: 'Doces', desc_text: 'Caseira e cremosa.', img_url: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800' }
        ];

        for (const item of itemsData) {
            const catId = catMap[item.category];
            if (!catId) continue;

            const existing = await supabase.from('menu_items').select('id').eq('restaurant_id', restaurantId).eq('name', item.name).single();

            if (!existing.data) {
                await supabase.from('menu_items').insert([{
                    restaurant_id: restaurantId,
                    category_id: catId,
                    name: item.name,
                    price: item.price,
                    desc_text: item.desc_text,
                    subcategory: item.subcategory,
                    img_url: item.img_url,
                    available: true
                }]);
            }
        }

        alert("Menu preenchido com sucesso! Recarregue a página.");
        if (window.location.reload) window.location.reload();

    } catch (err) {
        console.error("Popupation error", err);
        alert("Erro ao popular: " + err.message);
    }
};
