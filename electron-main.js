import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    const iconPath = isDev 
        ? path.join(__dirname, 'public/jindungo_logo.png')
        : path.join(__dirname, 'dist/jindungo_logo.png');

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: "Menús Jindungo Desktop",
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Set sandbox to false to allow preload require statements
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Remove window menu for a cleaner kiosk-like POS experience in production
    if (!isDev) {
        mainWindow.setMenuBarVisibility(false);
    }

    // Open DevTools for debugging
    mainWindow.webContents.openDevTools();

    if (isDev) {
        const loadDevServer = () => {
            mainWindow.loadURL('http://localhost:5174').catch(() => {
                setTimeout(loadDevServer, 1000);
            });
        };
        loadDevServer();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Register IPC handlers for silent printing and printer listing
ipcMain.handle('get-printers', async () => {
    if (!mainWindow) return [];
    try {
        return await mainWindow.webContents.getPrintersAsync();
    } catch (e) {
        console.error("Error fetching printers:", e);
        return [];
    }
});

ipcMain.handle('print-receipt', async (event, htmlContent, printerName) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a hidden window to load and print the HTML content silently
            let printWindow = new BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            // Load the HTML content as a data URL
            const base64Html = Buffer.from(htmlContent, 'utf-8').toString('base64');
            printWindow.loadURL(`data:text/html;base64,${base64Html}`);

            printWindow.webContents.once('did-finish-load', () => {
                const printOptions = {
                    silent: true,
                    printBackground: true
                };
                if (printerName) {
                    printOptions.deviceName = printerName;
                }

                printWindow.webContents.print(printOptions, (success, errorType) => {
                    printWindow.destroy();
                    if (success) {
                        resolve({ success: true });
                    } else {
                        reject(new Error(`Erro ao imprimir silenciosamente: ${errorType}`));
                    }
                });
            });
        } catch (e) {
            console.error("Print IPC error:", e);
            reject(e);
        }
    });
});

ipcMain.handle('print-raw-tcp', async (event, ip, port, base64Data) => {
    return new Promise((resolve, reject) => {
        try {
            const client = new net.Socket();
            const dataBuffer = Buffer.from(base64Data, 'base64');
            const targetPort = parseInt(port) || 9100;

            client.setTimeout(4000); // 4 seconds timeout

            client.connect(targetPort, ip, () => {
                client.write(dataBuffer, () => {
                    client.end();
                    resolve({ success: true });
                });
            });

            client.on('error', (err) => {
                client.destroy();
                reject(err);
            });

            client.on('timeout', () => {
                client.destroy();
                reject(new Error("Erro de timeout na ligação com a impressora de rede (IP)."));
            });
        } catch (e) {
            reject(e);
        }
    });
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
