require('dotenv').config();
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const Positioner = require('electron-positioner');
const { handleAuthCallback, exchangeCodeForToken } = require('./notion-auth');
const Store = require('electron-store');

let tray = null;
let window = null;
let authWindow = null;

// Configuration for window size
const config = {
  width: 300,
  height: 450,
  minWidth: 250,
  minHeight: 400,
  maxWidth: 800,
  maxHeight: 600
};

const store = new Store();

function createWindow() {
  window = new BrowserWindow({
    width: config.width,
    height: config.height,
    minWidth: config.minWidth,
    minHeight: config.minHeight,
    maxWidth: config.maxWidth,
    maxHeight: config.maxHeight,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: true,
    transparent: false, // Changed to false for debugging
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

  // Add resize event listener
  window.on('resize', () => {
    const [width, height] = window.getSize();
    config.width = width;
    config.height = height;
  });

  // Open DevTools for debugging
  window.webContents.openDevTools({ mode: 'detach' });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  tray.setIgnoreDoubleClickEvents(true);

  tray.on('click', (event) => {
    console.log('Tray clicked'); // Debugging log
    toggleWindow();
  });
}

function toggleWindow() {
  console.log('Toggle window called'); // Debugging log
  if (window.isVisible()) {
    console.log('Window is visible, hiding it'); // Debugging log
    window.hide();
  } else {
    console.log('Window is hidden, showing it'); // Debugging log
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

  console.log(`Setting window position to x: ${x}, y: ${y}`); // Debugging log
  window.setPosition(x, y, false);
  window.setSize(config.width, config.height); // Set size from config
  window.show();
  window.focus();
}

app.on('ready', () => {
  console.log('App is ready'); // Debugging log
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
  console.log('start-oauth event received');

  if (!process.env.NOTION_CLIENT_ID) {
    console.error('Notion Client ID is not configured');
    event.reply('oauth-error', 'Notion Client ID is not configured');
    return;
  }

  if (authWindow) {
    authWindow.focus();
    return;
  }

  authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback`;
  console.log('Auth URL:', authUrl);

  authWindow.loadURL(authUrl);
  authWindow.show();

  authWindow.webContents.on('will-navigate', (event, url) => {
    console.log('will-navigate event:', url);
    handleAuthCallback(url);
  });
  authWindow.webContents.on('will-redirect', (event, url) => {
    console.log('will-redirect event:', url);
    handleAuthCallback(url);
  });
  authWindow.webContents.on('did-navigate', (event, url) => {
    console.log('did-navigate event:', url);
    handleAuthCallback(url);
  });

  authWindow.on('closed', () => {
    authWindow = null;
  });
});

ipcMain.on('auth-success', (event, code) => {
  console.log('Auth success received in main process');
  if (window && window.webContents) {
    window.webContents.send('auth-success', code);
  }
  if (authWindow) {
    authWindow.close();
  }
});

ipcMain.on('auth-error', (event, message) => {
  console.log('Auth error received in main process:', message);
  if (window && window.webContents) {
    window.webContents.send('auth-error', message);
  }
  if (authWindow) {
    authWindow.close();
  }
});

ipcMain.handle('exchange-code', async (event) => {
  try {
    const token = await exchangeCodeForToken();
    store.set('notionToken', token);
    return token;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
});

// Add new IPC handlers for checking auth status and logging out
ipcMain.handle('check-auth', (event) => {
  return !!store.get('notionToken');
});

ipcMain.handle('logout', (event) => {
  store.delete('notionToken');
  return true;
});

// Add this new IPC handler
ipcMain.on('resize-window', (event, width, height) => {
  if (window) {
    window.setSize(width, height);
  }
});