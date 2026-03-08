import { supabase } from '../lib/supabaseClient';

export const menuService = {
    getMenuCategories: async (restaurantId) => {
        try {
            // 1. Fetch Categories
            const { data: categories, error: catError } = await supabase
                .from('categories')
                .select('id, label, sort_order')
                .eq('restaurant_id', restaurantId)
                .order('sort_order', { ascending: true });

            if (catError) throw catError;
            if (!categories || categories.length === 0) return [];

            // 2. Fetch Items for these categories
            const { data: items, error: itemError } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('available', true);

            if (itemError) throw itemError;

            // 3. Nest items into categories
            return categories.map(cat => ({
                id: cat.id,
                label: cat.label,
                items: items
                    .filter(item => item.category_id === cat.id)
                    .map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        desc: item.desc_text,
                        img: item.img_url,
                        subcategory: item.subcategory,
                        isHighlight: item.is_highlight,
                        badge: item.badge,
                        pairsWith: item.pairs_with,
                        // [NEW] Multilingual Support
                        translations: {
                            pt: { name: item.name, desc: item.desc_text },
                            en: { name: item.name_en || item.name, desc: item.desc_en || item.desc_text },
                            fr: { name: item.name_fr || item.name, desc: item.desc_fr || item.desc_text },
                            es: { name: item.name_es || item.name, desc: item.desc_es || item.desc_text },
                        }
                    }))
            }));

        } catch (err) {
            console.error('Error fetching menu:', err);
            return [];
        }
    }
};
