const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, selected Electron APIs to the React frontend
contextBridge.exposeInMainWorld('electronAPI', {
    printReceipt: (htmlContent, printerName) => ipcRenderer.invoke('print-receipt', htmlContent, printerName),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    printRawTCP: (ip, port, base64Data) => ipcRenderer.invoke('print-raw-tcp', ip, port, base64Data),
    signInvoiceOffline: (payload, certNo) => ipcRenderer.invoke('sign-invoice-offline', payload, certNo)
});
