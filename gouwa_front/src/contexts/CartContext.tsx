// contexts/CartContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Actions du panier
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Reducer pour gérer l'état du panier
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { product, quantity = 1, storeInfo } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.id === product.id && item.storeId === storeInfo.id
      );

      if (existingItemIndex > -1) {
        // Si le produit existe déjà, augmenter la quantité
        const updatedItems = [...state.items];
        const currentQuantity = updatedItems[existingItemIndex].quantity;
        const newQuantity = currentQuantity + quantity;
        
        // Vérifier le stock pour les produits physiques
        if (!product.isDigital && newQuantity > product.inStock) {
          return state; // Ne pas ajouter si pas assez de stock
        }
        
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity
        };
        
        return {
          ...state,
          items: updatedItems
        };
      } else {
        // Nouveau produit
        if (!product.isDigital && quantity > product.inStock) {
          return state; // Ne pas ajouter si pas assez de stock
        }
        
        const newItem = {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price || 0),
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          quantity,
          isDigital: product.isDigital,
          inStock: product.inStock,
          storeId: storeInfo.id,
          storeName: storeInfo.name,
          storeSlug: storeInfo.slug,
          storeAccentColor: storeInfo.accentColor,
          addedAt: new Date().toISOString()
        };
        
        return {
          ...state,
          items: [...state.items, newItem]
        };
      }
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      return {
        ...state,
        items: state.items.filter(
          item => !(item.id === action.payload.productId && item.storeId === action.payload.storeId)
        )
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { productId, storeId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            item => !(item.id === productId && item.storeId === storeId)
          )
        };
      }

      const updatedItems = state.items.map(item => {
        if (item.id === productId && item.storeId === storeId) {
          // Vérifier le stock pour les produits physiques
          if (!item.isDigital && quantity > item.inStock) {
            return item; // Ne pas mettre à jour si pas assez de stock
          }
          return { ...item, quantity };
        }
        return item;
      });

      return {
        ...state,
        items: updatedItems
      };
    }

    case CART_ACTIONS.CLEAR_CART: {
      return {
        ...state,
        items: []
      };
    }

    case CART_ACTIONS.LOAD_CART: {
      return {
        ...state,
        items: action.payload || []
      };
    }

    default:
      return state;
  }
};

// État initial du panier
const initialState = {
  items: []
};

// Création du contexte
const CartContext = createContext();

// Hook personnalisé pour utiliser le contexte du panier
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Provider du panier
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Charger le panier depuis le localStorage au démarrage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('boutikplace_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
    }
  }, []);

  // Sauvegarder le panier dans le localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem('boutikplace_cart', JSON.stringify(state.items));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  }, [state.items]);

  // Actions du panier
  const addToCart = (product, quantity = 1, storeInfo) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { product, quantity, storeInfo }
    });
  };

  const removeFromCart = (productId, storeId) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { productId, storeId }
    });
  };

  const updateQuantity = (productId, storeId, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { productId, storeId, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  // Fonctions utilitaires
  const getCartItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isInCart = (productId, storeId) => {
    return state.items.some(item => item.id === productId && item.storeId === storeId);
  };

  const getCartItemQuantity = (productId, storeId) => {
    const item = state.items.find(item => item.id === productId && item.storeId === storeId);
    return item ? item.quantity : 0;
  };

  const getItemsByStore = () => {
    const itemsByStore = {};
    state.items.forEach(item => {
      if (!itemsByStore[item.storeId]) {
        itemsByStore[item.storeId] = {
          storeInfo: {
            id: item.storeId,
            name: item.storeName,
            slug: item.storeSlug,
            accentColor: item.storeAccentColor
          },
          items: []
        };
      }
      itemsByStore[item.storeId].items.push(item);
    });
    return itemsByStore;
  };

  const value = {
    items: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isInCart,
    getCartItemQuantity,
    getItemsByStore
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};