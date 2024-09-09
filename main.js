require('dotenv').config();
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const Positioner = require('electron-positioner');
const { handleAuthCallback, exchangeCodeForToken } = require('./notion-auth');

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
  authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    'node-integration': false,
    'web-security': false
  });

  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=http://localhost:3000/callback`;
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

// Add this new IPC handler
ipcMain.on('resize-window', (event, width, height) => {
  if (window) {
    window.setSize(width, height);
  }
});