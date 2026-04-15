// Utilidário genérico para Impressoras Térmicas MPT/ESC-POS via Web Bluetooth API
// Limitador: Opera apenas em Chrome/Edge/Android Chromium.

const COMMANDS = {
    LF: '\x0A',             // Line feed
    ESC: '\x1B',            // ESC byte
    RESET: '\x1B\x40',      // Reset printer
    BOLD_ON: '\x1B\x45\x01',// Bold text on
    BOLD_OFF: '\x1B\x45\x00',// Bold text off
    ALIGN_LEFT: '\x1B\x61\x00', // Align left
    ALIGN_CENTER: '\x1B\x61\x01', // Align center
    ALIGN_RIGHT: '\x1B\x61\x02', // Align right
    DOUBLE_HEIGHT: '\x1B\x21\x10', // Double height text
    DOUBLE_WIDTH: '\x1B\x21\x20',  // Double width text
    DOUBLE_ON: '\x1B\x21\x30',  // Double width & height
    NORMAL_TEXT: '\x1B\x21\x00', // Normal text
    CUT: '\x1D\x56\x41',    // Feeds paper & cuts
};

export class BluetoothPrinter {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
    }

    // Connects to a generic ESC/POS printer via Bluetooth
    async connect() {
        if (!navigator.bluetooth) {
            throw new Error('Navegador não suporta Web Bluetooth (Utilize Google Chrome no Android, Edge ou Mac).');
        }

        try {
            // Muitas impressoras genéricas térmicas publicam um serviço padrão com UUIDs longos.
            // Para simplificar o pareamento no Chrome, aceitamos "qualquer" dispositivo 
            // mas que liste um serviço '000018f0-0000-1000-8000-00805f9b34fb' comum (Service UUID de esc pos).
            // Em testes, filterByNamePrefix 'MPT' ou 'POS' é vulgar, por agora pedimos tudo.
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            }).catch(() => {
                // Se a impressora não definir UUID rigoroso, pedimos emparelhamento livre para impressora (requere flag acceptAllDevices: true mas retira services)
                return navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
                });
            });

            if (!this.device) throw new Error("Aparelho não selecionado.");

            this.server = await this.device.gatt.connect();
            this.service = await this.server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            // Write Characteristic comum
            this.characteristic = await this.service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

            return true;
        } catch (error) {
            console.error('Falha ao conectar Impressora Bluetooth:', error);
            throw error;
        }
    }

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
    }

    isConnected() {
        return this.device && this.device.gatt.connected && this.characteristic;
    }

    // Utils for writing
    async sendText(text) {
        if (!this.isConnected()) throw new Error('Não conectado.');
        // Encode text string to Uint8Array (Latin1 / ASCII) - ESCPOS usually doesn't do pure unicode without setup
        const encoder = new TextEncoder();
        
        // ESCPOS buffer split (max 512 bytes limit on Bluetooth MTU)
        const bytes = encoder.encode(text);
        const chunkSize = 256;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            await this.characteristic.writeValue(chunk);
        }
    }

    async printOrder(order, restaurantName) {
        if (!this.isConnected()) await this.connect();

        try {
            let layout = "";
            layout += COMMANDS.RESET;
            layout += COMMANDS.ALIGN_CENTER;
            layout += COMMANDS.DOUBLE_ON;
            layout += `${restaurantName || 'Jindungo'}` + COMMANDS.LF;
            layout += COMMANDS.NORMAL_TEXT;
            layout += `CONTA DE CONFERENCIA` + COMMANDS.LF;
            layout += COMMANDS.LF;
            
            layout += COMMANDS.ALIGN_LEFT;
            layout += `Mesa: ${order.table_number.replace('Entrega: ', '')}` + COMMANDS.LF;
            layout += `Data: ${new Date(order.created_at || new Date().toISOString()).toLocaleString('pt-AO')}` + COMMANDS.LF;
            if (order.customer_name) {
                layout += `Cliente: ${order.customer_name}` + COMMANDS.LF;
            }
            layout += `--------------------------------` + COMMANDS.LF; // Generic 58mm width divider (32 chars)
            
            layout += COMMANDS.BOLD_ON;
            layout += `Qtd Item                 Preco  ` + COMMANDS.LF;
            layout += COMMANDS.BOLD_OFF;
            layout += `--------------------------------` + COMMANDS.LF;
            
            // Items
            if (order.items) {
                order.items.forEach(item => {
                    const lineStart = `${item.quantity}  ${item.name.substring(0, 16)}`;
                    const price = `${new Intl.NumberFormat('pt-AO').format(item.price * item.quantity)}`;
                    
                    // Pad with spaces for alignment
                    const totalLengthLimit = 32;
                    const spacesNeeded = totalLengthLimit - (lineStart.length + price.length);
                    const spaces = " ".repeat(Math.max(1, spacesNeeded));
                    
                    layout += `${lineStart}${spaces}${price}` + COMMANDS.LF;
                });
            }

            layout += `--------------------------------` + COMMANDS.LF;
            layout += COMMANDS.DOUBLE_ON;
            layout += COMMANDS.ALIGN_RIGHT;
            layout += `TOTAL: ${new Intl.NumberFormat('pt-AO').format(order.total)} Kz` + COMMANDS.LF;
            layout += COMMANDS.NORMAL_TEXT;

            layout += COMMANDS.LF;
            layout += COMMANDS.ALIGN_CENTER;
            layout += `Pgto: ${order.payment_method === 'multicaixa' ? 'MCX Express' : (order.payment_method === 'cash' ? 'Dinheiro' : (order.payment_method || 'A Combinar'))}` + COMMANDS.LF;

            layout += COMMANDS.LF;
            layout += `Sem Valor Fiscal` + COMMANDS.LF;
            layout += COMMANDS.BOLD_ON;
            layout += `Powered by Jindungo` + COMMANDS.LF;
            layout += COMMANDS.BOLD_OFF;

            // Feeds space
            layout += COMMANDS.LF.repeat(4);
            layout += COMMANDS.CUT;

            await this.sendText(layout);

            return true;
        } catch (error) {
            console.error('Erro na impressao POS:', error);
            throw error;
        }
    }
}

// Singleton global
export const printerService = new BluetoothPrinter();
