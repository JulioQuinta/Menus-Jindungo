
import pg from 'pg';
const { Client } = pg;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL!');

        const res = await client.query("SELECT id FROM restaurants WHERE slug = 'demo'");
        if (res.rows.length === 0) {
            console.log('Demo restaurant not found');
            return;
        }
        const restaurantId = res.rows[0].id;
        console.log('Restaurant ID:', restaurantId);

        // Check category
        const catRes = await client.query("SELECT id FROM categories WHERE restaurant_id = $1 AND label = 'Sobremesas'", [restaurantId]);

        let catId;
        if (catRes.rows.length > 0) {
            console.log('Category exists:', catRes.rows[0].id);
            catId = catRes.rows[0].id;
        } else {
            const insertRes = await client.query(
                "INSERT INTO categories (restaurant_id, label, sort_order) VALUES ($1, 'Sobremesas', 4) RETURNING id",
                [restaurantId]
            );
            catId = insertRes.rows[0].id;
            console.log('Created Sobremesas:', catId);
        }

        // Insert Item
        const itemRes = await client.query("SELECT id FROM menu_items WHERE category_id = $1", [catId]);
        if (itemRes.rows.length === 0) {
            await client.query(`
                INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, available, is_highlight)
                VALUES ($1, $2, 'Petit Gâteau', '4500', 'Bolo de chocolate quente com bola de gelado de baunilha.', 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&auto=format&fit=crop', true, true)
            `, [restaurantId, catId]);
            console.log('Inserted Item');
        } else {
            console.log('Items already exist');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
