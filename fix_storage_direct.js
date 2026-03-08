
import pg from 'pg';
const { Client } = pg;

async function run() {
    // Connection string from restore_via_pg.js
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL!');

        // 1. Storage Bucket - Force Public
        console.log("Configuring 'menus' bucket...");
        await client.query(`
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('menus', 'menus', true)
            ON CONFLICT (id) DO UPDATE SET public = true;
        `);

        // 2. Enable RLS on objects if not already (fails if already enabled, so wrap in block or ignore)
        try {
            await client.query(`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
        } catch (e) {
            // Ignore if already enabled
        }

        // 3. Drop old policies to avoid conflicts
        console.log("Cleaning up old policies...");
        await client.query(`DROP POLICY IF EXISTS "Public Read Menus" ON storage.objects;`);
        await client.query(`DROP POLICY IF EXISTS "Public Upload Menus" ON storage.objects;`);
        await client.query(`DROP POLICY IF EXISTS "Give me access" ON storage.objects;`);
        await client.query(`DROP POLICY IF EXISTS "Allow Authenticated Insert" ON storage.objects;`);
        await client.query(`DROP POLICY IF EXISTS "Allow Authenticated Update" ON storage.objects;`);
        await client.query(`DROP POLICY IF EXISTS "Allow Authenticated Delete" ON storage.objects;`);
        await client.query(`DROP POLICY IF EXISTS "kimi_generated_policy" ON storage.objects;`);

        // 4. Create new policies
        console.log("Applying new policies...");

        // Public Read
        await client.query(`
            CREATE POLICY "Public Read Menus"
            ON storage.objects FOR SELECT
            USING ( bucket_id = 'menus' );
        `);

        // Authenticated Insert (Allows any logged in user to upload to menus)
        await client.query(`
            CREATE POLICY "Allow Authenticated Insert"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK ( bucket_id = 'menus' );
        `);

        // Authenticated Update
        await client.query(`
            CREATE POLICY "Allow Authenticated Update"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING ( bucket_id = 'menus' );
        `);

        // Authenticated Delete
        await client.query(`
            CREATE POLICY "Allow Authenticated Delete"
            ON storage.objects FOR DELETE
            TO authenticated
            USING ( bucket_id = 'menus' );
        `);

        console.log("✅ Storage policies applied successfully!");

    } catch (err) {
        console.error('❌ Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
