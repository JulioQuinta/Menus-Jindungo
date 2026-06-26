import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: "Menús Jindungo Desktop",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    // Remove window menu for a cleaner kiosk-like POS experience in production
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (!isDev) {
        mainWindow.setMenuBarVisibility(false);
    }

    if (isDev) {
        const loadDevServer = () => {
            mainWindow.loadURL('http://localhost:5174').catch(() => {
                setTimeout(loadDevServer, 1000);
            });
        };
        loadDevServer();
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

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
