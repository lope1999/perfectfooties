import { createContext, useContext, useReducer, useEffect } from 'react';

const STORAGE_KEY = 'perfectfooties-wishlist';

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore corrupted data
  }
  return [];
}

function wishlistReducer(state, action) {
  switch (action.type) {
    case 'ADD_WISHLIST': {
      if (state.some((item) => item.productId === action.payload.productId)) {
        return state;
      }
      return [...state, action.payload];
    }
    case 'REMOVE_WISHLIST':
      return state.filter((item) => item.productId !== action.payload);
    case 'CLEAR_WISHLIST':
      return [];
    default:
      return state;
  }
}

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, dispatch] = useReducer(wishlistReducer, null, loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (item) =>
    dispatch({ type: 'ADD_WISHLIST', payload: item });

  const removeFromWishlist = (productId) =>
    dispatch({ type: 'REMOVE_WISHLIST', payload: productId });

  const isInWishlist = (productId) =>
    wishlist.some((item) => item.productId === productId);

  const getWishlistCount = () => wishlist.length;

  const clearWishlist = () =>
    dispatch({ type: 'CLEAR_WISHLIST' });

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getWishlistCount,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
