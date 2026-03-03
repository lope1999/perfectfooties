import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { blogPosts as staticData } from '../data/blog';

export default function useBlogPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setPosts(staticData);
        } else {
          setPosts(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore blogPosts error:', err);
        setError(err);
        setPosts(staticData);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { posts, loading, error };
}
