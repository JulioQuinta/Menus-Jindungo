import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let localStaticServer = null;

function startLocalDistServer(distDir) {
    return new Promise((resolve) => {
        if (localStaticServer) {
            const addr = localStaticServer.address();
            if (addr && addr.port) return resolve(`http://127.0.0.1:${addr.port}`);
        }
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.mjs': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.webmanifest': 'application/manifest+json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav'
        };

        localStaticServer = http.createServer((req, res) => {
            try {
                const parsedUrl = new URL(req.url, 'http://127.0.0.1');
                let safePath = path.normalize(decodeURIComponent(parsedUrl.pathname)).replace(/^(\.\.[\/\\])+/, '');
                let filePath = path.join(distDir, safePath);

                if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
                    filePath = path.join(distDir, 'index.html');
                }

                const ext = path.extname(filePath).toLowerCase();
                const contentType = mimeTypes[ext] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType });
                fs.createReadStream(filePath).pipe(res);
            } catch (err) {
                const indexFallback = path.join(distDir, 'index.html');
                if (fs.existsSync(indexFallback)) {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    fs.createReadStream(indexFallback).pipe(res);
                } else {
                    res.writeHead(500);
                    res.end('Internal Server Error');
                }
            }
        });

        localStaticServer.listen(0, '127.0.0.1', () => {
            const { port } = localStaticServer.address();
            resolve(`http://127.0.0.1:${port}`);
        });
    });
}

function createWindow() {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    const iconPath = isDev 
        ? path.join(__dirname, 'public/jindungo_logo.ico')
        : path.join(__dirname, 'dist/jindungo_logo.ico');

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

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    if (isDev) {
        const loadDevServer = () => {
            mainWindow.loadURL('http://localhost:5174').catch(() => {
                setTimeout(loadDevServer, 1000);
            });
        };
        loadDevServer();
    } else {
        const distPath = path.join(__dirname, 'dist');
        startLocalDistServer(distPath).then((serverUrl) => {
            if (mainWindow) {
                mainWindow.loadURL(serverUrl);
            }
        }).catch(() => {
            if (mainWindow) {
                mainWindow.loadFile(path.join(distPath, 'index.html'));
            }
        });
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

ipcMain.handle('sign-invoice-offline', async (event, payload, certNo = "FE/305/AGT/2026") => {
    try {
        let keyPath = path.join(__dirname, 'keys/agt_private_key.pem');
        if (!fs.existsSync(keyPath)) {
            keyPath = path.join(app.getAppPath(), 'keys/agt_private_key.pem');
        }
        if (!fs.existsSync(keyPath)) {
            keyPath = path.join(app.getAppPath(), '../keys/agt_private_key.pem');
        }
        if (!fs.existsSync(keyPath)) {
            throw new Error("Chave privada da AGT não foi encontrada nos caminhos locais.");
        }

        const privateKey = fs.readFileSync(keyPath, 'utf8');

        const header = {
            alg: "RS256",
            typ: "JWS",
            cert_no: certNo
        };

        const toBase64Url = (obj) => {
            return Buffer.from(JSON.stringify(obj))
                .toString('base64')
                .replace(/=/g, "")
                .replace(/\+/g, "-")
                .replace(/\//g, "_");
        };

        const headerBase64 = toBase64Url(header);
        const payloadBase64 = toBase64Url(payload);
        const signSource = `${headerBase64}.${payloadBase64}`;

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(signSource);
        const signature = signer.sign(privateKey, 'base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

        const fullJWS = `${signSource}.${signature}`;
        const controlChars = `${signature[0] || 'X'}${signature[10] || 'y'}${signature[20] || 'Z'}${signature[30] || '1'}`;

        return {
            success: true,
            jws: fullJWS,
            hashControl: controlChars.toUpperCase(),
            signature: signature
        };
    } catch (e) {
        console.error("Erro na assinatura JWS offline:", e);
        return { success: false, error: e.message };
    }
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
