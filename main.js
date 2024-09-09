const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const Positioner = require('electron-positioner');
const { handleAuthCallback, exchangeCodeForToken } = require('./notion-auth');

let tray = null;
let window = null;
let authWindow = null;

function createWindow() {
  window = new BrowserWindow({
    width: 300,
    height: 450,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  window.loadFile('index.html');

  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  tray.setIgnoreDoubleClickEvents(true);

  tray.on('click', (event) => {
    toggleWindow();
  });
}

function toggleWindow() {
  if (window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
}

function showWindow() {
  const trayPos = tray.getBounds();
  const windowPos = window.getBounds();
  let x, y = 0;
  if (process.platform == 'darwin') {
    x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2));
    y = Math.round(trayPos.y + trayPos.height);
  } else {
    x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2));
    y = Math.round(trayPos.y - windowPos.height);
  }

  window.setPosition(x, y, false);
  window.show();
  window.focus();
}

app.on('ready', () => {
  createTray();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('start-oauth', (event) => {
  authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    'node-integration': false,
    'web-security': false
  });

  const authUrl = 'https://api.notion.com/v1/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&owner=user&redirect_uri=http://localhost:3000/callback';
  authWindow.loadURL(authUrl);
  authWindow.show();

  authWindow.webContents.on('will-navigate', handleAuthCallback);
  authWindow.webContents.on('will-redirect', handleAuthCallback);
});

ipcMain.handle('exchange-code', async (event, code) => {
  try {
    const token = await exchangeCodeForToken(code);
    return token;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
});