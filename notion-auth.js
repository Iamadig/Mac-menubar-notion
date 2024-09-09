require('dotenv').config();

const axios = require('axios');
const { BrowserWindow } = require('electron');

const CLIENT_ID = process.env.NOTION_CLIENT_ID;
const CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

function handleAuthCallback(event, url) {
    const rawCode = /code=([^&]*)/.exec(url) || null;
    const code = (rawCode && rawCode.length > 1) ? rawCode[1] : null;
    const error = /\?error=(.+)$/.exec(url);

    if (code || error) {
        // Close the browser if code found or error
        BrowserWindow.getFocusedWindow().close();
    }

    if (code) {
        BrowserWindow.getAllWindows()[0].webContents.send('auth-success', code);
    } else if (error) {
        console.error('Oauth error:', error);
    }
}

async function exchangeCodeForToken(code) {
    try {
        const response = await axios.post('https://api.notion.com/v1/oauth/token', {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
}

module.exports = {
    handleAuthCallback,
    exchangeCodeForToken
};