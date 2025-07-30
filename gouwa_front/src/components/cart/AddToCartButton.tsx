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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isInCartAlready = isInCart(product.id, storeInfo.id);
  const currentQuantity = getCartItemQuantity(product.id, storeInfo.id);
  
  const isOutOfStock = !product.isDigital && product.inStock <= 0;
  const willExceedStock = !product.isDigital && 
    (currentQuantity + quantity) > product.inStock;

  const handleAddToCart = async () => {
    // Vérifier l'authentification en premier
    if (!isAuthenticated) {
      // Sauvegarder l'intention d'ajout au panier
      sessionStorage.setItem('pendingCartItem', JSON.stringify({
        product,
        quantity,
        storeInfo,
        returnUrl: window.location.href
      }));
      
      // Rediriger vers la page de connexion
      navigate('/auth/login');
      return;
    }

    if (isOutOfStock || willExceedStock || disabled || authLoading) return;

    setIsAdding(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Animation delay
      addToCart(product, quantity, storeInfo);
      
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
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

  // Déterminer la variante du bouton en fonction de l'état
  const getButtonVariant = () => {
    if (!isAuthenticated) {
      return "outline";
    }
    if (justAdded) {
      return "success";
    }
    if (isOutOfStock || willExceedStock) {
      return "outline";
    }
    return variant;
  };

  // Déterminer le style du bouton
  const getButtonStyle = () => {
    if (!isAuthenticated) {
      return {
        borderColor: storeInfo.accentColor || '#F25539',
        color: storeInfo.accentColor || '#F25539'
      };
    }
    
    if (justAdded || isOutOfStock || willExceedStock) {
      return undefined; // Utiliser les styles par défaut
    }
    
    if (storeInfo.accentColor) {
      return { backgroundColor: storeInfo.accentColor };
    }
    
    return undefined;
  };

  return (
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
  );
};

export default AddToCartButton;