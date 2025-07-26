import { useState } from 'react';
// import React, { createContext, useContext, useState, useEffect } from 'react';

// import { useParams, useNavigate } from 'react-router-dom';
// import { useCartStore } from '../../stores/cartStore';
// import Container from '../common/Container';
// import Button from '../common/Button';

// Mock implementations for demo
const useParams = () => ({ storeId: 'store-1' });
const useNavigate = () => (path) => console.log('Navigate to:', path);
const useCartStore = () => ({
  getStoreItems: (storeId) => [
    { productId: '1', name: 'Produit Test 1', price: 25000, quantity: 2, image: 'https://via.placeholder.com/150', isDigital: false },
    { productId: '2', name: 'Produit Digital', price: 15000, quantity: 1, image: 'https://via.placeholder.com/150', isDigital: true }
  ],
  getTotalPrice: (storeId) => 65000,
  clearCart: () => console.log('Cart cleared')
});

const Container = ({ children, size }) => (
  <div className={`mx-auto px-4 ${size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-7xl' : 'max-w-4xl'}`}>
    {children}
  </div>
);

const Button = ({ children, variant, fullWidth, isLoading, onClick, disabled, className }) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
      variant === 'primary' 
        ? 'bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-400' 
        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
    } ${fullWidth ? 'w-full' : ''} ${className || ''} ${isLoading ? 'opacity-75' : ''}`}
  >
    {isLoading ? (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        {children}
      </div>
    ) : children}
  </button>
);
import { CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';

type PaymentMethod = 'mtn' | 'orange' | 'moov' | 'wave' | 'bank' | 'visa' | 'mastercard';

const CheckoutPage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { getStoreItems, getTotalPrice, clearCart } = useCartStore();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const items = storeId ? getStoreItems(storeId) : [];
  const total = storeId ? getTotalPrice(storeId) : 0;
  
  if (!storeId || items.length === 0) {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <Container size="sm">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <h2 className="text-xl font-semibold mb-2">Panier vide</h2>
            <p className="text-gray-600 mb-4">
              Votre panier est vide ou la boutique n'existe pas.
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </div>
        </Container>
      </div>
    );
  }
  
  const paymentMethods = [
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/MTN_Logo.svg/200px-MTN_Logo.svg.png',
      fallbackIcon: <Smartphone className="h-6 w-6" />,
      color: 'bg-yellow-400',
      description: 'Paiement via MTN Money',
      fields: ['phone']
    },
    {
      id: 'orange',
      name: 'Orange Money',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/200px-Orange_logo.svg.png',
      fallbackIcon: <Smartphone className="h-6 w-6" />,
      color: 'bg-orange-500',
      description: 'Paiement via Orange Money',
      fields: ['phone']
    },
    {
      id: 'moov',
      name: 'Moov Money',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Moov_logo.svg/200px-Moov_logo.svg.png',
      fallbackIcon: <Smartphone className="h-6 w-6" />,
      color: 'bg-blue-500',
      description: 'Paiement via Moov Money',
      fields: ['phone']
    },
    {
      id: 'wave',
      name: 'Wave',
      logoUrl: 'https://wave.com/img/logo-wave.png',
      fallbackIcon: <Wallet className="h-6 w-6" />,
      color: 'bg-teal-500',
      description: 'Paiement via Wave',
      fields: ['phone']
    },
    {
      id: 'visa',
      name: 'Visa',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png',
      fallbackIcon: <CreditCard className="h-6 w-6" />,
      color: 'bg-blue-600',
      description: 'Carte Visa',
      fields: ['card']
    },
    {
      id: 'mastercard',
      name: 'Mastercard',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png',
      fallbackIcon: <CreditCard className="h-6 w-6" />,
      color: 'bg-red-500',
      description: 'Carte Mastercard',
      fields: ['card']
    },
    {
      id: 'bank',
      name: 'Virement bancaire',
      logoUrl: null,
      fallbackIcon: <Building2 className="h-6 w-6" />,
      color: 'bg-gray-600',
      description: 'Virement vers compte bancaire',
      fields: ['bank']
    },
  ];
  
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Validation des champs requis
      const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
      
      if (selectedMethod?.fields.includes('phone') && !phoneNumber) {
        alert('Veuillez saisir votre numéro de téléphone');
        setIsProcessing(false);
        return;
      }
      
      if (selectedMethod?.fields.includes('card') && (!cardNumber || !expiryDate || !cvv)) {
        alert('Veuillez remplir toutes les informations de carte');
        setIsProcessing(false);
        return;
      }
      
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      // Clear cart and redirect to success page
      clearCart();
      navigate('/checkout/success');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const PaymentMethodLogo = ({ method }) => {
    const [imageError, setImageError] = useState(false);
    
    if (!method.logoUrl || imageError) {
      return (
        <div className={`${method.color} p-3 rounded-lg text-white flex items-center justify-center`}>
          {method.fallbackIcon}
        </div>
      );
    }
    
    return (
      <div className="p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
        <img
          src={method.logoUrl}
          alt={method.name}
          className="h-8 w-auto max-w-12 object-contain"
          onError={() => setImageError(true)}
        />
      </div>
    );
  };
  
  const renderPaymentFields = () => {
    const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
    
    if (!selectedMethod) return null;
    
    if (selectedMethod.fields.includes('phone')) {
      return (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone *
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3"
              placeholder="+225 07 XX XX XX XX"
              required
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Vous recevrez un message sur votre téléphone pour confirmer le paiement.
            </p>
          </div>
        </div>
      );
    }
    
    if (selectedMethod.fields.includes('card')) {
      return (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de carte *
            </label>
            <input
              type="text"
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim())}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Date d'expiration *
              </label>
              <input
                type="text"
                id="expiryDate"
                value={expiryDate}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value.replace(/(\d{2})(\d{0,2})/, '$1/$2');
                  setExpiryDate(formatted);
                }}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3"
                placeholder="MM/AA"
                maxLength={5}
                required
              />
            </div>
            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                CVV *
              </label>
              <input
                type="text"
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3"
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Sécurisé:</strong> Vos informations de carte sont cryptées et sécurisées.
            </p>
          </div>
        </div>
      );
    }
    
    if (selectedMethod.fields.includes('bank')) {
      return (
        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-4 text-gray-900">Informations bancaires</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">IBAN:</span>
                <span className="font-mono">CI93 CI93 0100 0100 1234 5678 90</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">BIC:</span>
                <span className="font-mono">ECOCCIAB</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Banque:</span>
                <span>ECOBANK CÔTE D'IVOIRE</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Bénéficiaire:</span>
                <span>VOTRE ENTREPRISE SARL</span>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Après le virement, veuillez nous envoyer le reçu par email ou WhatsApp pour confirmation.
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <Container size="lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finaliser votre commande</h1>
          <p className="text-gray-600">Choisissez votre mode de paiement et confirmez votre achat</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Résumé de la commande</h2>
              
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500">
                        {item.isDigital ? 'Digital' : `Qty: ${item.quantity}`}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {(item.price * item.quantity).toLocaleString()} FCFA
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900">Total</p>
                  <p className="text-2xl font-bold text-orange-600">{total.toLocaleString()} FCFA</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold mb-8 text-gray-900">Mode de paiement</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`relative flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      paymentMethod === method.id
                        ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="h-5 w-5 text-orange-500 focus:ring-orange-500 border-gray-300"
                    />
                    <div className="ml-4 flex items-center space-x-4 flex-1">
                      <PaymentMethodLogo method={method} />
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-gray-900">{method.name}</span>
                        <span className="block text-sm text-gray-500 truncate">{method.description}</span>
                      </div>
                    </div>
                    {paymentMethod === method.id && (
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              
              {renderPaymentFields()}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="primary"
                  fullWidth
                  isLoading={isProcessing}
                  onClick={handlePayment}
                  className="py-4 text-lg font-semibold"
                >
                  {isProcessing
                    ? 'Traitement en cours...'
                    : `Payer ${total.toLocaleString()} FCFA`}
                </Button>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  En cliquant sur "Payer", vous acceptez nos conditions d'utilisation
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CheckoutPage;