import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateCorrectAgtConformityV6() {
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

    // 2. Detalhe do Software (softwareInfoDetail)
    const softwareInfoDetail = {
        productId: "Menusjindungo",
        productVersion: "3",
        softwareValidationNumber: "0"
    };

    // Assinatura do SoftwareInfoDetail
    const jwsSoftwareSignature = generateJWS(jwsHeader, softwareInfoDetail);

    // 3. Documento Fiscal (Factura/Recibo - FR) sem o withholdingTaxList
    const documentPayload = {
        documentType: "FR",
        documentNo: "FR 2026/1",
        documentStatus: "N",
        documentDate: "2026-07-17",
        systemEntryDate: "2026-07-17T15:00:00Z",
        issuerNif: "5002569450",
        companyName: "SUMBA AQUI - COMÉRCIO E SERVIÇOS,(SU) Lda",
        softwareName: "Menusjindungo",
        softwareVersion: "3",
        customerName: "Consumidor Final",
        customerTaxID: "999999999",
        customerAddress: "Luanda, Angola",
        customerCountry: "AO",
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
        }
        // withholdingTaxList removido completamente para testar se evita o mapeamento incorreto para paymentReceipt
    };

    // Nova Assinatura do Documento recalculada
    const jwsDocumentSignature = generateJWS(jwsHeader, documentPayload);

    // 4. Construção do Envelope Oficial da AGT
    const agtEnvelope = {
        schemaVersion: "1.0",
        submissionUUID: crypto.randomUUID(),
        taxRegistrationNumber: "5002569450",
        submissionTimeStamp: new Date().toISOString(),
        numberOfEntries: 1,
        softwareInfo: {
            softwareInfoDetail: softwareInfoDetail,
            jwsSoftwareSignature: jwsSoftwareSignature
        },
        documents: [
            {
                ...documentPayload,
                jwsDocumentSignature: jwsDocumentSignature
            }
        ]
    };

    const outputDir = process.cwd();
    fs.writeFileSync(
        path.join(outputDir, 'agt_factura_recibo_envelope_oficial.json'),
        JSON.stringify(agtEnvelope, null, 2)
    );

    console.log("Envelope oficial V6 gerado com sucesso!");
    console.log(JSON.stringify(agtEnvelope, null, 2));
}

generateCorrectAgtConformityV6();
