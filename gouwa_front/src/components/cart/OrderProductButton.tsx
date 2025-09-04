import React, { useState } from 'react';
import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Smartphone, 
  QrCode, 
  Globe, 
  Zap, 
  AlertCircle, 
  Check,
  X,
  LogIn,
  MapPin,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import CommandeApiService from '../../services/commandeApiService';

const OrderProductButton = ({ 
  product,
  storeInfo,
  quantity = 1,
  variant = "primary",
  size = "default",
  fullWidth = true,
  className = "",
  onOrderSuccess,
  onOrderError,
  disabled = false,
  ...props 
}) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const [isOrdering, setIsOrdering] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentStep, setCurrentStep] = useState('method');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  
  const [orderForm, setOrderForm] = useState({
    paymentMethod: null,
    kaliaType: null,
    kaliaProvider: null,
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    customerName: user?.name || '',
    deliveryAddress: '',
    deliveryNotes: ''
  });

  // Fonction utilitaire pour formater les prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  // Helpers
  const hasPhysicalProducts = () => {
    if (product.cartItems) {
      return product.cartItems.some(item => item.type === 'physique' || !item.isDigital);
    }
    return product.type === 'physique' || !product.isDigital;
  };

  const paymentMethods = [
    {
      id: 'kaliapay',
      name: 'KaliaPay',
      icon: <Smartphone size={20} />,
      description: 'Paiement mobile sécurisé (Orange Money, Wave, MTN, etc.)',
      available: true
    },
    {
      id: 'en_ligne',
      name: 'Carte bancaire',
      icon: <CreditCard size={20} />,
      description: 'Visa, Mastercard via passerelle sécurisée',
      available: true
    },
    ...(hasPhysicalProducts() ? [{
      id: 'a_la_livraison',
      name: 'Paiement à la livraison',
      icon: <Truck size={20} />,
      description: 'Payez en espèces lors de la réception',
      available: true
    }] : [])
  ];

  const kaliaPayTypes = [
    {
      value: 'webpay',
      label: 'WebPay',
      description: 'Redirection vers la page de paiement KaliaPay',
      icon: <Globe size={16} />
    },
    {
      value: 'flash',
      label: 'Flash Pay',
      description: 'Paiement direct avec votre provider',
      icon: <Zap size={16} />
    },
    {
      value: 'mobpay',
      label: 'MobPay (QR Code)',
      description: 'Paiement par QR Code mobile',
      icon: <QrCode size={16} />
    },
    {
      value: 'eshoppay',
      label: 'eShopPay (QR Code)',
      description: 'Paiement par QR Code e-commerce',
      icon: <QrCode size={16} />
    }
  ];

  const kaliaProviders = [
    { value: 'orangeci', label: 'Orange Money CI', icon: '🟠' },
    { value: 'waveci', label: 'Wave CI', icon: '🌊' },
    { value: 'mtnci', label: 'MTN Mobile Money CI', icon: '🟡' },
    { value: 'cards', label: 'Cartes bancaires', icon: '💳' }
  ];

  const updateOrderForm = (updates) => {
    setOrderForm(prev => ({ ...prev, ...updates }));
  };

  // Validation du formulaire
  const validateForm = () => {
    const { paymentMethod, kaliaType, kaliaProvider, customerPhone, deliveryAddress } = orderForm;
    
    if (!paymentMethod) return 'Veuillez sélectionner une méthode de paiement';
    
    if (paymentMethod === 'kaliapay') {
      if (!kaliaType) return 'Veuillez sélectionner un type de paiement KaliaPay';
      
      if (kaliaType === 'flash') {
        if (!kaliaProvider) return 'Veuillez sélectionner un fournisseur';
        if (!customerPhone || customerPhone.length !== 10) {
          return 'Veuillez entrer un numéro de téléphone valide (10 chiffres)';
        }
      }
    }
    
    if (hasPhysicalProducts() && paymentMethod !== 'a_la_livraison') {
      if (!deliveryAddress.trim()) return 'Veuillez entrer une adresse de livraison';
    }
    
    if (paymentMethod === 'a_la_livraison') {
      if (!deliveryAddress.trim()) return 'L\'adresse de livraison est obligatoire pour le paiement à la livraison';
    }
    
    return null;
  };

  // Traitement de la commande avec le service API
  const processOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsOrdering(true);
    setCurrentStep('processing');
    setError(null);

    try {
      // Préparer les données selon le format Laravel attendu
      const commandeData = {
        boutique_id: storeInfo.id,
        methode_paiement: orderForm.paymentMethod,
        notes: orderForm.deliveryNotes,
        custom_data: `commande_user_${user.id}_${Date.now()}`
      };

      // Ajouter les produits
      if (product.cartItems) {
        commandeData.produits = product.cartItems.map(item => ({
          id: item.id,
          quantite: item.quantity
        }));
      } else {
        commandeData.produits = [{
          id: product.id,
          quantite: quantity
        }];
      }

      // Ajouter les détails selon la méthode de paiement
      if (orderForm.paymentMethod === 'kaliapay') {
        commandeData.type_paiement_kalia = orderForm.kaliaType;
        
        if (orderForm.kaliaType === 'flash') {
          commandeData.provider_kalia = orderForm.kaliaProvider;
          commandeData.customer_phone = orderForm.customerPhone;
        }
      }

      if (orderForm.paymentMethod === 'a_la_livraison') {
        commandeData.adresse_livraison = orderForm.deliveryAddress;
      }

      // Utiliser le service API
      let result;
      if (orderForm.paymentMethod === 'kaliapay') {
        result = await CommandeApiService.creerCommandeKaliaPay({
          ...commandeData,
          provider_kalia: orderForm.kaliaProvider,
          customer_phone: orderForm.customerPhone
        });
      } else if (orderForm.paymentMethod === 'a_la_livraison') {
        result = await CommandeApiService.creerCommandeLivraison({
          boutique_id: commandeData.boutique_id,
          produits: commandeData.produits,
          adresse_livraison: orderForm.deliveryAddress,
          notes: commandeData.notes
        });
      } else {
        result = await CommandeApiService.creerCommande(commandeData);
      }

      if (result.success) {
        setOrderData(result.data);
        setCurrentStep('success');
        
        // Traitement selon le type de paiement retourné
        setTimeout(() => {
          if (result.data.paiement) {
            handlePaymentRedirection(result.data.paiement);
          }
          
          onOrderSuccess?.(result.data);
        }, 2000);

        // Analytics
        if (window.gtag) {
          const items = product.cartItems || [{ 
            id: product.id, 
            name: product.name, 
            category: product.category,
            quantity: quantity,
            price: product.price 
          }];
          
          window.gtag('event', 'purchase', {
            transaction_id: result.data.commande.reference,
            value: result.data.commande.montant_total,
            currency: 'XOF',
            items: items.map(item => ({
              item_id: item.id,
              item_name: item.name,
              category: item.category || 'Produit',
              quantity: item.quantity || quantity,
              price: item.price || product.price
            }))
          });
        }
        
      } else {
        throw new Error(result.message || 'Erreur lors de la création de la commande');
      }
      
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      setError(error.message || 'Une erreur est survenue lors de la commande');
      setCurrentStep('method');
      onOrderError?.(error);
    } finally {
      setIsOrdering(false);
    }
  };

  // Gestion des redirections de paiement
  const handlePaymentRedirection = (paymentData) => {
    switch (paymentData.type) {
      case 'webpay_redirect':
        if (paymentData.redirect_url) {
          window.open(paymentData.redirect_url, '_blank', 'noopener,noreferrer');
        }
        break;
        
      case 'flash_pay':
        if (paymentData.payment_url) {
          window.open(paymentData.payment_url, '_blank', 'noopener,noreferrer');
        }
        break;
        
      case 'mobpay_qr':
      case 'eshoppay_qr':
        if (paymentData.qrcode_url) {
          window.open(paymentData.qrcode_url, '_blank', 'width=400,height=500');
        }
        break;
        
      case 'standard_online':
        if (paymentData.url_paiement) {
          window.open(paymentData.url_paiement, '_blank', 'noopener,noreferrer');
        }
        break;
        
      case 'cash_on_delivery':
        // Pas de redirection nécessaire
        break;
        
      default:
        console.warn('Type de paiement non reconnu:', paymentData.type);
    }
  };

  // Gestion du clic principal
  const handleOrderClick = () => {
    if (!isAuthenticated) {
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      window.location.href = loginUrl;
      return;
    }

    if (disabled) return;
    
    setShowPaymentModal(true);
    setCurrentStep('method');
  };

  // Fermer le modal
  const closeModal = () => {
    if (currentStep === 'processing') return;
    
    setShowPaymentModal(false);
    setCurrentStep('method');
    setError(null);
    setOrderData(null);
    
    // Reset form
    setOrderForm({
      paymentMethod: null,
      kaliaType: null,
      kaliaProvider: null,
      customerPhone: user?.phone || '',
      customerEmail: user?.email || '',
      customerName: user?.name || '',
      deliveryAddress: '',
      deliveryNotes: ''
    });
  };

  // Contenu du bouton principal
  const getButtonContent = () => {
    if (authLoading) {
      return {
        icon: <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />,
        text: "Chargement..."
      };
    }

    if (!isAuthenticated) {
      return {
        icon: <LogIn size={16} />,
        text: "Se connecter pour commander"
      };
    }

    if (disabled) {
      return {
        icon: <AlertCircle size={16} />,
        text: "Commande indisponible"
      };
    }

    if (product.cartItems) {
      return {
        icon: <ShoppingBag size={16} />,
        text: `Commander (${product.totalQuantity} articles)`
      };
    }

    return {
      icon: <ShoppingBag size={16} />,
      text: product.isDigital ? "Acheter maintenant" : "Commander maintenant"
    };
  };

  const buttonContent = getButtonContent();

  // Étape 1: Sélection méthode de paiement
  const PaymentMethodStep = () => (
    <div className="space-y-6">
      {/* Récapitulatif produit */}
      <ProductSummary />

      {/* Méthodes de paiement */}
      <div>
        <h4 className="font-medium mb-3">Choisissez votre méthode de paiement</h4>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                orderForm.paymentMethod === method.id
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={orderForm.paymentMethod === method.id}
                onChange={(e) => updateOrderForm({ paymentMethod: e.target.value })}
                disabled={!method.available}
                className="sr-only"
              />
              <div className="flex items-center space-x-3 flex-1">
                {method.icon}
                <div>
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm text-gray-600">{method.description}</div>
                  {!method.available && (
                    <div className="text-xs text-red-500 mt-1">Temporairement indisponible</div>
                  )}
                </div>
              </div>
              {orderForm.paymentMethod === method.id && method.available && (
                <Check size={16} className="text-blue-500" />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* KaliaPay options */}
      {orderForm.paymentMethod === 'kaliapay' && <KaliaPayOptions />}

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
        <Button variant="outline" onClick={closeModal} fullWidth>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={() => setCurrentStep('details')}
          disabled={!orderForm.paymentMethod}
          fullWidth
        >
          Continuer
        </Button>
      </div>
    </div>
  );

  // Options KaliaPay
  const KaliaPayOptions = () => (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h5 className="font-medium">Configuration KaliaPay</h5>
      
      {/* Type KaliaPay */}
      <div>
        <label className="block text-sm font-medium mb-2">Type de paiement</label>
        <div className="space-y-2">
          {kaliaPayTypes.map((type) => (
            <label
              key={type.value}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                orderForm.kaliaType === type.value
                  ? 'border-blue-500 bg-white'
                  : 'border-gray-200 hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="kaliaType"
                value={type.value}
                checked={orderForm.kaliaType === type.value}
                onChange={(e) => updateOrderForm({ kaliaType: e.target.value })}
                className="sr-only"
              />
              <div className="flex items-center space-x-3 flex-1">
                {type.icon}
                <div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-600">{type.description}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Provider et téléphone pour Flash Pay */}
      {orderForm.kaliaType === 'flash' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Fournisseur</label>
            <select
              value={orderForm.kaliaProvider}
              onChange={(e) => updateOrderForm({ kaliaProvider: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un fournisseur</option>
              {kaliaProviders.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.icon} {provider.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={orderForm.customerPhone}
              onChange={(e) => updateOrderForm({ 
                customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) 
              })}
              placeholder="0123456789"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: 10 chiffres sans espaces
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Étape 2: Détails de commande
  const OrderDetailsStep = () => (
    <div className="space-y-6">
      {/* Récapitulatif */}
      <ProductSummary />

      {/* Informations client */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <User size={16} />
          Informations client
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nom complet</label>
            <input
              type="text"
              value={orderForm.customerName}
              onChange={(e) => updateOrderForm({ customerName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Votre nom complet"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={orderForm.customerEmail}
              onChange={(e) => updateOrderForm({ customerEmail: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="votre@email.com"
            />
          </div>
        </div>
      </div>

      {/* Adresse de livraison pour produits physiques */}
      {(hasPhysicalProducts() || orderForm.paymentMethod === 'a_la_livraison') && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <MapPin size={16} />
            Livraison {orderForm.paymentMethod === 'a_la_livraison' && <span className="text-red-500">*</span>}
          </h4>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Adresse complète de livraison
            </label>
            <textarea
              value={orderForm.deliveryAddress}
              onChange={(e) => updateOrderForm({ deliveryAddress: e.target.value })}
              placeholder="Rue, quartier, commune, ville..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Instructions de livraison (optionnel)
            </label>
            <textarea
              value={orderForm.deliveryNotes}
              onChange={(e) => updateOrderForm({ deliveryNotes: e.target.value })}
              placeholder="Étage, point de repère, créneaux horaires..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Récapitulatif paiement */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Récapitulatif</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Méthode:</span>
            <span className="font-medium">
              {paymentMethods.find(m => m.id === orderForm.paymentMethod)?.name}
            </span>
          </div>
          
          {orderForm.kaliaType && (
            <div className="flex justify-between">
              <span>Type KaliaPay:</span>
              <span className="font-medium">
                {kaliaPayTypes.find(t => t.value === orderForm.kaliaType)?.label}
              </span>
            </div>
          )}
          
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>{formatPrice(product.cartItems ? product.price : product.price * quantity)}</span>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('method')}
          disabled={isOrdering}
        >
          Retour
        </Button>
        <Button
          variant="primary"
          onClick={processOrder}
          disabled={isOrdering}
          fullWidth
          icon={isOrdering ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Check size={16} />
          )}
        >
          {isOrdering ? 'Création...' : 'Confirmer la commande'}
        </Button>
      </div>
    </div>
  );

  // Étape de traitement
  const ProcessingStep = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
      <h4 className="text-lg font-medium mb-2">Traitement de votre commande</h4>
      <p className="text-gray-600">Veuillez patienter...</p>
    </div>
  );

  // Étape de succès
  const SuccessStep = () => (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check size={32} className="text-green-600" />
      </div>
      
      <div>
        <h4 className="text-lg font-medium text-green-600 mb-2">Commande créée avec succès!</h4>
        <p className="text-gray-600">
          Référence: <span className="font-mono font-medium">{orderData?.commande?.reference}</span>
        </p>
      </div>

      {orderData?.paiement && (
        <div className="bg-blue-50 p-4 rounded-lg text-left">
          <p className="text-sm text-blue-800">
            {orderData.paiement.type === 'webpay_redirect' && 'Redirection vers la page de paiement...'}
            {orderData.paiement.type === 'flash_pay' && 'Ouverture de l\'application de paiement...'}
            {orderData.paiement.type === 'mobpay_qr' && 'QR Code généré pour le paiement...'}
            {orderData.paiement.type === 'eshoppay_qr' && 'QR Code généré pour le paiement...'}
            {orderData.paiement.type === 'cash_on_delivery' && 'Paiement à effectuer à la livraison'}
            {orderData.paiement.type === 'standard_online' && 'Redirection vers le paiement sécurisé...'}
          </p>
        </div>
      )}

      <Button variant="primary" onClick={closeModal} fullWidth>
        Fermer
      </Button>
    </div>
  );

  // Récapitulatif produit
  const ProductSummary = () => {
    if (product.cartItems) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ShoppingBag size={16} />
            Votre commande chez {storeInfo.name}
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {product.cartItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm py-1">
                <span className="flex-1 truncate">{item.name} (×{item.quantity})</span>
                <span className="font-medium ml-2">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-3">
            <div className="flex justify-between items-center font-semibold">
              <span>Total</span>
              <span className="text-lg text-green-600">{formatPrice(product.price)}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          {product.image && (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1">
            <h4 className="font-medium text-gray-800">{product.name}</h4>
            <p className="text-sm text-gray-600">
              Quantité: {quantity} × {formatPrice(product.price)}
            </p>
            <p className="font-semibold text-lg text-green-600">
              Total: {formatPrice(product.price * quantity)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Modal de paiement
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {currentStep === 'method' ? 'Méthode de paiement' :
               currentStep === 'details' ? 'Détails de commande' :
               currentStep === 'processing' ? 'Traitement...' :
               'Commande confirmée'}
            </h3>
            <button
              onClick={closeModal}
              disabled={currentStep === 'processing'}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenu selon l'étape */}
          {currentStep === 'method' && <PaymentMethodStep />}
          {currentStep === 'details' && <OrderDetailsStep />}
          {currentStep === 'processing' && <ProcessingStep />}
          {currentStep === 'success' && <SuccessStep />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || authLoading}
        onClick={handleOrderClick}
        icon={buttonContent.icon}
        iconPosition="left"
        className={`transition-all duration-200 ${
          disabled ? 'text-red-600 border-red-200 hover:bg-red-50' : ''
        } ${
          !isAuthenticated ? 'hover:bg-opacity-10' : ''
        } ${className}`}
        style={
          !isAuthenticated 
            ? {
                borderColor: storeInfo.accentColor || '#F25539',
                color: storeInfo.accentColor || '#F25539'
              }
            : storeInfo.accentColor && !disabled
            ? { backgroundColor: storeInfo.accentColor }
            : undefined
        }
        {...props}
      >
        {buttonContent.text}
      </Button>

      {showPaymentModal && <PaymentModal />}
    </>
  );
};

export default OrderProductButton;