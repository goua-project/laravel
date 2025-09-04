// components/cart/CartDrawer.js

// components/cart/CartDrawer.js
import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ExternalLink, AlertTriangle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import OrderProductButton from './OrderProductButton';

const CartDrawer = ({ isOpen, onClose }) => {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getItemsByStore,
    refreshCartData 
  } = useCart();
  
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stockWarnings, setStockWarnings] = useState({});

  // Rafraîchir les données du panier quand le drawer s'ouvre
  useEffect(() => {
    if (isOpen && items.length > 0) {
      refreshCartStock();
    }
  }, [isOpen]);

  const refreshCartStock = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshCartData();
      await checkStockWarnings();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Vérifier les avertissements de stock
  const checkStockWarnings = async () => {
    const warnings = {};
    
    for (const item of items) {
      if (!item.isDigital) {
        try {
          const response = await fetch(`/api/products/${item.id}/stock?store=${item.storeId}`, {
            headers: {
              'Authorization': `Bearer ${user?.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const stockData = await response.json();
            if (stockData.stock < item.quantity) {
              warnings[`${item.id}-${item.storeId}`] = {
                available: stockData.stock,
                requested: item.quantity
              };
            }
          }
        } catch (error) {
          console.error('Erreur de vérification de stock:', error);
        }
      }
    }
    
    setStockWarnings(warnings);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.REACT_APP_API_BASE_URL}/storage/${imagePath}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const handleQuantityChange = async (itemId, storeId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, storeId);
      return;
    }

    try {
      await updateQuantity(itemId, storeId, newQuantity);
      await checkStockWarnings();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const itemsByStore = getItemsByStore();
  const storeIds = Object.keys(itemsByStore);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Mon Panier</h2>
              {isRefreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
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
                    <div key={storeId} className="border rounded-lg p-4 bg-white shadow-sm">
                      {/* Store Header */}
                      <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: storeData.storeInfo.accentColor || '#F25539' }}
                          />
                          <h3 className="font-medium text-gray-800">
                            {storeData.storeInfo.name}
                          </h3>
                          <a
                            href={`/store/${storeData.storeInfo.slug}`}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Voir la boutique"
                            target="_blank"
                            rel="noopener noreferrer"
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
                        {storeData.items.map(item => {
                          const warningKey = `${item.id}-${item.storeId}`;
                          const hasStockWarning = stockWarnings[warningKey];
                          
                          return (
                            <div key={warningKey} className="flex gap-3">
                              {/* Image */}
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.image ? (
                                  <img
                                    src={getImageUrl(item.image)}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full flex items-center justify-center" style={{ display: item.image ? 'none' : 'flex' }}>
                                  <ShoppingBag size={16} className="text-gray-400" />
                                </div>
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-800 truncate">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {formatPrice(item.price)}
                                </p>
                                
                                {/* Stock warnings */}
                                {hasStockWarning && (
                                  <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                    <AlertTriangle size={12} />
                                    <span>
                                      Seulement {hasStockWarning.available} disponible(s)
                                    </span>
                                  </div>
                                )}
                                
                                {!item.isDigital && item.inStock <= 5 && !hasStockWarning && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    Stock limité ({item.inStock} restant(s))
                                  </p>
                                )}
                                
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => handleQuantityChange(item.id, item.storeId, item.quantity - 1)}
                                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    disabled={isRefreshing}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  
                                  <span className="text-sm font-medium min-w-[20px] text-center">
                                    {item.quantity}
                                  </span>
                                  
                                  <button
                                    onClick={() => handleQuantityChange(item.id, item.storeId, item.quantity + 1)}
                                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={
                                      isRefreshing || 
                                      (!item.isDigital && (
                                        item.quantity >= item.inStock ||
                                        (hasStockWarning && item.quantity >= hasStockWarning.available)
                                      ))
                                    }
                                  >
                                    <Plus size={12} />
                                  </button>
                                  
                                  <button
                                    onClick={() => removeFromCart(item.id, item.storeId)}
                                    className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    disabled={isRefreshing}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                {/* Sous-total item */}
                                <div className="text-xs text-gray-500 mt-1">
                                  Sous-total: {formatPrice(item.price * item.quantity)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bouton de commande par boutique */}
                      <div className="mt-4 pt-3 border-t">
                        <CartStoreOrderButton 
                          storeData={storeData}
                          hasStockIssues={storeData.items.some(item => {
                            const warningKey = `${item.id}-${item.storeId}`;
                            return stockWarnings[warningKey];
                          })}
                          onOrderSuccess={(result) => {
                            // Ne vider que les items de cette boutique du panier
                            storeData.items.forEach(item => {
                              removeFromCart(item.id, item.storeId);
                            });
                            onClose();
                          }}
                          onOrderError={(error) => {
                            console.error('Erreur de commande:', error);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4 bg-gray-50">
              {/* Total global */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total global</span>
                <span className="text-lg font-bold text-orange-500">
                  {formatPrice(getCartTotal())}
                </span>
              </div>

              {/* Informations */}
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Les commandes sont traitées par boutique</p>
                <p>• Les frais de livraison sont calculés séparément</p>
              </div>

              {/* Actions globales */}
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="small"
                  fullWidth
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir vider tout le panier ?')) {
                      clearCart();
                    }
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={isRefreshing}
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

// Composant pour gérer la commande d'une boutique spécifique
const CartStoreOrderButton = ({ storeData, hasStockIssues, onOrderSuccess, onOrderError }) => {
  const totalItems = storeData.items.reduce((sum, item) => sum + item.quantity, 0);
  const storeTotal = storeData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Créer un produit virtuel représentant la commande groupée
  const cartProduct = {
    id: `cart-${storeData.storeInfo.id}`,
    name: `Commande ${storeData.storeInfo.name}`,
    price: storeTotal,
    image: storeData.items[0]?.image || null,
    type: storeData.items.some(item => item.type === 'physique') ? 'physique' : 'digital',
    isDigital: storeData.items.every(item => item.isDigital),
    inStock: Math.min(...storeData.items.filter(item => !item.isDigital).map(item => item.inStock)),
    cartItems: storeData.items,
    totalQuantity: totalItems
  };

  return (
    <div className="space-y-2">
      {hasStockIssues && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <AlertTriangle size={12} />
          <span>Attention: Stock insuffisant pour certains articles</span>
        </div>
      )}
      
      <OrderProductButton
        product={cartProduct}
        storeInfo={storeData.storeInfo}
        quantity={1}
        variant="primary"
        size="default"
        fullWidth={true}
        disabled={hasStockIssues}
        onOrderSuccess={onOrderSuccess}
        onOrderError={onOrderError}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
      />
      
      <div className="text-xs text-gray-500 text-center">
        {totalItems} article{totalItems > 1 ? 's' : ''} • {formatPrice(storeTotal)}
      </div>
    </div>
  );
};

export default CartDrawer;