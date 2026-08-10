import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateConformityJson() {
    const keyPath = path.join(process.cwd(), 'keys', 'agt_private_key.pem');
    if (!fs.existsSync(keyPath)) {
        console.error("Erro: A chave privada não foi encontrada em:", keyPath);
        return;
    }

    const privateKey = fs.readFileSync(keyPath, 'utf8');

    // 1. Definição do cabeçalho JWS
    const header = {
        alg: "RS256",
        typ: "JWS",
        cert_no: "000/JINDUNGO/2026"
    };

    // 2. Definição do payload fiscal (Conformidade com C1 - Factura/Recibo)
    const payload = {
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

    // Helper para converter para Base64Url
    const toBase64Url = (obj) => {
        const str = JSON.stringify(obj);
        return Buffer.from(str)
            .toString('base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    };

    const headerB64Url = toBase64Url(header);
    const payloadB64Url = toBase64Url(payload);

    // 3. Assinar usando RS256 (RSA-SHA256)
    const signInput = `${headerB64Url}.${payloadB64Url}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signInput);
    const signature = signer.sign(privateKey);
    const signatureB64Url = signature
        .toString('base64')
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const fullJWS = `${signInput}.${signatureB64Url}`;

    // 4. Formato A: Payload de Requisição REST Completo (Envelope)
    const restPayloadEnvelope = {
        senderNif: "5417289301",
        softwareCertNo: "000/JINDUNGO/2026",
        documents: [
            {
                documentType: "FR",
                documentNumber: "FR 2026/1",
                dateEmitted: "2026-07-17T15:00:00Z",
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
                withholdingTaxList: [],
                signature: fullJWS
            }
        ]
    };

    const outputDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(path.join(outputDir, 'agt_conformity_envelope.json'), JSON.stringify(restPayloadEnvelope, null, 2));
    fs.writeFileSync(path.join(outputDir, 'agt_conformity_document.json'), JSON.stringify(payload, null, 2));

    console.log("Arquivos gerados com sucesso!");
    console.log("\n================ OPÇÃO A: ENVELOPE REST API COMPLETO (RECOMENDADO) ================");
    console.log(JSON.stringify(restPayloadEnvelope, null, 2));
    console.log("\n==================================================================================\n");

    console.log("\n================ OPÇÃO B: DOCUMENTO FISCAL INTERNO COM SIGNATURE ================");
    const docWithSig = { ...payload, signature: fullJWS };
    fs.writeFileSync(path.join(outputDir, 'agt_conformity_doc_with_sig.json'), JSON.stringify(docWithSig, null, 2));
    console.log(JSON.stringify(docWithSig, null, 2));
    console.log("\n==================================================================================\n");
}

generateConformityJson();
