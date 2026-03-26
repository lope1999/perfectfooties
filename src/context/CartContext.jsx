import { createContext, useContext, useReducer, useEffect } from 'react';

const STORAGE_KEY = 'chizzystyles-cart';

const initialState = {
  customerName: '',
  items: {
    services: [],
    products: [],
    pressOns: [],
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
          services: parsed.items?.services || [],
          products: parsed.items?.products || [],
          pressOns: parsed.items?.pressOns || [],
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
		case "ADD_SERVICE":
			return {
				...state,
				items: {
					...state.items,
					services: [...state.items.services, action.payload],
				},
			};
		case "REMOVE_SERVICE":
			return {
				...state,
				items: {
					...state.items,
					services: state.items.services.filter(
						(s) => s.id !== action.payload,
					),
				},
			};
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

  const addService = (service) =>
    dispatch({ type: 'ADD_SERVICE', payload: { ...service, id: crypto.randomUUID() } });

  const removeService = (id) =>
    dispatch({ type: 'REMOVE_SERVICE', payload: id });

  const addProduct = (product) =>
    dispatch({ type: 'ADD_PRODUCT', payload: product });

  const removeProduct = (productId) =>
    dispatch({ type: 'REMOVE_PRODUCT', payload: productId });

  const updateProductQty = (productId, quantity) =>
    dispatch({ type: 'UPDATE_PRODUCT_QTY', payload: { productId, quantity } });

  const addPressOn = (pressOn) =>
    dispatch({ type: 'ADD_PRESSON', payload: { ...pressOn, id: crypto.randomUUID() } });

  const removePressOn = (id) =>
    dispatch({ type: 'REMOVE_PRESSON', payload: id });

  const setCustomerName = (name) =>
    dispatch({ type: 'SET_CUSTOMER_NAME', payload: name });

  const clearCart = () =>
    dispatch({ type: 'CLEAR_CART' });

  const getCartCount = () => {
    const { services, products, pressOns } = state.items;
    return (
      services.length +
      products.reduce((sum, p) => sum + p.quantity, 0) +
      pressOns.length
    );
  };

  const getCartTotal = () => {
    const { services, products, pressOns } = state.items;
    const serviceTotal = services.reduce((sum, s) => sum + s.price, 0);
    const productTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const pressOnTotal = pressOns.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);
    return serviceTotal + productTotal + pressOnTotal;
  };

  return (
    <CartContext.Provider
      value={{
        cart: state,
        addService,
        removeService,
        addProduct,
        removeProduct,
        updateProductQty,
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
