// pages/CartPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  CreditCard,
  Truck,
  Package,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import ProduitService from '../services/produitService';

const CartPage = () => {
  const navigate = useNavigate();
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getItemsByStore 
  } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return ProduitService.getImageUrl(imagePath);
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString() + ' FCFA';
  };

  const itemsByStore = getItemsByStore();
  const storeIds = Object.keys(itemsByStore);
  const totalAmount = getCartTotal();

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    // Simuler le processus de commande
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici vous pouvez intégrer votre logique de paiement
      // Par exemple: appeler une API de paiement, rediriger vers une page de paiement, etc.
      
      alert('Fonctionnalité de paiement à implémenter');
      
    } catch (error) {
      console.error('Erreur lors du processus de commande:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Container className="py-12">
          <div className="text-center">
            <ShoppingBag size={80} className="text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Votre panier est vide</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Découvrez nos boutiques et leurs produits exceptionnels pour commencer vos achats.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/')}
                variant="primary"
                icon={<ArrowLeft size={16} />}
                iconPosition="left"
              >
                Découvrir les boutiques
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={16} />}
              iconPosition="left"
            >
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Mon Panier</h1>
              <p className="text-gray-600">
                {items.length} article{items.length !== 1 ? 's' : ''} dans votre panier
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={clearCart}
            className="text-red-600 border-red-200 hover:bg-red-50"
            icon={<Trash2 size={16} />}
            iconPosition="left"
          >
            Vider le panier
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des produits */}
          <div className="lg:col-span-2 space-y-6">
            {storeIds.map(storeId => {
              const storeData = itemsByStore[storeId];
              const storeTotal = storeData.items.reduce(
                (total, item) => total + (item.price * item.quantity), 
                0
              );
              
              return (
                <div key={storeId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* En-tête de la boutique */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: storeData.storeInfo.accentColor }}
                        />
                        <h3 className="font-semibold text-gray-800">
                          {storeData.storeInfo.name}
                        </h3>
                        <button
                          onClick={() => navigate(`/store/${storeData.storeInfo.slug}`)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Voir la boutique"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Sous-total boutique</p>
                        <p className="font-semibold text-gray-800">
                          {formatPrice(storeTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Produits de la boutique */}
                  <div className="divide-y">
                    {storeData.items.map(item => (
                      <div key={`${item.id}-${item.storeId}`} className="p-4">
                        <div className="flex gap-4">
                          {/* Image du produit */}
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Détails du produit */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 truncate mb-1">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {formatPrice(item.price)} {item.isDigital && '(Digital)'}
                            </p>
                            
                            {/* Avertissements de stock */}
                            {!item.isDigital && item.inStock <= item.quantity && (
                              <div className="flex items-center gap-1 mb-2">
                                <AlertCircle size={14} className="text-amber-500" />
                                <span className="text-xs text-amber-600">
                                  {item.inStock === 0 ? 'Rupture de stock' : 'Stock limité'}
                                </span>
                              </div>
                            )}
                            
                            {/* Contrôles de quantité */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.storeId, item.quantity - 1)}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  
                                  <span className="font-medium min-w-[30px] text-center">
                                    {item.quantity}
                                  </span>
                                  
                                  <button
                                    onClick={() => updateQuantity(item.id, item.storeId, item.quantity + 1)}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!item.isDigital && item.quantity >= item.inStock}
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                
                                <button
                                  onClick={() => removeFromCart(item.id, item.storeId)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer du panier"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-semibold text-gray-800">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Résumé de la commande */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Résumé de la commande
              </h3>
              
              {/* Détails par boutique */}
              <div className="space-y-3 mb-4">
                {storeIds.map(storeId => {
                  const storeData = itemsByStore[storeId];
                  const storeTotal = storeData.items.reduce(
                    (total, item) => total + (item.price * item.quantity), 
                    0
                  );
                  
                  return (
                    <div key={storeId} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate mr-2">
                        {storeData.storeInfo.name} ({storeData.items.length} article{storeData.items.length !== 1 ? 's' : ''})
                      </span>
                      <span className="font-medium">
                        {formatPrice(storeTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Sous-total</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="text-green-600">Gratuit</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Taxes</span>
                  <span>Incluses</span>
                </div>
              </div>
              
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-orange-500">{formatPrice(totalAmount)}</span>
                </div>
              </div>
              
              {/* Informations de livraison */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck size={16} className="text-green-500" />
                  <span>Livraison gratuite</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package size={16} className="text-blue-500" />
                  <span>Emballage sécurisé</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard size={16} className="text-purple-500" />
                  <span>Paiement sécurisé</span>
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  icon={isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  iconPosition="left"
                >
                  {isProcessing ? 'Traitement...' : 'Passer la commande'}
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => navigate('/')}
                >
                  Continuer mes achats
                </Button>
              </div>
              
              {/* Note de sécurité */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  🔒 Vos informations sont protégées par un cryptage SSL
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Suggestions ou produits recommandés */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Vous pourriez aussi aimer
            </h3>
            <p className="text-gray-600 text-sm">
              Découvrez d'autres produits de vos boutiques favorites.
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                Explorer les boutiques
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CartPage;