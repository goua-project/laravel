import React, { Fragment, useState, useEffect } from 'react';
import { X, Trash2, ShoppingCart, Plus, Minus, Sparkles, Heart, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock store hook (remplace ton vrai store)
const useCartStore = () => ({
  items: [
    {
      productId: '1',
      storeId: 'store1',
      name: 'MacBook Pro M3',
      price: 2499000,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop',
      isDigital: false,
      category: 'Electronics'
    },
    {
      productId: '2', 
      storeId: 'store1',
      name: 'iPhone 15 Pro',
      price: 1299000,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop',
      isDigital: false,
      category: 'Electronics'
    },
    {
      productId: '3',
      storeId: 'store2', 
      name: 'Design Premium Course',
      price: 99000,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop',
      isDigital: true,
      category: 'Digital'
    }
  ],
  removeItem: (id) => console.log('Remove:', id),
  updateQuantity: (id, qty) => console.log('Update:', id, qty),
  getTotalPrice: (storeId) => storeId === 'store1' ? 5097000 : 99000,
  addToWishlist: (id) => console.log('Wishlist:', id)
});

const ModernCartDrawer = ({ isOpen = true, onClose = () => {} }) => {
  const { items, removeItem, updateQuantity, getTotalPrice, addToWishlist } = useCartStore();
  const [removingItems, setRemovingItems] = useState(new Set());
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [isShaking, setIsShaking] = useState(false);

  // Grouper les articles par boutique
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.storeId]) acc[item.storeId] = [];
    acc[item.storeId].push(item);
    return acc;
  }, {});

  // Animation de suppression avec feedback
  const handleRemoveItem = async (productId) => {
    setRemovingItems(prev => new Set([...prev, productId]));
    
    // Vibration haptic feedback (si supporté)
    if (navigator.vibrate) navigator.vibrate(100);
    
    setTimeout(() => {
      removeItem(productId);
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      
      // Notification toast
      addNotification('Article supprimé du panier', 'success');
    }, 400);
  };

  // Mise à jour de quantité avec animation
  const handleQuantityUpdate = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set([...prev, productId]));
    updateQuantity(productId, newQuantity);
    
    setTimeout(() => {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, 300);
  };

  // Système de notifications
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Animation de secousse pour panier vide 
  const handleEmptyCartShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Calcul du total global
  const grandTotal = Object.keys(groupedItems).reduce((total, storeId) => 
    total + getTotalPrice(storeId), 0
  );

  return (
    <>
      {/* Notifications Toast */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg transform transition-all duration-500
              animate-[slideInRight_0.3s_ease-out] backdrop-blur-md
              ${notif.type === 'success' ? 'bg-orange-500/90 text-white' : 'bg-gray-800/90 text-white'}
            `}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">{notif.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Overlay avec effet blur */}
      <div className={`
        fixed inset-0 z-40 transition-all duration-500
        ${isOpen ? 'backdrop-blur-sm bg-black/30' : 'opacity-0 pointer-events-none'}
      `} onClick={onClose} />

      {/* Cart Drawer */}
      <div className={`
        fixed right-0 top-0 h-full w-full max-w-md z-50
        transform transition-all duration-500 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full bg-white shadow-2xl">
          
          {/* Header avec effet glassmorphism */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-gray-800" />
                  {items.length > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-xs font-bold text-white">{items.length}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mon Panier</h2>
                  <p className="text-sm text-gray-500">{items.length} articles</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className={`text-center py-12 ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                <div className="relative mb-6 inline-block">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto" />
                  <div className="absolute inset-0 animate-ping">
                    <ShoppingCart className="w-16 h-16 text-orange-200 mx-auto" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Panier vide</h3>
                <p className="text-gray-500 mb-6">Découvrez nos produits incroyables !</p>
                <button
                  onClick={handleEmptyCartShake}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Explorer les boutiques
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedItems).map(([storeId, storeItems]) => (
                  <div key={storeId} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    
                    {/* Store Header */}
                                          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{storeId.slice(-1)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Boutique {storeId}</h3>
                          <p className="text-sm text-gray-500">{storeItems.length} articles</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {getTotalPrice(storeId).toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                      {storeItems.map((item) => (
                        <div
                          key={item.productId}
                          className={`
                            relative group bg-gray-50 rounded-xl p-4 transition-all duration-300
                            ${removingItems.has(item.productId) 
                              ? 'opacity-0 scale-95 transform translate-x-full' 
                              : 'hover:bg-white hover:shadow-md'
                            }
                            ${updatingItems.has(item.productId) ? 'ring-2 ring-orange-300 ring-opacity-50' : ''}
                          `}
                        >
                          <div className="flex space-x-4">
                            
                            {/* Product Image */}
                            <div className="relative flex-shrink-0">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              {item.isDigital && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                  <Sparkles className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                  <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                                  
                                  {/* Quantity Controls */}
                                  {!item.isDigital && (
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center space-x-1 bg-white rounded-full p-1 shadow-sm">
                                        <button
                                          onClick={() => handleQuantityUpdate(item.productId, item.quantity - 1)}
                                          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                          disabled={item.quantity <= 1}
                                        >
                                          <Minus className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <span className="w-8 text-center font-medium text-gray-900">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() => handleQuantityUpdate(item.productId, item.quantity + 1)}
                                          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                        >
                                          <Plus className="w-4 h-4 text-gray-600" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Price */}
                                <div className="text-right ml-4">
                                  <p className="font-semibold text-gray-900">
                                    {(item.price * item.quantity).toLocaleString()} FCFA
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="text-xs text-gray-500">
                                      {item.price.toLocaleString()} FCFA/unité
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => addToWishlist(item.productId)}
                                    className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors text-sm"
                                  >
                                    <Heart className="w-4 h-4" />
                                    <span>Favoris</span>
                                  </button>
                                  <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors text-sm">
                                    <Share2 className="w-4 h-4" />
                                    <span>Partager</span>
                                  </button>
                                </div>
                                
                                <button
                                  onClick={() => handleRemoveItem(item.productId)}
                                  className="flex items-center space-x-1 text-red-500 hover:text-red-700 transition-colors text-sm hover:bg-red-50 px-2 py-1 rounded-md"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Supprimer</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Store Checkout Button */}
                    <div className="mt-6">
                      <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl hover:scale-[1.02] transform transition-all duration-200 shadow-lg hover:shadow-xl">
                        Commander cette boutique • {getTotalPrice(storeId).toLocaleString()} FCFA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer avec total global */}
          {items.length > 0 && (
            <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-200/50 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">Total général</span>
                <span className="text-2xl font-bold text-gray-900">
                  {grandTotal.toLocaleString()} FCFA
                </span>
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl hover:scale-[1.02] transform transition-all duration-200 shadow-xl hover:shadow-2xl">
                Tout commander maintenant
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </>
  );
};

export default ModernCartDrawer;