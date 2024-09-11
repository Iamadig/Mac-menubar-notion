const axios = require('axios');
const { ipcMain } = require('electron');

let authorizationCode = null;

async function handleAuthCallback(url) {
    console.log('handleAuthCallback called with URL:', url);
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');
    
    if (error) {
        console.error('OAuth error:', error);
        ipcMain.emit('auth-error', null, error);
        return;
    }
    
    if (code) {
        console.log('Authorization code received:', code);
        authorizationCode = code;
        ipcMain.emit('auth-success', null, code);
    } else {
        console.log('No code found in URL, waiting for redirect');
        // Don't emit an error here, as this might be an intermediate step
    }
}

async function exchangeCodeForToken() {
    console.log('Exchanging code for token');
    if (!process.env.NOTION_CLIENT_ID || !process.env.NOTION_CLIENT_SECRET) {
        throw new Error('Notion credentials are not properly configured');
    }

    if (!authorizationCode) {
        throw new Error('No authorization code available');
    }

    try {
        const response = await axios.post('https://api.notion.com/v1/oauth/token', {
            grant_type: 'authorization_code',
            code: authorizationCode,
            redirect_uri: 'http://localhost:3000/callback'
        }, {
            auth: {
                username: process.env.NOTION_CLIENT_ID,
                password: process.env.NOTION_CLIENT_SECRET
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Token exchange successful');
        authorizationCode = null; // Clear the code after successful exchange
        return response.data.access_token;
    } catch (error) {
        console.error('Error exchanging code for token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { handleAuthCallback, exchangeCodeForToken };