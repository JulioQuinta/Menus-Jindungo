import fs from 'fs';
import path from 'path';

function debugPayload() {
    const fileContent = fs.readFileSync('scratch/generate_correct_agt_conformity_v5.js', 'utf8');
    
    // Vamos substituir a função generateJWS para imprimir o payloadObj recebido
    const modifiedContent = fileContent.replace(
        "const generateJWS = (header, payloadObj) => {",
        "const generateJWS = (header, payloadObj) => { console.log('DEBUG PAYLOAD:', JSON.stringify(payloadObj, null, 2));"
    );
    
    fs.writeFileSync('scratch/temp_debug.js', modifiedContent);
}

debugPayload();
