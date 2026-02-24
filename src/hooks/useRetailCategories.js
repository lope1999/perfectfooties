import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { retailCategories as staticData } from '../data/retailProducts';

export default function useRetailCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'retailCategories'), orderBy('order'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setCategories(staticData);
        } else {
          setCategories(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore retailCategories error:', err);
        setError(err);
        setCategories(staticData);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { categories, loading, error };
}
