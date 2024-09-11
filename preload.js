const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startOAuth: () => ipcRenderer.send('start-oauth'),
  onAuthSuccess: (callback) => ipcRenderer.on('auth-success', callback),
  onAuthError: (callback) => ipcRenderer.on('auth-error', callback),
  exchangeCode: () => ipcRenderer.invoke('exchange-code'),
  getLastPage: () => ipcRenderer.invoke('get-last-page'),
  setLastPage: (url) => ipcRenderer.invoke('set-last-page', url),
  resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height),
  isLoggedIn: () => ipcRenderer.invoke('is-logged-in'),
});