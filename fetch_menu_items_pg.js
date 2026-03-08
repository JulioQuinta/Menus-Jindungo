
import pg from 'pg';
const { Client } = pg;

async function run() {
    // 54322 is the local supabase db port
    const client = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });
    try {
        await client.connect();
        // Join with categories to see label
        const res = await client.query(`
            SELECT m.id, m.name, c.label as category, m.subcategory 
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            ORDER BY c.label, m.name
        `);
        console.table(res.rows);
    } catch (e) { console.error(e); }
    finally { await client.end(); }
}
run();
