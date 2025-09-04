// components/cart/AddToCartButton.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, AlertCircle, LogIn } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const AddToCartButton = ({ 
  product, 
  storeInfo, 
  quantity = 1, 
  variant = "primary",
  size = "default",
  fullWidth = false,
  disabled = false,
  className = "",
  ...props 
}) => {
  const { addToCart, isInCart, getCartItemQuantity } = useCart();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState(null);

  const isInCartAlready = isInCart(product.id, storeInfo.id);
  const currentQuantity = getCartItemQuantity(product.id, storeInfo.id);
  
  const isOutOfStock = !product.isDigital && product.inStock <= 0;
  const willExceedStock = !product.isDigital && 
    (currentQuantity + quantity) > product.inStock;

  const handleAddToCart = async () => {
    // Vérifier l'authentification
    if (!isAuthenticated) {
      // Sauvegarder l'intention d'ajout au panier
      const pendingItem = {
        product,
        quantity,
        storeInfo,
        returnUrl: window.location.href,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem('pendingCartItem', JSON.stringify(pendingItem));
      } catch (e) {
        // Fallback si localStorage n'est pas disponible
        console.warn('localStorage not available, using sessionStorage');
        sessionStorage.setItem('pendingCartItem', JSON.stringify(pendingItem));
      }
      
      navigate('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (isOutOfStock || willExceedStock || disabled || authLoading) return;

    setIsAdding(true);
    setError(null);
    
    try {
      // CORRECTION : Vérification simplifiée de la disponibilité
      // Utilisation des données locales au lieu d'un appel API potentiellement défaillant
      if (!product.isDigital) {
        const totalRequestedQuantity = currentQuantity + quantity;
        if (totalRequestedQuantity > product.inStock) {
          setError(`Stock insuffisant. Disponible: ${product.inStock}, dans le panier: ${currentQuantity}`);
          return;
        }
      }

      // Appeler addToCart avec les bons paramètres
      addToCart(product, quantity, storeInfo);
      
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 3000);
      
      // Analytics/tracking
      if (window.gtag) {
        window.gtag('event', 'add_to_cart', {
          currency: 'XOF',
          value: product.price * quantity,
          items: [{
            item_id: product.id,
            item_name: product.name,
            category: product.category,
            quantity: quantity,
            price: product.price
          }]
        });
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      setError(error.message || 'Erreur lors de l\'ajout au panier');
    } finally {
      setIsAdding(false);
    }
  };

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
        text: "Se connecter pour acheter"
      };
    }
    
    if (isAdding) {
      return {
        icon: <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />,
        text: "Ajout..."
      };
    }
    
    if (justAdded) {
      return {
        icon: <Check size={16} />,
        text: "Ajouté !"
      };
    }
    
    if (isOutOfStock) {
      return {
        icon: <AlertCircle size={16} />,
        text: "Rupture de stock"
      };
    }
    
    if (willExceedStock) {
      return {
        icon: <AlertCircle size={16} />,
        text: "Stock insuffisant"
      };
    }
    
    if (isInCartAlready) {
      return {
        icon: <ShoppingCart size={16} />,
        text: `Ajouter (${currentQuantity} dans le panier)`
      };
    }
    
    return {
      icon: <ShoppingCart size={16} />,
      text: product.isDigital ? "Acheter maintenant" : "Ajouter au panier"
    };
  };

  const buttonContent = getButtonContent();
  const isButtonDisabled = disabled || isAdding || authLoading || 
    (isAuthenticated && (isOutOfStock || willExceedStock));

  const getButtonVariant = () => {
    if (!isAuthenticated) return "outline";
    if (justAdded) return "success";
    if (isOutOfStock || willExceedStock) return "outline";
    return variant;
  };

  const getButtonStyle = () => {
    if (!isAuthenticated) {
      return {
        borderColor: storeInfo.accentColor || '#F25539',
        color: storeInfo.accentColor || '#F25539'
      };
    }
    
    if (justAdded || isOutOfStock || willExceedStock) {
      return undefined;
    }
    
    if (storeInfo.accentColor) {
      return { backgroundColor: storeInfo.accentColor };
    }
    
    return undefined;
  };

  return (
    <div className="relative">
      <Button
        variant={getButtonVariant()}
        size={size}
        fullWidth={fullWidth}
        disabled={isButtonDisabled}
        onClick={handleAddToCart}
        icon={buttonContent.icon}
        iconPosition="left"
        className={`transition-all duration-200 ${
          justAdded ? 'bg-green-500 hover:bg-green-600 border-green-500' : ''
        } ${
          isOutOfStock || willExceedStock ? 'text-red-600 border-red-200 hover:bg-red-50' : ''
        } ${
          !isAuthenticated ? 'hover:bg-opacity-10' : ''
        } ${className}`}
        style={getButtonStyle()}
        {...props}
      >
        {buttonContent.text}
      </Button>
      
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;