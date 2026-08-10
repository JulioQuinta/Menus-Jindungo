const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, selected Electron APIs to the React frontend
contextBridge.exposeInMainWorld('electronAPI', {
    printReceipt: (htmlContent, printerName) => ipcRenderer.invoke('print-receipt', htmlContent, printerName),
    getPrinters: () => ipcRenderer.invoke('get-printers')
});
