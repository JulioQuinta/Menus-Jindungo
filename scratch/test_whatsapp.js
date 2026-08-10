// C:\\Users\\Julio Quintas\\Documents\\Menús Jindungos\\scratch\\test_whatsapp.js
import { generateWhatsAppLink } from '../src/utils/whatsappGenerator.js';

const mockCartItems = [
    { id: 1, name: 'Torta de Frango', price: 2500, quantity: 2, selectedVariant: 'Grande' },
    { id: 2, name: 'Água Minerside (0.5L)', price: 500, quantity: 1 }
];

const mockDeliveryDetails = {
    customerName: 'Julio Quintas',
    customerPhone: '923000111',
    address: 'Talatona, Condomínio Girassol, Casa 42',
    addressReference: 'Próximo ao ISPTEC',
    locationLink: 'https://maps.google.com/?q=-8.92,13.18',
    paymentMethod: 'cash',
    changeFor: 10000,
    coupon_code: 'BEMVINDO10',
    coupon_discount: 500
};

const mockDineInDetails = {
    customerName: 'Ana Silva',
    customerPhone: '931222333',
    tableNumber: 'Mesa 12',
    paymentMethod: 'multicaixa'
};

console.log("=== SIMULAÇÃO DOS FLUXOS DE WHATSAPP ===");

// 1. CLIENTE & RESTAURANTE FLOW (Delivery)
console.log("\n--- 1. FLUXO CLIENTE -> RESTAURANTE (Delivery) ---");
const deliveryLink = generateWhatsAppLink(mockCartItems, 5000, 'delivery', mockDeliveryDetails, '923000000');
console.log("Link Gerado:", deliveryLink);
if (deliveryLink) {
    const decodedUrl = decodeURIComponent(deliveryLink);
    const messageText = decodedUrl.split('?text=')[1];
    console.log("\nMensagem que o Cliente enviará e o Restaurante receberá:");
    console.log("--------------------------------------------------");
    console.log(messageText);
    console.log("--------------------------------------------------");
}

// 2. CLIENTE & RESTAURANTE FLOW (Dine-In)
console.log("\n--- 2. FLUXO CLIENTE -> RESTAURANTE (No Local / Mesa) ---");
const dineInLink = generateWhatsAppLink(mockCartItems, 5500, 'dine-in', mockDineInDetails, '923000000');
console.log("Link Gerado:", dineInLink);
if (dineInLink) {
    const decodedUrl = decodeURIComponent(dineInLink);
    const messageText = decodedUrl.split('?text=')[1];
    console.log("\nMensagem para Dine-In:");
    console.log("--------------------------------------------------");
    console.log(messageText);
    console.log("--------------------------------------------------");
}

// 3. INTEGRADOR FLOW (Parsing of [[DATA:...]] block)
console.log("\n--- 3. FLUXO INTEGRADOR / AUTOMACÃO (Parsing do Bloco de Dados) ---");
if (deliveryLink) {
    const decodedUrl = decodeURIComponent(deliveryLink);
    const messageText = decodedUrl.split('?text=')[1];
    
    // Simulating Integrator parsing
    const dataRegex = /\[\[DATA:(.*?)\]\]/;
    const match = messageText.match(dataRegex);
    if (match && match[1]) {
        try {
            const parsedData = JSON.parse(match[1]);
            console.log("Integrador capturou o bloco DATA com sucesso!");
            console.log("Objeto de Automação Extraído:");
            console.log(JSON.stringify(parsedData, null, 2));
            console.log("✔ Teste de Integridade de Dados: PASSOU");
        } catch (e) {
            console.error("Erro ao fazer parse dos dados de automação:", e);
        }
    } else {
        console.error("Erro: Bloco [[DATA:...]] não encontrado na mensagem.");
    }
}
