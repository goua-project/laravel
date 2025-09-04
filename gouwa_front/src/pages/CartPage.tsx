// pages/CartPage.js
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
  AlertCircle,
  History,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import OrderProductButton from '../components/cart/OrderProductButton';
import OrderHistory from '../pages/OrderHistory';
import ProduitService from '../services/produitService';

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getItemsByStore 
  } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' ou 'history'

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
  const hasItems = items.length > 0;

  // Gérer le succès de la commande
  const handleOrderSuccess = (orderResult) => {
    console.log('Commande créée avec succès:', orderResult);
    
    // Vider le panier après une commande réussie
    clearCart();
    
    // Passer à l'onglet historique pour voir la nouvelle commande
    setActiveTab('history');
    
    // Optionnel: Afficher une notification de succès
    // Vous pouvez implémenter un système de toast/notification ici
  };

  // Gérer les erreurs de commande
  const handleOrderError = (error) => {
    console.error('Erreur lors de la commande:', error);
    // L'erreur est déjà gérée par le composant OrderProductButton
  };

  // Préparer les données de commande pour chaque boutique
  const prepareOrderData = (storeData) => {
    const cartItems = storeData.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      isDigital: item.isDigital,
      type: item.isDigital ? 'digital' : 'physique'
    }));

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cartItems,
      price: totalPrice,
      totalQuantity,
      isCartOrder: true
    };
  };

  // Composant d'onglets
  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-8">
        <button
          onClick={() => setActiveTab('cart')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'cart'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} />
            Mon Panier
            {hasItems && (
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                {items.length}
              </span>
            )}
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'history'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <History size={16} />
            Mes Commandes
          </div>
        </button>
      </nav>
    </div>
  );

  // Vue du panier vide
  const EmptyCartView = () => (
    <div className="text-center py-12">
      <ShoppingBag size={80} className="text-gray-300 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Votre panier est vide</h2>
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
        
        {isAuthenticated && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setActiveTab('history')}
              icon={<History size={16} />}
              iconPosition="left"
            >
              Voir mes commandes précédentes
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // Vue du contenu du panier
  const CartContentView = () => (
    <>
      {/* Header du panier */}
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
            <h2 className="text-xl font-bold text-gray-800">Contenu du panier</h2>
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

                {/* Bouton de commande par boutique */}
                <div className="p-4 border-t bg-gray-50">
                  <OrderProductButton
                    product={prepareOrderData(storeData)}
                    storeInfo={storeData.storeInfo}
                    variant="primary"
                    size="default"
                    fullWidth={true}
                    onOrderSuccess={handleOrderSuccess}
                    onOrderError={handleOrderError}
                    disabled={storeData.items.some(item => 
                      !item.isDigital && item.inStock <= 0
                    )}
                  />
                  {storeData.items.some(item => !item.isDigital && item.inStock <= 0) && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      Certains produits ne sont plus en stock
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Résumé de la commande */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Résumé du panier
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
            
            {/* Note importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Commande par boutique</p>
                  <p>
                    Vous devez passer une commande séparée pour chaque boutique. 
                    Utilisez les boutons "Commander" dans chaque section boutique.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Boutons d'action globaux */}
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/')}
              >
                Continuer mes achats
              </Button>
              
              {isAuthenticated && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setActiveTab('history')}
                  icon={<History size={16} />}
                  iconPosition="left"
                >
                  Voir mes commandes
                </Button>
              )}
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
      
      {/* Suggestions */}
      <div className="mt-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Vous pourriez aussi aimer
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Découvrez d'autres produits de vos boutiques favorites.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              Explorer les boutiques
            </Button>
            
            {isAuthenticated && (
              <Button
                variant="outline"
                onClick={() => setActiveTab('history')}
                icon={<History size={16} />}
                iconPosition="left"
              >
                Mes commandes
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Header principal */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={16} />}
            iconPosition="left"
          >
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mon Espace Shopping</h1>
            <p className="text-gray-600">
              Gérez votre panier et consultez vos commandes
            </p>
          </div>
        </div>

        {/* Navigation par onglets */}
        <TabNavigation />

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'cart' ? (
          hasItems ? (
            <CartContentView />
          ) : (
            <EmptyCartView />
          )
        ) : (
          <OrderHistory className="shadow-sm" />
        )}
      </Container>
    </div>
  );
};

export default CartPage;