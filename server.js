const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Fichier pour stocker l'état des codes
const CODES_FILE = path.join(__dirname, 'codes.json');

// Initialiser le fichier codes.json s'il n'existe pas
if (!fs.existsSync(CODES_FILE)) {
    fs.writeFileSync(CODES_FILE, '{}');
}

// Lire les codes
function readCodes() {
    try {
        const data = fs.readFileSync(CODES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Écrire les codes
function writeCodes(codes) {
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
}

// Endpoint pour vérifier si le code a été envoyé
app.get('/api/code-status/:id', (req, res) => {
    const codes = readCodes();
    const id = req.params.id;
    const status = codes[id] || { sent: false };
    res.json(status);
});

// Endpoint pour mettre à jour l'état du code (appelé par le webhook Telegram)
app.post('/api/code-sent/:id', (req, res) => {
    const codes = readCodes();
    const id = req.params.id;
    codes[id] = { sent: true, timestamp: new Date().toISOString() };
    writeCodes(codes);
    res.json({ success: true });
});

// Webhook Telegram pour recevoir les callbacks
app.post('/webhook', async (req, res) => {
    const { callback_query, message } = req.body;
    
    if (callback_query) {
        const { data, id: callback_id, from, message: msg } = callback_query;
        
        if (data && data.startsWith('code_sent_')) {
            const uniqueId = data.replace('code_sent_', '');
            
            // Mettre à jour l'état du code
            const codes = readCodes();
            codes[uniqueId] = { sent: true, timestamp: new Date().toISOString() };
            writeCodes(codes);
            
            // Répondre au callback
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callback_id,
                text: 'Code envoyé avec succès!',
                show_alert: true
            });
            
            // Modifier le message pour désactiver le bouton
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Code envoyé', callback_data: 'already_sent' }
                    ]]
                }
            });
        }
    }
    
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Serveur running on port ${PORT}`);
});
