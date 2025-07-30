import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BoutiqueService from '../services/boutiqueService';
import ProduitService from '../services/produitService';
import Button from '../components/common/Button';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Share2,
  Loader2,
  Package
} from 'lucide-react';
import Container from '../components/common/Container';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import CartIcon from '../components/cart/CartIcon';
import CartDrawer from '../components/cart/CartDrawer';
import AddToCartButton from '../components/cart/AddToCartButton';

const StorePage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Écouter l'événement d'ajout d'élément en attente
  useEffect(() => {
    const handleAddPendingCartItem = (event) => {
      const { product, quantity, storeInfo } = event.detail;
      addToCart(product, quantity, storeInfo);
    };

    window.addEventListener('addPendingCartItem', handleAddPendingCartItem);
    return () => {
      window.removeEventListener('addPendingCartItem', handleAddPendingCartItem);
    };
  }, [addToCart]);
  
  // Fonction pour vérifier l'authentification avant d'ajouter au panier
  const checkAuthAndAddToCart = async (product, quantity = 1, storeInfo) => {
    if (!isAuthenticated) {
      // Sauvegarder l'intention d'ajout au panier dans sessionStorage
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
    
    // Si authentifié, ajouter au panier normalement
    try {
      addToCart(product, quantity, storeInfo);
      console.log('Produit ajouté au panier:', product.name);
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
    }
  };
  
  // Fonction pour enregistrer une visite
  const recordStoreView = async (boutique) => {
    try {
      const response = await fetch(`/api/boutiques/${boutique.slug}/record-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'same-origin'
      });
      
      const result = await response.json();
      
      if (result.success && result.view_recorded) {
        console.log('Vue enregistrée avec succès');
        setStore(prev => prev ? {
          ...prev,
          visitCount: prev.visitCount + 1
        } : prev);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vue:', error);
    }
  };
  
  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let storeData;
        
        try {
          const response = await BoutiqueService.getBoutiqueBySlug(storeId);
          storeData = response.data;
        } catch (slugError) {
          const response = await BoutiqueService.getBoutiqueById(storeId);
          storeData = response.data;
        }
        
        if (storeData) {
          const adaptedStore = {
            id: storeData.id,
            name: storeData.nom,
            slug: storeData.slug,
            slogan: storeData.slogan || "Bienvenue dans notre boutique",
            description: storeData.description,
            type: storeData.categorie,
            accentColor: storeData.couleur_accent || '#F25539',
            logo: storeData.logo ? BoutiqueService.getLogoUrl(storeData.logo) : null,
            visitCount: Math.floor(Math.random() * 1000) + 100,
            owner: storeData.user ? {
              name: storeData.user.name,
              email: storeData.user.email
            } : null,
            keywords: storeData.mots_cles,
            createdAt: storeData.created_at,
            updatedAt: storeData.updated_at
          };
          
          setStore(adaptedStore);
          await recordStoreView(adaptedStore);
          await fetchProducts(adaptedStore.id);
          
          const urlParams = new URLSearchParams(window.location.search);
          const productId = urlParams.get('product');
          
          if (productId && products.length > 0) {
            const product = products.find(p => p.id === productId);
            if (product) {
              setSelectedProduct(product);
              setIsProductDetailOpen(true);
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de la boutique:', err);
        setError('Boutique non trouvée ou erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStore();
  }, [storeId]);

  const fetchProducts = async (boutiqueId) => {
    try {
      setProductsLoading(true);
      const response = await ProduitService.getAllProduits(boutiqueId);
      
      if (response.success) {
        const convertedProducts = response.data
          .map(product => ProduitService.convertToReactFormat(product))
          .filter(product => product.isVisible);
        
        setProducts(convertedProducts);
      } else {
        console.error('Erreur lors du chargement des produits:', response.message);
        setProducts([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('product');
      
      if (productId) {
        const product = products.find(p => p.id.toString() === productId);
        if (product) {
          setSelectedProduct(product);
          setIsProductDetailOpen(true);
        }
      }
    }
  }, [products]);
  
  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setIsProductDetailOpen(true);
    
    const url = new URL(window.location.href);
    url.searchParams.set('product', product.id);
    window.history.pushState({}, '', url);
  };
  
  const closeProductDetail = () => {
    setIsProductDetailOpen(false);
    
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    window.history.pushState({}, '', url);
  };
  
  const nextImage = () => {
    if (selectedProduct && selectedProduct.images && currentImageIndex < selectedProduct.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };
  
  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleShare = () => {
    if (navigator.share && store) {
      navigator.share({
        title: store.name,
        text: `Découvrez ${store.name} - ${store.slogan}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Lien copié dans le presse-papiers !');
      });
    }
  };

  const handleQuickAddToCart = async (product, event) => {
    event.stopPropagation();
    if (store && (product.isDigital || (!product.isDigital && product.inStock > 0))) {
      await checkAuthAndAddToCart(product, 1, {
        id: store.id,
        name: store.name,
        slug: store.slug,
        accentColor: store.accentColor
      });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return ProduitService.getImageUrl(imagePath);
  };

  const formatTags = (tags) => {
    if (Array.isArray(tags)) {
      return tags;
    }
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    return [];
  };

  // État de chargement
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={48} className="text-orange-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Chargement de la boutique...</h2>
          <p className="text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  // État d'erreur ou boutique non trouvée
  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Boutique introuvable</h2>
          <p className="text-gray-500 mb-6">
            {error || "Cette boutique n'existe pas ou a été supprimée."}
          </p>
          <Button onClick={() => navigate('/')} variant="primary">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Icône du panier flottante */}
      <div className="fixed top-4 right-4 z-30">
        <CartIcon 
          onClick={() => setIsCartOpen(true)}
          className="bg-white shadow-lg"
        />
      </div>

      {/* Drawer du panier */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />

      {/* En-tête de la boutique */}
      <div 
        className="bg-gray-900 text-white py-10"
        style={{ backgroundColor: store.accentColor }}
      >
        <Container>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-md">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={32} className="text-gray-300" />
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
              <p className="text-white/80 mb-4">"{store.slogan}"</p>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {store.type === 'physical' ? 'Produits Physiques' : 'Produits Digitaux'}
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {products.length} produit{products.length !== 1 ? 's' : ''}
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {store.visitCount} visites
                </div>
              </div>
            </div>
            
            <div className="ml-auto hidden md:block">
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                icon={<Share2 size={16} />}
                iconPosition="left"
                onClick={handleShare}
              >
                Partager
              </Button>
            </div>
          </div>
        </Container>
      </div>
      
      {/* Description de la boutique */}
      <div className="bg-white border-b">
        <Container className="py-6">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold mb-3">À propos de cette boutique</h2>
            <p className="text-gray-600">{store.description}</p>
            
            {store.keywords && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Mots-clés</h3>
                <div className="flex flex-wrap gap-1">
                  {store.keywords.split(',').map((keyword, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Phone size={20} className="text-gray-400 mr-2" />
                <span className="text-sm">
                  {store.owner?.phone || '+225 07 XX XX XX XX'}
                </span>
              </div>
              <div className="flex items-center">
                <Mail size={20} className="text-gray-400 mr-2" />
                <span className="text-sm">
                  {store.owner?.email || 'contact@boutikplace.com'}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin size={20} className="text-gray-400 mr-2" />
                <span className="text-sm">Abidjan, Côte d'Ivoire</span>
              </div>
            </div>
          </div>
        </Container>
      </div>
      
      {/* Section Produits */}
      <Container className="py-8">
        <h2 className="text-2xl font-bold mb-6">Nos produits</h2>
        
        {productsLoading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Loader2 size={32} className="text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Chargement des produits...</p>
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                <div 
                  className="h-48 bg-gray-200 relative cursor-pointer"
                  onClick={() => openProductDetail(product)}
                >
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="absolute inset-0 bg-gray-200 flex items-center justify-center"
                    style={{display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex'}}
                  >
                    <Package size={32} className="text-gray-400" />
                  </div>
                  
                  {!product.isDigital && product.inStock <= 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Rupture de stock
                      </span>
                    </div>
                  )}

                  {/* Bouton d'ajout rapide au panier */}
                  <button 
                    onClick={(e) => handleQuickAddToCart(product, e)}
                    disabled={!product.isDigital && product.inStock <= 0}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: (!product.isDigital && product.inStock <= 0) ? '#ef4444' : store.accentColor,
                      color: 'white'
                    }}
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 
                    className="font-medium text-gray-900 mb-1 truncate cursor-pointer hover:text-orange-500"
                    onClick={() => openProductDetail(product)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 h-10 overflow-hidden">
                    {product.description && product.description.length > 60 
                      ? `${product.description.substring(0, 60)}...`
                      : product.description}
                  </p>
                  
                  {product.category && (
                    <div className="mt-2">
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {product.category}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between items-center">
                    <span className="font-bold text-gray-900">
                      {parseFloat(product.price || 0).toLocaleString()} FCFA
                    </span>
                    
                    {!product.isDigital && product.inStock <= 5 && product.inStock > 0 && (
                      <span className="text-xs text-amber-600 font-medium">
                        Plus que {product.inStock}
                      </span>
                    )}
                  </div>

                  {/* Utilisation du composant AddToCartButton */}
                  <div className="mt-3">
                    <AddToCartButton
                      product={product}
                      storeInfo={{
                        id: store.id,
                        name: store.name,
                        slug: store.slug,
                        accentColor: store.accentColor
                      }}
                      quantity={1}
                      fullWidth={true}
                      size="sm"
                      disabled={!product.isDigital && product.inStock <= 0}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun produit disponible</h3>
            <p className="text-gray-500">Cette boutique n'a pas encore ajouté de produits.</p>
            {store.owner && (
              <p className="text-gray-400 text-sm mt-2">
                Revenez bientôt pour découvrir les nouveautés !
              </p>
            )}
          </div>
        )}
      </Container>
      
      {/* Modal de détail produit */}
      {isProductDetailOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex flex-col md:flex-row h-full">
              {/* Images du produit */}
              <div className="w-full md:w-1/2 bg-gray-100 relative">
                <div className="h-64 md:h-full bg-white flex items-center justify-center relative">
                  {selectedProduct.images && selectedProduct.images.length > 0 && selectedProduct.images[currentImageIndex] ? (
                    <img
                      src={getImageUrl(selectedProduct.images[currentImageIndex])}
                      alt={selectedProduct.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{display: selectedProduct.images && selectedProduct.images.length > 0 && selectedProduct.images[currentImageIndex] ? 'none' : 'flex'}}
                  >
                    <Package size={64} className="text-gray-400" />
                  </div>
                  
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }} 
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md text-gray-700 hover:bg-gray-200"
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }} 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md text-gray-700 hover:bg-gray-200"
                        disabled={currentImageIndex === selectedProduct.images.length - 1}
                      >
                        <ChevronRight size={20} />
                      </button>
                      
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                        {selectedProduct.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-orange-500' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Détails du produit */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col max-h-[60vh] md:max-h-[90vh]">
                <button 
                  onClick={closeProductDetail}
                  className="self-end text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-2">{selectedProduct.name}</h2>
                <div className="text-xl font-bold mt-2" style={{ color: store.accentColor }}>
                  {parseFloat(selectedProduct.price || 0).toLocaleString()} FCFA
                </div>
                
                {selectedProduct.category && (
                  <div className="mt-2">
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {selectedProduct.category}
                    </span>
                  </div>
                )}
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">Description</h3>
                  <p className="mt-1 text-sm text-gray-600">{selectedProduct.description}</p>
                </div>
                
                {/* Détails spécifiques au produit */}
                <div className="mt-4 space-y-3">
                  {!selectedProduct.isDigital && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Disponibilité</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {selectedProduct.inStock > 0 
                            ? `${selectedProduct.inStock} en stock` 
                            : 'Rupture de stock'}
                        </p>
                      </div>
                      
                      {selectedProduct.shippingFrom && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Expédié depuis</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.shippingFrom}</p>
                        </div>
                      )}
                      
                      {selectedProduct.deliveryTime && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Délai de livraison estimé</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.deliveryTime}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {selectedProduct.isDigital && (
                    <>
                      {selectedProduct.digitalProductType && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Type de produit</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.digitalProductType}</p>
                        </div>
                      )}
                      
                      {selectedProduct.fileSize && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Taille du fichier</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.fileSize}</p>
                        </div>
                      )}
                      
                      {selectedProduct.format && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Format</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.format}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {selectedProduct.tags && formatTags(selectedProduct.tags).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Tags</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {formatTags(selectedProduct.tags).map((tag, index) => (
                          <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex-grow"></div>
                
                {/* Utilisation du composant AddToCartButton dans le modal */}
                <div className="mt-4">
                  <AddToCartButton
                    product={selectedProduct}
                    storeInfo={{
                      id: store.id,
                      name: store.name,
                      slug: store.slug,
                      accentColor: store.accentColor
                    }}
                    quantity={1}
                    fullWidth={true}
                    size="lg"
                    disabled={!selectedProduct.isDigital && selectedProduct.inStock <= 0}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePage;