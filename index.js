const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// API Key gikan sa Google AI Studio
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Store recent translation logs for the web dashboard
let chatLogs = [];

// Serve live web dashboard
app.get('/', (req, res) => {
    let logHTML = chatLogs.map(log => 
        `<div style="margin-bottom:10px;padding:10px;background:#1e1e24;border-radius:6px;">
            <b style="color:#00E678;">[${log.sender}]</b>: ${log.original}<br>
            <span style="color:#888;">🤖 Gemini Translation:</span> <b style="color:#00e678;">${log.translated}</b>
            <span style="float:right;color:#555;font-size:12px;">${log.time}</span>
        </div>`
    ).join('');

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>JONDE HUB - Live AI Dashboard</title>
            <meta http-equiv="refresh" content="3">
            <style>
                body { font-family: sans-serif; background: #121215; color: #fff; padding: 20px; }
                .container { max-width: 800px; margin: auto; }
                .status { background: #18181e; padding: 15px; border-radius: 8px; border: 1px solid #00E678; margin-bottom: 20px; }
                .badge { background: #00E678; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🚀 JONDE HUB - Live AI Monitor</h2>
                <div class="status">
                    Status: <span class="badge">ONLINE & CONNECTED</span>
                    <p style="margin:5px 0 0 0;color:#aaa;font-size:14px;">Gemini AI Relay Active | Auto-refreshing every 3s...</p>
                </div>
                <h3>Live Translation Activity:</h3>
                <div>${logHTML || '<p style="color:#666;">Waiting for chats in Roblox...</p>'}</div>
            </div>
        </body>
        </html>
    `);
});

// Translation Endpoint for Roblox
app.post('/translate', async (req, res) => {
    try {
        const { text, mode, sender } = req.body;
        if (!text) return res.status(400).json({ error: "No text provided" });

        let prompt = "";
        if (mode === "to_english") {
            prompt = `Translate this Bisaya/Cebuano chat into natural, casual gaming English: "${text}". Reply ONLY with the translation.`;
        } else {
            prompt = `Translate this English chat into natural, casual Bisdak/Cebuano dialect as spoken by gamers in Cebu: "${text}". Reply ONLY with the translation.`;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const translatedText = response.data.candidates[0].content.parts[0].text.trim();

        // Save to Live Dashboard Logs
        chatLogs.unshift({
            sender: sender || 'Player',
            original: text,
            translated: translatedText,
            time: new Date().toLocaleTimeString()
        });
        if (chatLogs.length > 20) chatLogs.pop();

        res.json({ translation: translatedText });
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        res.status(500).json({ error: "Failed to translate via Gemini API" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Relay Server running on port ${PORT}`));
