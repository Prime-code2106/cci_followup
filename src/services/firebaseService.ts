import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore, Query, QuerySnapshot } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let firestore: Firestore;

try {
  let firebaseConfig: any = null;
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  let app;
  if (getApps().length === 0) {
    app = initializeApp({
      projectId: firebaseConfig?.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'organic-bus-b6ppv',
    });
  } else {
    app = getApps()[0];
  }

  // Use customized databaseId if present, otherwise default
  firestore = firebaseConfig?.firestoreDatabaseId 
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
    : getFirestore(app);

  console.log('Firebase Admin initialized successfully with database:', firebaseConfig?.firestoreDatabaseId || '(default)');
} catch (err) {
  console.error('Failed to initialize Firebase Admin, using default app fallback...', err);
  let app;
  if (getApps().length === 0) {
    app = initializeApp();
  } else {
    app = getApps()[0];
  }
  firestore = getFirestore(app);
}

export const db = firestore;

// Helper to convert firestore query snapshot to standard array of items
export function snapToData<T>(snapshot: QuerySnapshot): T[] {
  const list: T[] = [];
  snapshot.forEach(doc => {
    list.push({ ...doc.data() } as T);
  });
  return list;
}

// 1. Seed Firestore on boot
export async function seedFirestoreIfNeeded() {
  try {
    const churchesColl = db.collection('churches');
    const existingChurchesSnap = await churchesColl.limit(1).get();
    
    if (existingChurchesSnap.empty) {
      console.log('[Firebase] Database collections are empty. Beginning automatic demonstration seeding...');
      
      const defaultChurches = [
        {
          id: 'futamap',
          name: 'Celebration Church International',
          passwordHash: 'mock_bcrypt_pbkdf2_2ec9aec', // celebration2026 hash
          mapName: 'Celebration Group',
          logoName: 'CCI Admin'
        },
        {
          id: 'rccg',
          name: 'RCCG',
          passwordHash: 'mock_bcrypt_pbkdf2_660194d7', // rccg2026 hash
          mapName: 'RCCG Area',
          logoName: 'RCCG Admin'
        },
        {
          id: 'winners',
          name: 'Winners Chapel',
          passwordHash: 'mock_bcrypt_pbkdf2_68615316', // winners2026 hash
          mapName: 'Winners Cell',
          logoName: 'Winners Admin'
        }
      ];

      for (const c of defaultChurches) {
        await churchesColl.doc(c.id).set(c);
        
        // Seed default Settings
        await db.collection('appSettings').doc(c.id).set({
          id: c.id,
          mapName: c.mapName,
          churchName: c.name,
          themeColor: '#4f46e5',
          logoName: c.logoName
        });
      }
      console.log('✓ [Firebase] Seeding: Churches and Settings completed.');
    }

    // Always clear the transactional tables to keep the demo database clean as in original server.ts
    console.log('[Firebase] Preparing a clean, empty care database environment...');
    const collectionsToClear = [
      'members',
      'visitors',
      'attendance',
      'prayerRequests',
      'followUps',
      'fellowshipConnections',
      'fellowshipNotes',
      'recentActivities'
    ];

    for (const collName of collectionsToClear) {
      const snap = await db.collection(collName).get();
      if (!snap.empty) {
        const batch = db.batch();
        snap.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    }
    console.log('✓ [Firebase] Care collections cleared. Pristine database active!');
  } catch (err) {
    console.error('[Firebase] Error during seeding/cleanup:', err);
  }
}
