import { firestoreAdminList } from './src/lib/firestoreAdmin';

async function run() {
  console.log('--- Checking Firestore Users ---');
  try {
    const users = await firestoreAdminList('users');
    let found = false;
    for (const u of users) {
      if (
        (u.email && u.email.toLowerCase().includes('sidharth')) || 
        (u.name && u.name.toLowerCase().includes('sidharth'))
      ) {
        console.log('FOUND SIDHARTH:', u);
        found = true;
      }
      if (u.role === 'admin') {
        console.log('Current Admin in Database:', u);
      }
    }
    if (!found) {
      console.log('Could not find any user with name or email containing sidharth in Firestore.');
    }
  } catch (e) {
    console.error('Error fetching users:', e);
  }
}

run();
