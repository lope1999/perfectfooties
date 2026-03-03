import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function useServiceDiscounts() {
  const [discounts, setDiscounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'serviceDiscounts'),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((doc) => {
          map[doc.id] = doc.data();
        });
        setDiscounts(map);
        setLoading(false);
      },
      (err) => {
        console.error('serviceDiscounts listener error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { discounts, loading };
}
