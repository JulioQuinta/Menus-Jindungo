/**
 * Utilidário para Impressoras Térmicas (ESC/POS) via Web Bluetooth e WebUSB
 * Suporta comandos básicos de formatação e corte de papel.
 */

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

export class NativePrinter {
    constructor() {
        this.device = null;
        this.interface = null;
        this.endpoint = null;
        this.type = null; // 'bluetooth' or 'usb'
        
        // Bluetooth specific
        this.btCharacteristic = null;
    }

    // Connects via Bluetooth
    async connectBluetooth() {
        if (!navigator.bluetooth) throw new Error('Bluetooth não suportado neste navegador.');
        
        try {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            this.btCharacteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            
            this.device = device;
            this.type = 'bluetooth';
            return true;
        } catch (error) {
            console.error('BT Connect Error:', error);
            throw error;
        }
    }

    // Connects via USB
    async connectUSB() {
        if (!navigator.usb) throw new Error('WebUSB não suportado neste navegador.');

        try {
            const device = await navigator.usb.requestDevice({ filters: [] });
            await device.open();
            await device.selectConfiguration(1);
            
            // Find the printer interface (usually class 7)
            const iface = device.configuration.interfaces.find(i => 
                i.alternates[0].interfaceClass === 7
            );

            if (!iface) throw new Error('Dispositivo USB não é uma impressora compatível.');

            await device.claimInterface(iface.interfaceNumber);
            
            const endpoint = iface.alternates[0].endpoints.find(e => e.direction === 'out');
            if (!endpoint) throw new Error('Não foi possível encontrar o endpoint de saída.');

            this.device = device;
            this.interface = iface;
            this.endpoint = endpoint;
            this.type = 'usb';
            
            return true;
        } catch (error) {
            console.error('USB Connect Error:', error);
            throw error;
        }
    }

    disconnect() {
        if (this.type === 'bluetooth' && this.device?.gatt.connected) {
            this.device.gatt.disconnect();
        } else if (this.type === 'usb' && this.device?.opened) {
            this.device.close();
        }
        this.device = null;
        this.type = null;
    }

    isConnected() {
        if (this.type === 'bluetooth') return this.device?.gatt.connected;
        if (this.type === 'usb') return this.device?.opened;
        return false;
    }

    async sendRaw(data) {
        if (!this.isConnected()) throw new Error('Impressora não conectada.');

        if (this.type === 'bluetooth') {
            const chunkSize = 512;
            for (let i = 0; i < data.length; i += chunkSize) {
                await this.btCharacteristic.writeValue(data.slice(i, i + chunkSize));
            }
        } else {
            await this.device.transferOut(this.endpoint.endpointNumber, data);
        }
    }

    async sendText(text) {
        // Basic Portuguese Accent mapping for common thermal printers (CP850/CP860)
        // Note: Full encoding usually requires a dedicated library, but we can do a basic replace
        const accentMap = {
            'á': '\xA0', 'à': '\x85', 'â': '\x83', 'ã': '\xC7',
            'é': '\x82', 'ê': '\x88', 'í': '\xA1', 'ó': '\xA2',
            'ô': '\x93', 'õ': '\xE4', 'ú': '\xA3', 'ç': '\x87',
            'Á': 'A', 'À': 'A', 'Â': 'A', 'Ã': 'A',
            'É': 'E', 'Ê': 'E', 'Í': 'I', 'Ó': 'O',
            'Ô': 'O', 'Õ': 'O', 'Ú': 'U', 'Ç': 'C'
        };
        
        let processedText = text;
        // Optional: Simple replacement if printer doesn't support UTF-8 (default for most)
        // processedText = text.split('').map(char => accentMap[char] || char).join('');

        const encoder = new TextEncoder();
        const data = encoder.encode(processedText);
        await this.sendRaw(data);
    }

    async printOrder(order, restaurantName) {
        let layout = "";
        layout += COMMANDS.RESET;
        layout += COMMANDS.ALIGN_CENTER;
        layout += COMMANDS.DOUBLE_ON;
        layout += `${restaurantName || 'Jindungo'}` + COMMANDS.LF;
        layout += COMMANDS.NORMAL_TEXT;
        layout += `COZINHA - PEDIDO ATIVO` + COMMANDS.LF;
        layout += COMMANDS.LF;
        
        layout += COMMANDS.ALIGN_LEFT;
        layout += `Mesa/Ref: ${order.table_number || 'S/N'}` + COMMANDS.LF;
        layout += `Cliente: ${order.customer_name || 'Generic'}` + COMMANDS.LF;
        layout += `Data: ${new Date().toLocaleTimeString()}` + COMMANDS.LF;
        layout += `--------------------------------` + COMMANDS.LF;
        
        order.items?.forEach(item => {
            layout += COMMANDS.BOLD_ON;
            layout += `${item.quantity}x ${item.name.substring(0, 24)}` + COMMANDS.LF;
            layout += COMMANDS.BOLD_OFF;
            if (item.variant_name) layout += `   - ${item.variant_name}` + COMMANDS.LF;
            if (item.notes) layout += `   *OBS: ${item.notes}` + COMMANDS.LF;
        });

        layout += `--------------------------------` + COMMANDS.LF;
        layout += COMMANDS.ALIGN_CENTER;
        layout += `Powered by Jindungo` + COMMANDS.LF;
        layout += COMMANDS.LF.repeat(4);
        layout += COMMANDS.CUT;

        await this.sendText(layout);
    }
}

export const printerService = new NativePrinter();
