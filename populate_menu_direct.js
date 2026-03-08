
import pg from 'pg';
const { Client } = pg;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL!');

        const sql = `
        DO $$
        DECLARE
            v_restaurant_id UUID;
            v_cat_entradas UUID;
            v_cat_pratos UUID;
            v_cat_bebidas UUID;
            v_cat_sobremesas UUID;
        BEGIN
            -- Get Restaurant
            SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo' OR slug = 'demo-restaurant' LIMIT 1;
            
            IF v_restaurant_id IS NULL THEN
                RAISE NOTICE 'Restaurant not found';
                RETURN;
            END IF;

            -- 1. Ensure columns exist
            ALTER TABLE categories ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}';
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS subcategory TEXT;

            -- 2. Upsert Categories
            
            -- Entradas
            SELECT id INTO v_cat_entradas FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Entradas' LIMIT 1;
            IF v_cat_entradas IS NULL THEN
                INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
                VALUES (v_restaurant_id, 'Entradas', 1, ARRAY['Quentes', 'Frias', 'Petiscos'])
                RETURNING id INTO v_cat_entradas;
            ELSE
                UPDATE categories SET subcategories = ARRAY['Quentes', 'Frias', 'Petiscos'] WHERE id = v_cat_entradas;
            END IF;

            -- Pratos Principais
            SELECT id INTO v_cat_pratos FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Pratos Principais' LIMIT 1;
            IF v_cat_pratos IS NULL THEN
                INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
                VALUES (v_restaurant_id, 'Pratos Principais', 2, ARRAY['Carnes', 'Peixes', 'Vegetariano', 'Massas'])
                RETURNING id INTO v_cat_pratos;
            ELSE
                 UPDATE categories SET subcategories = ARRAY['Carnes', 'Peixes', 'Vegetariano', 'Massas'] WHERE id = v_cat_pratos;
            END IF;

            -- Bebidas
            SELECT id INTO v_cat_bebidas FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Bebidas' LIMIT 1;
            IF v_cat_bebidas IS NULL THEN
                INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
                VALUES (v_restaurant_id, 'Bebidas', 3, ARRAY['Refrigerantes', 'Cervejas', 'Vinhos', 'Cocktails'])
                RETURNING id INTO v_cat_bebidas;
            ELSE
                UPDATE categories SET subcategories = ARRAY['Refrigerantes', 'Cervejas', 'Vinhos', 'Cocktails'] WHERE id = v_cat_bebidas;
            END IF;

            -- Sobremesas
            SELECT id INTO v_cat_sobremesas FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Sobremesas' LIMIT 1;
            IF v_cat_sobremesas IS NULL THEN
                INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
                VALUES (v_restaurant_id, 'Sobremesas', 4, ARRAY['Doces', 'Frutas', 'Gelados'])
                RETURNING id INTO v_cat_sobremesas;
            ELSE
                UPDATE categories SET subcategories = ARRAY['Doces', 'Frutas', 'Gelados'] WHERE id = v_cat_sobremesas;
            END IF;

            -- 3. Insert Items (only if not exists)
            
            -- Entradas
            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_entradas, 'Chamuças de Carne (3un)', '1500', 'Crocantes e recheadas com carne temperada à moda da casa.', 'Quentes', true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Chamuças de Carne (3un)');

            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_entradas, 'Salada Caprese', '3200', 'Tomate fresco, mozzarella de búfala, manjericão e azeite virgem.', 'Frias', true, 'https://images.unsplash.com/photo-1529312266912-b33cf6227e2f?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Salada Caprese');

            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_entradas, 'Gambas ao Alho', '5500', 'Gambas salteadas em azeite, alho e coentros.', 'Quentes', true, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Gambas ao Alho');

            -- Pratos Principais
            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_pratos, 'Bitoque da Casa', '5800', 'Bife da vazia grelhado com molho especial, ovo a cavalo, batata frita e arroz.', 'Carnes', true, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Bitoque da Casa');

            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_pratos, 'Bacalhau com Natas', '6500', 'Clássico bacalhau desfiado envolvido em natas e batata palha gratinado ao forno.', 'Peixes', true, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcf0?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Bacalhau com Natas');

            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_pratos, 'Hambúrguer Artesanal', '4200', '180g de carne bovina, queijo cheddar, bacon, cebola caramelizada e molho da casa.', 'Carnes', true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Hambúrguer Artesanal');

            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_pratos, 'Esparguete à Bolonhesa', '3800', 'Massa italiana com molho de tomate caseiro e carne picada.', 'Massas', true, 'https://images.unsplash.com/photo-1622973536968-3ead9e780568?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Esparguete à Bolonhesa');

            -- Bebidas
            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_bebidas, 'Coca-Cola', '800', 'Lata 330ml gelada.', 'Refrigerantes', true, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Coca-Cola');

            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_bebidas, 'Cuca Preta', '900', 'Cerveja nacional preta.', 'Cervejas', true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Cuca Preta');

            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_bebidas, 'Mojito Clássico', '3000', 'Rum, hortelã fresca, lima, açúcar e soda.', 'Cocktails', true, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Mojito Clássico');
            
            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_bebidas, 'Sumo de Laranja Natural', '1500', 'Espremido na hora.', 'Refrigerantes', true, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Sumo de Laranja Natural');

            -- Sobremesas
            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_sobremesas, 'Mousse de Chocolate', '1800', 'Mousse caseira rica e cremosa com raspas de chocolate.', 'Doces', true, 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Mousse de Chocolate');

            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_sobremesas, 'Salada de Fruta', '1200', 'Mix de frutas da época frescas.', 'Frutas', true, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Salada de Fruta');
            
            INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
            SELECT v_restaurant_id, v_cat_sobremesas, 'Cheesecake de Morango', '2500', 'Base de bolacha, creme suave e cobertura de morango.', 'Doces', true, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800'
            WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = v_restaurant_id AND name = 'Cheesecake de Morango');
        END $$;
        `;

        await client.query(sql);
        console.log('✅ Menu populated successfully!');

    } catch (err) {
        console.error('❌ Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
