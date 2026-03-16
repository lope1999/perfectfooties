import { useState, useEffect } from 'react';
import { fetchCategories } from '../lib/adminService';
import { serviceCategories as staticServiceCategories } from '../data/services';

export default function useServiceCategories() {
  const [categories, setCategories] = useState(staticServiceCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories('serviceCategories')
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
