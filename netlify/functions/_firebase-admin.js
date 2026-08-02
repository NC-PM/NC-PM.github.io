// Shared Firebase Admin initializer for Netlify Functions.
// Reads credentials from environment variables set in the Netlify dashboard
// (Site settings -> Environment variables) — never commit real values here.

const admin = require('firebase-admin');

function getAdmin() {
  if (!admin.apps.length) {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return admin;
}

module.exports = { getAdmin };
