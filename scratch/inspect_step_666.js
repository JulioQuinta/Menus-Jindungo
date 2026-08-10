import fs from 'fs';
import readline from 'readline';

async function search() {
    const fileStream = fs.createReadStream('C:\\Users\\Julio Quintas\\.gemini\\antigravity\\brain\\a0d39081-3274-410a-b7d3-d257e7d71c39\\.system_generated\\logs\\transcript.jsonl');
    
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const obj = JSON.parse(line);
        if (obj.step_index === 666) {
            console.log(obj.content);
            break;
        }
    }
}

search().catch(console.error);
