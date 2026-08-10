import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateCorrectAgtConformityV12() {
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

    const jwsHeader = {
        alg: "RS256"
    };

    // 1. Detalhe do Software (softwareInfoDetail)
    const softwareInfoDetail = {
        productId: "Menusjindungo",
        productVersion: "3",
        softwareValidationNumber: "0"
    };

    // Assinatura do SoftwareInfoDetail
    const jwsSoftwareSignature = generateJWS(jwsHeader, softwareInfoDetail);

    // 2. Totais do Documento
    const documentTotals = {
        taxPayable: "1260.00",
        netTotal: "9000.00",
        grossTotal: "10260.00"
    };

    // 3. Payload de Assinatura do Documento (segundo a especificação oficial da AGT DS-120)
    const documentSignaturePayload = {
        documentNo: "FR 2026/1",
        taxRegistrationNumber: "5002569450",
        documentType: "FR",
        documentDate: "2026-07-17",
        customerTaxID: "999999999",
        customerCountry: "AO",
        companyName: "SUMBA AQUI - COMÉRCIO E SERVIÇOS,(SU) Lda",
        documentTotals: documentTotals
    };

    const jwsDocumentSignature = generateJWS(jwsHeader, documentSignaturePayload);

    // 4. Linhas do Documento (estrutura estrita oficial 'lines' da AGT)
    const lines = [
        {
            lineNumber: "1",
            productCode: "P001",
            productDescription: "Muamba de Galinha com Funge",
            quantity: "2",
            unitOfMeasure: "UN",
            unitPrice: "4500.00",
            unitPriceBase: "4500.00",
            taxes: [
                {
                    taxType: "IVA",
                    taxCountryRegion: "AO",
                    taxCode: "NOR",
                    taxPercentage: "14"
                }
            ],
            settlementAmount: "10260.00"
        }
    ];

    // 5. Documento Oficial
    const document = {
        documentNo: "FR 2026/1",
        documentStatus: "N",
        documentDate: "2026-07-17",
        documentType: "FR",
        eacCode: "00000",
        systemEntryDate: "2026-07-17T15:00:00Z",
        customerTaxID: "999999999",
        customerCountry: "AO",
        companyName: "SUMBA AQUI - COMÉRCIO E SERVIÇOS,(SU) Lda",
        lines: lines,
        documentTotals: documentTotals,
        jwsDocumentSignature: jwsDocumentSignature
    };

    // 6. Envelope Oficial da AGT (RegisterInvoiceRequest)
    const agtEnvelope = {
        schemaVersion: "1.0",
        submissionUUID: crypto.randomUUID(),
        taxRegistrationNumber: "5002569450",
        submissionTimeStamp: new Date().toISOString(),
        softwareInfo: {
            softwareInfoDetail: softwareInfoDetail,
            jwsSoftwareSignature: jwsSoftwareSignature
        },
        numberOfEntries: "1",
        documents: [document]
    };

    const outputDir = process.cwd();
    fs.writeFileSync(
        path.join(outputDir, 'agt_factura_recibo_envelope_oficial.json'),
        JSON.stringify(agtEnvelope, null, 2)
    );

    console.log("Envelope oficial V12 (Estrutura Oficial AGT DS-120) gerado com sucesso!");
    console.log(JSON.stringify(agtEnvelope, null, 2));
}

generateCorrectAgtConformityV12();
