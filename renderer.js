const { ipcRenderer, shell } = require('electron');
const Store = require('electron-store');

const store = new Store();

const loginBtn = document.getElementById('loginBtn');
const pageUrlInput = document.getElementById('pageUrl');
const openPageBtn = document.getElementById('openPageBtn');

loginBtn.addEventListener('click', () => {
    ipcRenderer.send('start-oauth');
});

openPageBtn.addEventListener('click', () => {
    const pageUrl = pageUrlInput.value;
    if (pageUrl) {
        shell.openExternal(pageUrl);
    }
});

ipcRenderer.on('auth-success', async (event, code) => {
    try {
        const token = await ipcRenderer.invoke('exchange-code', code);
        store.set('notionToken', token);
        updateUIForLoggedInState();
    } catch (error) {
        console.error('Error during authentication:', error);
        // Handle error (e.g., show error message to user)
    }
});

function updateUIForLoggedInState() {
    loginBtn.style.display = 'none';
    pageUrlInput.style.display = 'block';
    openPageBtn.style.display = 'block';
}

// Check if user is already logged in
if (store.get('notionToken')) {
    updateUIForLoggedInState();
}