const { ipcRenderer, shell } = require('electron');
const Store = require('electron-store');

const store = new Store();

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const pageUrlInput = document.getElementById('pageUrl');
    const openPageBtn = document.getElementById('openPageBtn');
    const resizeHandle = document.getElementById('resize-handle');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Login button clicked'); // Debugging log
            ipcRenderer.send('start-oauth');
        });
    }

    if (openPageBtn && pageUrlInput) {
        openPageBtn.addEventListener('click', () => {
            const pageUrl = pageUrlInput.value;
            if (pageUrl) {
                shell.openExternal(pageUrl);
            }
        });
    }

    ipcRenderer.on('auth-success', async (event, code) => {
        console.log('Auth success received in renderer process');
        try {
            const token = await ipcRenderer.invoke('exchange-code');
            console.log('Token received:', token);
            updateUIForLoggedInState();
        } catch (error) {
            console.error('Error during authentication:', error);
            alert('Authentication error: ' + error.message);
        }
    });

    ipcRenderer.on('auth-error', (event, message) => {
        console.error('Authentication error received in renderer process:', message);
        alert('Authentication error: ' + message);
    });

    function updateUIForLoggedInState() {
        if (loginBtn) loginBtn.style.display = 'none';
        if (pageUrlInput) pageUrlInput.style.display = 'block';
        if (openPageBtn) openPageBtn.style.display = 'block';
    }

    // Check if user is already logged in
    if (store.get('notionToken')) {
        updateUIForLoggedInState();
    }

    // Resize functionality
    if (resizeHandle) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = document.documentElement.clientWidth;
            startHeight = document.documentElement.clientHeight;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);

            ipcRenderer.send('resize-window', newWidth, newHeight);
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    // Error handling
    ipcRenderer.on('oauth-error', (event, message) => {
        console.error('OAuth error:', message);
        alert('OAuth error: ' + message);
    });

    ipcRenderer.on('auth-error', (event, message) => {
        console.error('Authentication error:', message);
        alert('Authentication error: ' + message);
    });
});