import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { sanitizeString } from './validate';

// ─── Helpers ─────────────────────────────────────────────

export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

// ─── Read ────────────────────────────────────────────────

export async function fetchAllBlogPosts() {
  const q = query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Seed Firestore from static data if the collection is empty,
 * and return the blog post data so callers don't need a second read.
 */
export async function seedAndFetchBlogPosts(staticPosts) {
  const snap = await getDocs(collection(db, 'blogPosts'));

  if (!snap.empty) {
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    posts.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
    return posts;
  }

  // Collection is empty — seed from static data
  await Promise.all(
    staticPosts.map((post) =>
      setDoc(doc(db, 'blogPosts', post.id), {
        title: post.title,
        category: post.category,
        author: post.author,
        date: post.date,
        readTime: post.readTime,
        image: post.image,
        excerpt: post.excerpt,
        body: post.body || [],
        sources: post.sources || [],
        createdAt: serverTimestamp(),
      })
    )
  );

  return staticPosts.map((post) => ({ ...post }));
}

// ─── Create ──────────────────────────────────────────────

export async function addBlogPost(post) {
  const title = sanitizeString(post.title, 200);
  if (!title) throw new Error('Title is required');

  const slug = generateSlug(title);
  const ref = doc(db, 'blogPosts', slug);

  await setDoc(ref, {
    title,
    category: sanitizeString(post.category, 100),
    author: sanitizeString(post.author || 'PerfectFooties', 200),
    date: sanitizeString(post.date, 50),
    readTime: sanitizeString(post.readTime, 20),
    image: sanitizeString(post.image, 500),
    excerpt: sanitizeString(post.excerpt, 1000),
    body: Array.isArray(post.body) ? post.body.map((p) => sanitizeString(p, 5000)) : [],
    sources: Array.isArray(post.sources) ? post.sources.map((s) => sanitizeString(s, 500)) : [],
    createdAt: serverTimestamp(),
  });

  return slug;
}

// ─── Update ──────────────────────────────────────────────

export async function updateBlogPost(postId, updates) {
  const ref = doc(db, 'blogPosts', postId);
  const sanitized = {};

  if (updates.title !== undefined) sanitized.title = sanitizeString(updates.title, 200);
  if (updates.category !== undefined) sanitized.category = sanitizeString(updates.category, 100);
  if (updates.author !== undefined) sanitized.author = sanitizeString(updates.author, 200);
  if (updates.date !== undefined) sanitized.date = sanitizeString(updates.date, 50);
  if (updates.readTime !== undefined) sanitized.readTime = sanitizeString(updates.readTime, 20);
  if (updates.image !== undefined) sanitized.image = sanitizeString(updates.image, 500);
  if (updates.excerpt !== undefined) sanitized.excerpt = sanitizeString(updates.excerpt, 1000);
  if (updates.body !== undefined) sanitized.body = updates.body.map((p) => sanitizeString(p, 5000));
  if (updates.sources !== undefined) sanitized.sources = updates.sources.map((s) => sanitizeString(s, 500));

  sanitized.updatedAt = serverTimestamp();

  return updateDoc(ref, sanitized);
}

// ─── Delete ──────────────────────────────────────────────

export async function deleteBlogPost(postId) {
  const ref = doc(db, 'blogPosts', postId);
  return deleteDoc(ref);
}
