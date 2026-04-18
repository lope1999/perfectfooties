import { createContext, useContext, useReducer, useEffect } from 'react';

const STORAGE_KEY = 'perfectfooties-cart';

const initialState = {
  customerName: '',
  items: {
    products: [],
    pressOns: [],
    leatherGoods: [],
  },
};

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        customerName: parsed.customerName || '',
        items: {
          products: parsed.items?.products || [],
          pressOns: parsed.items?.pressOns || [],
          leatherGoods: parsed.items?.leatherGoods || [],
        },
      };
    }
  } catch {
    // ignore corrupted data
  }
  return initialState;
}

function cartReducer(state, action) {
  switch (action.type) {
		case "ADD_PRODUCT": {
			const existing = state.items.products.find(
				(p) => p.productId === action.payload.productId,
			);
			if (existing) {
				return {
					...state,
					items: {
						...state.items,
						products: state.items.products.map((p) =>
							p.productId === action.payload.productId
								? {
										...p,
										quantity: Math.min(
											p.quantity + action.payload.quantity,
											p.stock,
										),
									}
								: p,
						),
					},
				};
			}
			return {
				...state,
				items: {
					...state.items,
					products: [...state.items.products, action.payload],
				},
			};
		}
		case "REMOVE_PRODUCT":
			return {
				...state,
				items: {
					...state.items,
					products: state.items.products.filter(
						(p) => p.productId !== action.payload,
					),
				},
			};
		case "UPDATE_PRODUCT_QTY":
			return {
				...state,
				items: {
					...state.items,
					products: state.items.products.map((p) =>
						p.productId === action.payload.productId
							? {
									...p,
									quantity: Math.max(
										1,
										Math.min(action.payload.quantity, p.stock),
									),
								}
							: p,
					),
				},
			};
		case "ADD_PRESSON":
			return {
				...state,
				items: {
					...state.items,
					pressOns: [...state.items.pressOns, action.payload],
				},
			};
		case "REMOVE_PRESSON":
			return {
				...state,
				items: {
					...state.items,
					pressOns: state.items.pressOns.filter(
						(p) => p.id !== action.payload,
					),
				},
			};
		case 'ADD_LEATHER_GOOD': {
			const existing = state.items.leatherGoods.find(
				(p) => p.itemId === action.payload.itemId
          && p.selectedColor === action.payload.selectedColor
          && p.footLength === action.payload.footLength
          && p.euSize === action.payload.euSize
          && p.selectedImage === action.payload.selectedImage
          && p.orderNotes === action.payload.orderNotes
			);
			if (existing) {
				return {
					...state,
					items: {
						...state.items,
						leatherGoods: state.items.leatherGoods.map((p) =>
							p.cartId === existing.cartId ? { ...p, quantity: p.quantity + action.payload.quantity } : p
						),
					},
				};
			}
			return {
				...state,
				items: {
					...state.items,
					leatherGoods: [...state.items.leatherGoods, { ...action.payload, cartId: crypto.randomUUID() }],
				},
			};
		}
		case 'REMOVE_LEATHER_GOOD':
			return {
				...state,
				items: {
					...state.items,
					leatherGoods: state.items.leatherGoods.filter((p) => p.cartId !== action.payload),
				},
			};
		case 'UPDATE_LEATHER_GOOD_QTY':
			return {
				...state,
				items: {
					...state.items,
					leatherGoods: state.items.leatherGoods.map((p) =>
						p.cartId === action.payload.cartId ? { ...p, quantity: Math.max(1, action.payload.quantity) } : p
					),
				},
			};
		case "SET_CUSTOMER_NAME":
			return { ...state, customerName: action.payload };
		case "CLEAR_CART":
			return { ...initialState };
		default:
			return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, null, loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addProduct = (product) =>
    dispatch({ type: 'ADD_PRODUCT', payload: product });

  const removeProduct = (productId) =>
    dispatch({ type: 'REMOVE_PRODUCT', payload: productId });

  const updateProductQty = (productId, quantity) =>
    dispatch({ type: 'UPDATE_PRODUCT_QTY', payload: { productId, quantity } });

  const addLeatherGood = (good) =>
    dispatch({ type: 'ADD_LEATHER_GOOD', payload: good });

  const removeLeatherGood = (cartId) =>
    dispatch({ type: 'REMOVE_LEATHER_GOOD', payload: cartId });

  const updateLeatherGoodQty = (cartId, quantity) =>
    dispatch({ type: 'UPDATE_LEATHER_GOOD_QTY', payload: { cartId, quantity } });

  const addPressOn = (pressOn) =>
    dispatch({ type: 'ADD_PRESSON', payload: { ...pressOn, id: crypto.randomUUID() } });

  const removePressOn = (id) =>
    dispatch({ type: 'REMOVE_PRESSON', payload: id });

  const setCustomerName = (name) =>
    dispatch({ type: 'SET_CUSTOMER_NAME', payload: name });

  const clearCart = () =>
    dispatch({ type: 'CLEAR_CART' });

  const getCartCount = () => {
    const { products, pressOns, leatherGoods } = state.items;
    return (
      products.reduce((sum, p) => sum + p.quantity, 0) +
      pressOns.length +
      leatherGoods.reduce((sum, g) => sum + g.quantity, 0)
    );
  };

  const getCartTotal = () => {
    const { products, pressOns, leatherGoods } = state.items;
    const productTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const pressOnTotal = pressOns.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);
    const leatherTotal = leatherGoods.reduce((sum, g) => sum + g.price * g.quantity, 0);
    return productTotal + pressOnTotal + leatherTotal;
  };

  return (
    <CartContext.Provider
      value={{
        cart: state,
        addProduct,
        removeProduct,
        updateProductQty,
        addLeatherGood,
        removeLeatherGood,
        updateLeatherGoodQty,
        addPressOn,
        removePressOn,
        setCustomerName,
        clearCart,
        getCartCount,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
