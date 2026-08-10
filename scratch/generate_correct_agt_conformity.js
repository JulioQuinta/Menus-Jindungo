import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateCorrectAgtConformity() {
    const keyPath = path.join(process.cwd(), 'keys', 'agt_private_key.pem');
    if (!fs.existsSync(keyPath)) {
        console.error("Erro: A chave privada não foi encontrada em:", keyPath);
        return;
    }

    const privateKey = fs.readFileSync(keyPath, 'utf8');

    // Helper para converter para Base64Url
    const toBase64Url = (obj) => {
        const str = JSON.stringify(obj);
        return Buffer.from(str)
            .toString('base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    };

    // Helper para assinar um objeto com RS256 e gerar o JWS Compacto
    const generateJWS = (header, payloadObj) => {
        const headerB64Url = toBase64Url(header);
        const payloadB64Url = toBase64Url(payloadObj);
        const signInput = `${headerB64Url}.${payloadB64Url}`;
        
        const signer = crypto.createSign('RSA-SHA256');
        signer.update(signInput);
        const signature = signer.sign(privateKey);
        
        const signatureB64Url = signature
            .toString('base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
            
        return `${signInput}.${signatureB64Url}`;
    };

    // 1. Chaves de Cabeçalho JWS padrão
    const jwsHeader = {
        alg: "RS256",
        typ: "JWS",
        cert_no: "000/JINDUNGO/2026"
    };

    // 2. Assinatura do SoftwareInfoDetail (productId, productVersion, softwareValidationNumber)
    // De acordo com as normas da AGT, a assinatura jwsSoftwareSignature valida estes 3 campos.
    const softwareInfoDetail = {
        productId: "Menusjindungo",
        productVersion: "3",
        softwareValidationNumber: "0" // 0 ou placeholder de homologação provisória no portal do parceiro
    };

    const jwsSoftwareSignature = generateJWS(jwsHeader, softwareInfoDetail);

    // 3. Documento Fiscal (Factura/Recibo - FR)
    const documentPayload = {
        documentType: "FR",
        documentNumber: "FR 2026/1",
        dateEmitted: "2026-07-17T15:00:00Z",
        issuerNif: "5417289301",
        softwareName: "Menusjindungo",
        softwareVersion: "3",
        customerName: "Consumidor Final",
        customerNif: "999999999",
        customerAddress: "Luanda, Angola",
        items: [
            {
                lineId: 1,
                description: "Muamba de Galinha com Funge",
                quantity: 2,
                unitPrice: "4500.00",
                taxRate: "14.00",
                taxType: "IVA",
                netAmount: "9000.00",
                taxAmount: "1260.00",
                grossAmount: "10260.00"
            }
        ],
        documentTotals: {
            netTotal: "9000.00",
            taxPayable: "1260.00",
            grossTotal: "10260.00"
        },
        withholdingTaxList: []
    };

    const jwsDocumentSignature = generateJWS(jwsHeader, documentPayload);

    // 4. Construção do Envelope Oficial da AGT
    // Este envelope segue a estrutura exata exigida pelo validador do Portal do Parceiro da AGT (conforme erros apresentados)
    const agtEnvelope = {
        schemaVersion: "1.0",
        submissionUUID: crypto.randomUUID(), // UUID gerado dinamicamente para esta submissão
        taxRegistrationNumber: "5417289301", // NIF do Emissor
        submissionTimeStamp: new Date().toISOString(), // Data/Hora exata de submissão
        softwareInfo: {
            productId: "Menusjindungo",
            productVersion: "3",
            softwareValidationNumber: "0",
            jwsSoftwareSignature: jwsSoftwareSignature
        },
        document: {
            ...documentPayload,
            signature: jwsDocumentSignature // Assinatura JWS do documento fiscal
        }
    };

    const outputDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(
        path.join(process.cwd(), 'agt_factura_recibo_envelope_oficial.json'),
        JSON.stringify(agtEnvelope, null, 2)
    );

    console.log("Envelope oficial gerado com sucesso!");
    console.log(JSON.stringify(agtEnvelope, null, 2));
}

generateCorrectAgtConformity();
