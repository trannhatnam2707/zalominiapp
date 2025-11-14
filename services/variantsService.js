import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase.js';

export async function fetchVariants() {
  try {
    const querySnapshot = await getDocs(collection(db, 'variants'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching variants:', error);
    return [];
  }
}