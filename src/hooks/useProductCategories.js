import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
// Products come from Firestore — no static fallback after leather transition
const staticData = [];

export default function useProductCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'productCategories'), orderBy('order'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Firestore has no data yet — fall back to static
          setCategories(staticData);
        } else {
          setCategories(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore productCategories error:', err);
        setError(err);
        // Fall back to static data on error
        setCategories(staticData);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { categories, loading, error };
}
