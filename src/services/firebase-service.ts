import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc } from 'firebase/firestore';
import { config } from '../config/index.js';

// Initialize Firebase
const firebaseApp = initializeApp(config.firebase);
const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true
}, "ai-studio-3aaeab60-998b-4c3e-b820-73337fce910e",);

/**
 * Fetches the document from the `products` collection by its Firestore ID
 * and extracts the `image` field URL.
 */
export const getImageUrlFromFirestore = async (firestoreId: string): Promise<string | null> => {
  try {
    const docRef = doc(db, 'products', firestoreId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.image || null;
    } else {
      console.warn(`Firestore document ${firestoreId} does not exist.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching firestore document ${firestoreId}:`, error);
    return null;
  }
};
