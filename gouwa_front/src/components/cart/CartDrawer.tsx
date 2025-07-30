// components/cart/CartDrawer.js
import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ExternalLink } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import Button from '../common/Button';
import ProduitService from '../../services/produitService';

const CartDrawer = ({ isOpen, onClose }) => {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getItemsByStore 
  } = useCart();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return ProduitService.getImageUrl(imagePath);
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString() + ' FCFA';
  };

  const itemsByStore = getItemsByStore();
  const storeIds = Object.keys(itemsByStore);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Mon Panier</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ShoppingBag size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Votre panier est vide
                </h3>
                <p className="text-gray-500 mb-4">
                  Découvrez nos produits et ajoutez-les à votre panier
                </p>
                <Button onClick={onClose} variant="primary">
                  Continuer mes achats
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {storeIds.map(storeId => {
                  const storeData = itemsByStore[storeId];
                  const storeTotal = storeData.items.reduce(
                    (total, item) => total + (item.price * item.quantity), 
                    0
                  );
                  
                  return (
                    <div key={storeId} className="border rounded-lg p-4">
                      {/* Store Header */}
                      <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: storeData.storeInfo.accentColor }}
                          />
                          <h3 className="font-medium text-gray-800">
                            {storeData.storeInfo.name}
                          </h3>
                          <a
                            href={`/store/${storeData.storeInfo.slug}`}
                            className="text-gray-400 hover:text-gray-600"
                            title="Voir la boutique"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {formatPrice(storeTotal)}
                        </span>
                      </div>

                      {/* Store Items */}
                      <div className="space-y-3">
                        {storeData.items.map(item => (
                          <div key={`${item.id}-${item.storeId}`} className="flex gap-3">
                            {/* Image */}
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {item.image ? (
                                <img
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag size={16} className="text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-800 truncate">
                                {item.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formatPrice(item.price)}
                              </p>
                              
                              {!item.isDigital && item.inStock <= item.quantity && (
                                <p className="text-xs text-amber-600">
                                  Stock limité
                                </p>
                              )}
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.storeId, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                >
                                  <Minus size={12} />
                                </button>
                                
                                <span className="text-sm font-medium min-w-[20px] text-center">
                                  {item.quantity}
                                </span>
                                
                                <button
                                  onClick={() => updateQuantity(item.id, item.storeId, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                  disabled={!item.isDigital && item.quantity >= item.inStock}
                                >
                                  <Plus size={12} />
                                </button>
                                
                                <button
                                  onClick={() => removeFromCart(item.id, item.storeId)}
                                  className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-orange-500">
                  {formatPrice(getCartTotal())}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button variant="primary" fullWidth>
                  Passer la commande
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={clearCart}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Vider le panier
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
