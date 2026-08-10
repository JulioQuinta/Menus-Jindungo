import fs from 'fs';
import readline from 'readline';

async function search() {
    const fileStream = fs.createReadStream('C:\\Users\\Julio Quintas\\.gemini\\antigravity\\brain\\a0d39081-3274-410a-b7d3-d257e7d71c39\\.system_generated\\logs\\transcript.jsonl');
    
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log("Searching options in history...");
    for await (const line of rl) {
        if (line.includes('"USER_INPUT"') || line.includes('"PLANNER_RESPONSE"')) {
            const obj = JSON.parse(line);
            const content = obj.content || "";
            if (content.toLowerCase().includes("opção") || content.toLowerCase().includes("opcao")) {
                console.log(`--- STEP ${obj.step_index} (${obj.type}) ---`);
                console.log(content.slice(0, 1000));
            }
        }
    }
    console.log("Done.");
}

search().catch(console.error);
