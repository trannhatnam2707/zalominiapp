import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase.js';

export async function fetchCategories() {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}