document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded');
    const loginBtn = document.getElementById('loginBtn');
    const notionWebview = document.getElementById('notionWebview');
    const resizeHandle = document.getElementById('resize-handle');

    console.log('loginBtn:', loginBtn);
    console.log('notionWebview:', notionWebview);
    console.log('resizeHandle:', resizeHandle);

    if (loginBtn) {
        console.log('Login button found');
        loginBtn.addEventListener('click', () => {
            console.log('Login button clicked');
            window.electron.startOAuth();
        });
    } else {
        console.error('Login button not found');
    }

    window.electron.onAuthSuccess(async (event, code) => {
        console.log('Auth success received in renderer process');
        try {
            const token = await window.electron.exchangeCode();
            console.log('Token received:', token);
            updateUIForLoggedInState();
        } catch (error) {
            console.error('Error during authentication:', error);
            alert('Authentication error: ' + error.message);
        }
    });

    function updateUIForLoggedInState() {
        if (loginBtn) loginBtn.style.display = 'none';
        if (notionWebview) {
            notionWebview.style.display = 'block';
            loadLastPage();
        }
    }

    async function loadLastPage() {
        const lastPage = await window.electron.getLastPage();
        notionWebview.src = lastPage;
    }

    if (notionWebview) {
        notionWebview.addEventListener('dom-ready', () => {
            notionWebview.setZoomFactor(1);
            notionWebview.style.width = '100%';
            notionWebview.style.height = '100%';
            notionWebview.insertCSS(`
                body { overflow: hidden; }
            `);
            notionWebview.addEventListener('console-message', (e) => {
                console.log('Webview console:', e.message);
            });
        });

        notionWebview.addEventListener('did-navigate', (event) => {
            window.electron.setLastPage(event.url);
        });

        // Add these lines to enable interaction
        notionWebview.setAttribute('allowpopups', '');
        notionWebview.setAttribute('webpreferences', 'contextIsolation=no, nodeIntegration=yes');
    }

    const { ipcRenderer } = require('electron');
    const webview = document.getElementById('notion-webview');

    ipcRenderer.on('window-resized', (event, { width, height }) => {
        webview.style.width = `${width}px`;
        webview.style.height = `${height}px`;
    });

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

            window.electron.resizeWindow(newWidth, newHeight);
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    window.electron.onAuthError((event, message) => {
        console.error('Authentication error:', message);
        alert('Authentication error: ' + message);
    });

    // Check if user is already logged in
    const isLoggedIn = await window.electron.isLoggedIn();
    if (isLoggedIn) {
        updateUIForLoggedInState();
    }
});

console.log('Renderer script loaded');
console.log('window.electron:', window.electron);