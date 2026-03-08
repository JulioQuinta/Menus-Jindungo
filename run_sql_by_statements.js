
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';

const sqlFile = path.join(process.cwd(), 'populate_example_menu_simple.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Split by semicolon, but be careful about semicolons in strings?
// The simple SQL script doesn't have semicolons in strings, so simple split is fine.
const statements = sqlContent.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

console.log(`Found ${statements.length} statements.`);

function runCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(`Command failed: ${cmd}\nError: ${error.message}`);
                // Resolve anyway to continue
                resolve(stdout || stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function run() {
    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        // Escape check: simplistic escaping for Windows/Shell
        // We use JSON.stringify to escape the string for shell mostly, but it adds quotes.
        // Actually, passing it as argument is tricky.
        // Best way: write to temp file? No, file read failed.

        // Let's try simple quote escaping.
        const cleanStmt = stmt.replace(/"/g, '\\"');
        const cmd = `npx -y supabase db query "${cleanStmt}"`;

        await runCommand(cmd);
    }
    console.log("Done.");
}

run();
