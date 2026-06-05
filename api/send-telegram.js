// Fonction serverless Vercel pour envoyer à Telegram
const TELEGRAM_BOT_TOKEN = '8864088656:AAG1aGMsbwWtY0fWMTSmhdZJs_WY5o9FwKY';
const TELEGRAM_CHAT_ID = '-1004297758085';

export default async function handler(req, res) {
  // Vérifier que c'est une requête POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (data.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: data.description });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
}
