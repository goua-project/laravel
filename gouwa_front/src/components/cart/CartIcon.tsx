// components/cart/CartIcon.js
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

const CartIcon = ({ onClick, className = "" }) => {
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount();

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
    >
      <ShoppingCart size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartIcon;


