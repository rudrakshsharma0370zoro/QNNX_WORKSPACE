const admin = require('firebase-admin');
require('dotenv').config({ path: 'c:/Users/hp5cd/Downloads/final app combined/.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function run() {
  console.log("--- Checking for 'sidharth' in Auth ---");
  const listUsersResult = await auth.listUsers(1000);
  let found = false;
  for (const user of listUsersResult.users) {
    if (
      (user.email && user.email.toLowerCase().includes('sidharth')) || 
      (user.displayName && user.displayName.toLowerCase().includes('sidharth'))
    ) {
      console.log(`FOUND IN AUTH: ${user.email} (UID: ${user.uid}, Name: ${user.displayName})`);
      console.log(`Custom Claims:`, user.customClaims);
      found = true;
    }
  }
  if (!found) console.log("Not found in Firebase Auth.");

  console.log("\n--- Checking for admins in Firestore ---");
  const adminQuery = await db.collection('users').where('role', '==', 'admin').get();
  if (adminQuery.empty) {
    console.log("No users with role 'admin' found in Firestore.");
  } else {
    adminQuery.forEach(doc => {
      console.log(`Admin Found: ${doc.id} =>`, doc.data());
    });
  }
  
  process.exit(0);
}

run().catch(console.error);
