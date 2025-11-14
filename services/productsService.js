import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase.js';

export async function fetchProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const data =  querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log("123", data)
    return data
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}