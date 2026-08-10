import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateKeys() {
    console.log("Gerando par de chaves RSA de 2048 bits...");
    
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    const outputDir = path.join(process.cwd(), 'keys');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(path.join(outputDir, 'agt_private_key.pem'), privateKey);
    fs.writeFileSync(path.join(outputDir, 'agt_public_key.pem'), publicKey);

    console.log("Chaves geradas com sucesso em:");
    console.log(`- Privada: ${path.join(outputDir, 'agt_private_key.pem')}`);
    console.log(`- Pública: ${path.join(outputDir, 'agt_public_key.pem')}`);
    console.log("\n--- CHAVE PÚBLICA (COPIE O TEXTO ABAIXO) ---");
    console.log(publicKey);
    console.log("------------------------------------------");
}

generateKeys();
