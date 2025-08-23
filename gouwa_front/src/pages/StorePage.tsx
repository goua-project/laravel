import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import StatsService from '../services/StatsService';
import BoutiqueService from '../services/BoutiqueService';

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
  const [viewRecorded, setViewRecorded] = useState(false); // ✅ Nouveau state pour tracking
  
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
      sessionStorage.setItem('pendingCartItem', JSON.stringify({
        product,
        quantity,
        storeInfo,
        returnUrl: window.location.href
      }));
      
      navigate('/auth/login');
      return;
    }
    
    try {
      addToCart(product, quantity, storeInfo);
      console.log('Produit ajouté au panier:', product.name);
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
    }
  };
  
  // ✅ Fonction améliorée pour enregistrer une visite
  const recordStoreView = async (boutique) => {
    // Éviter les enregistrements multiples
    if (viewRecorded) {
      console.log('Vue déjà enregistrée pour cette session');
      return;
    }

    try {
      console.log('🔄 Tentative d\'enregistrement de vue pour:', boutique.slug || boutique.id);
      
      // Utiliser le slug de préférence, sinon l'ID
      const identifier = boutique.slug || boutique.id;
      
      // Utiliser la méthode avec retry automatique
      const response = await StatsService.recordViewWithRetry(identifier, 3);
      
      if (response && response.success) {
        console.log('✅ Vue enregistrée avec succès:', response.message);
        setViewRecorded(true); // Marquer comme enregistré
        
        // Optionnel: Incrémenter le compteur de visites localement
        setStore(prev => prev ? {
          ...prev,
          visitCount: (prev.visitCount || 0) + 1
        } : prev);
        
        // Sauvegarder dans sessionStorage pour éviter les doubles enregistrements
        sessionStorage.setItem(`view_recorded_${identifier}`, 'true');
        
      } else {
        console.warn('⚠️ Échec de l\'enregistrement de la vue:', response?.error || 'Erreur inconnue');
        
        // Si c'est un problème de boutique non trouvée, ne pas retry
        if (response?.status === 404) {
          console.warn('Boutique non trouvée pour l\'enregistrement de vue');
          return;
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la vue:', error);
      // Ne pas faire échouer l'application pour cela
    }
  };
  
  // ✅ Hook pour enregistrer la vue quand la boutique est chargée
  useEffect(() => {
    const recordViewOnLoad = async () => {
      if (!store || viewRecorded) return;

      // Vérifier si la vue a déjà été enregistrée dans cette session
      const identifier = store.slug || store.id;
      const alreadyRecorded = sessionStorage.getItem(`view_recorded_${identifier}`);
      
      if (alreadyRecorded) {
        console.log('Vue déjà enregistrée dans cette session');
        setViewRecorded(true);
        return;
      }

      // Attendre un peu pour être sûr que l'utilisateur ne fait pas que passer
      const timer = setTimeout(async () => {
        await recordStoreView(store);
      }, 2000); // Enregistrer après 2 secondes

      // Cleanup du timer
      return () => clearTimeout(timer);
    };

    recordViewOnLoad();
  }, [store, viewRecorded]);

  // Version corrigée de la méthode fetchStore
  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) {
        setError("Identifiant de boutique manquant");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        let storeData = null;
        let lastError = null;
        
        // Essayer d'abord par slug
        try {
          console.log('🔍 Recherche boutique par slug:', storeId);
          const response = await BoutiqueService.getBoutiqueBySlug(storeId);
          
          if (response && response.data) {
            storeData = response.data;
            console.log('✅ Boutique trouvée par slug:', storeData.nom);
          } else if (response && !response.data && response.id) {
            storeData = response;
            console.log('✅ Boutique trouvée par slug (format direct):', storeData.nom);
          }
        } catch (slugError) {
          console.log('⚠️ Échec récupération par slug:', slugError);
          lastError = slugError;
          
          // Essayer par ID seulement si le storeId ressemble à un ID numérique
          if (/^\d+$/.test(storeId)) {
            try {
              console.log('🔍 Recherche boutique par ID:', storeId);
              const response = await BoutiqueService.getBoutiqueById(storeId);
              
              if (response && response.data) {
                storeData = response.data;
                console.log('✅ Boutique trouvée par ID:', storeData.nom);
              } else if (response && !response.data && response.id) {
                storeData = response;
                console.log('✅ Boutique trouvée par ID (format direct):', storeData.nom);
              }
            } catch (idError) {
              console.log('❌ Échec récupération par ID:', idError);
              lastError = idError;
            }
          }
        }
        
        // Vérifier si on a trouvé des données valides
        if (!storeData || !storeData.id || !storeData.nom) {
          console.error('❌ Données de boutique invalides:', storeData);
          throw new Error('Boutique introuvable ou données invalides');
        }
        
        // Vérifier si la boutique est active/publique
        if (storeData.status && !['active', 'published', 'public'].includes(storeData.status)) {
          throw new Error('Cette boutique n\'est pas disponible actuellement');
        }
        
        // Adapter les données pour le format React
        const adaptedStore = {
          id: storeData.id,
          name: storeData.nom || 'Boutique sans nom',
          slug: storeData.slug || BoutiqueService.generateSlug(storeData.nom) || storeId,
          slogan: storeData.slogan || "Bienvenue dans notre boutique",
          description: storeData.description || "Découvrez nos produits de qualité",
          type: storeData.categorie || storeData.category || 'physical',
          accentColor: storeData.couleur_accent || storeData.accent_color || '#F25539',
          logo: storeData.logo ? BoutiqueService.getLogoUrl(storeData.logo) : null,
          visitCount: storeData.visit_count || storeData.total_views || Math.floor(Math.random() * 1000) + 100,
          owner: storeData.user ? {
            name: storeData.user.name,
            email: storeData.user.email,
            phone: storeData.user.phone
          } : (storeData.owner || null),
          keywords: storeData.mots_cles || storeData.keywords || '',
          createdAt: storeData.created_at,
          updatedAt: storeData.updated_at,
          // Ajout de métadonnées pour l'enregistrement des vues
          originalSlug: storeData.slug,
          originalId: storeData.id
        };
        
        console.log('✅ Boutique adaptée:', {
          id: adaptedStore.id,
          name: adaptedStore.name,
          slug: adaptedStore.slug
        });
        
        setStore(adaptedStore);
        
        // Charger les produits
        await fetchProducts(adaptedStore.id);
        
      } catch (err) {
        console.error('❌ Erreur lors de la récupération de la boutique:', err);
        
        let errorMessage = 'Boutique non trouvée ou erreur de chargement';
        
        if (err.message) {
          errorMessage = err.message;
        } else if (err.response) {
          if (err.response.status === 404) {
            errorMessage = 'Cette boutique n\'existe pas ou a été supprimée';
          } else if (err.response.status === 403) {
            errorMessage = 'Accès à cette boutique non autorisé';
          } else if (err.response.status >= 500) {
            errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
          } else {
            errorMessage = `Erreur ${err.response.status}: ${err.response.data?.message || 'Erreur inconnue'}`;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStore();
  }, [storeId]);

  const fetchProducts = async (boutiqueId) => {
    try {
      setProductsLoading(true);
      console.log('🔄 Chargement des produits pour boutique:', boutiqueId);
      
      const response = await ProduitService.getAllProduits(boutiqueId);
      
      if (response && response.success && response.data) {
        const convertedProducts = response.data
          .map(product => ProduitService.convertToReactFormat(product))
          .filter(product => product.isVisible);
        
        console.log('✅ Produits chargés:', convertedProducts.length);
        setProducts(convertedProducts);
      } else if (response && Array.isArray(response)) {
        // Cas où la réponse est directement un tableau
        const convertedProducts = response
          .map(product => ProduitService.convertToReactFormat(product))
          .filter(product => product.isVisible);
        
        console.log('✅ Produits chargés (format direct):', convertedProducts.length);
        setProducts(convertedProducts);
      } else {
        console.warn('⚠️ Format de réponse inattendu pour les produits:', response);
        setProducts([]);
      }
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement des produits:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // ✅ Effect pour nettoyer le cache de session au déchargement de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Nettoyer les flags de vue enregistrée (optionnel)
      if (store) {
        const identifier = store.slug || store.id;
        // Garder le flag pour éviter les doubles enregistrements si l'utilisateur revient
        // sessionStorage.removeItem(`view_recorded_${identifier}`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [store]);

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

  const handleShare = async () => {
    if (!store) return;

    const shareData = {
      title: `${store.name} - Boutique en ligne`,
      text: `Découvrez ${store.name} - ${store.slogan}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        console.log('✅ Partage réussi');
      } else {
        // Fallback: copier dans le presse-papiers
        await navigator.clipboard.writeText(window.location.href);
        
        // Afficher une notification simple
        const notification = document.createElement('div');
        notification.textContent = 'Lien copié dans le presse-papiers !';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10B981;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 10000;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
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
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Boutique introuvable</h2>
          <p className="text-gray-500 mb-6">
            {error || "Cette boutique n'existe pas ou a été supprimée."}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/')} 
              variant="primary"
              className="w-full sm:w-auto"
            >
              Retour à l'accueil
            </Button>
            <br />
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              Réessayer
            </Button>
          </div>
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
          className="bg-white shadow-lg hover:shadow-xl transition-shadow"
        />
      </div>

      {/* Drawer du panier */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />

      {/* En-tête de la boutique */}
      <div 
        className="bg-gray-900 text-white py-12"
        style={{ backgroundColor: store.accentColor }}
      >
        <Container>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-lg">
              {store.logo ? (
                <img 
                  src={store.logo} 
                  alt={store.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{display: store.logo ? 'none' : 'flex'}}
              >
                <ShoppingBag size={32} className="text-gray-400" />
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{store.name}</h1>
              <p className="text-white/90 mb-4 text-lg italic">"{store.slogan}"</p>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  {store.type === 'physical' ? '📦 Produits Physiques' : '💻 Produits Digitaux'}
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  📊 {products.length} produit{products.length !== 1 ? 's' : ''}
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  👁️ {store.visitCount.toLocaleString()} visites
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 transition-all"
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
      <div className="bg-white border-b shadow-sm">
        <Container className="py-8">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">À propos de cette boutique</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">{store.description}</p>
            
            {store.keywords && store.keywords.trim() && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Spécialités</h3>
                <div className="flex flex-wrap gap-2">
                  {store.keywords.split(',').map((keyword, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full transition-colors"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Phone size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">
                    {store.owner?.phone || '+225 07 XX XX XX XX'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">
                    {store.owner?.email || 'contact@boutikplace.com'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Localisation</p>
                  <p className="font-medium">Abidjan, Côte d'Ivoire</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
      
      {/* Section Produits */}
      <Container className="py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Nos produits</h2>
          {products.length > 0 && (
            <div className="text-sm text-gray-500">
              {products.length} produit{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {productsLoading ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Loader2 size={32} className="text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Chargement des produits...</p>
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer border border-gray-100"
              >
                <div 
                  className="h-52 bg-gray-100 relative overflow-hidden"
                  onClick={() => openProductDetail(product)}
                >
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="absolute inset-0 bg-gray-100 flex items-center justify-center"
                    style={{display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex'}}
                  >
                    <Package size={32} className="text-gray-400" />
                  </div>
                  
                  {!product.isDigital && product.inStock <= 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                        Rupture de stock
                      </span>
                    </div>
                  )}

                  {/* Bouton d'ajout rapide au panier */}
                  <button 
                    onClick={(e) => handleQuickAddToCart(product, e)}
                    disabled={!product.isDigital && product.inStock <= 0}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ 
                      backgroundColor: (!product.isDigital && product.inStock <= 0) ? '#ef4444' : store.accentColor,
                      color: 'white'
                    }}
                    title="Ajouter au panier"
                  >
                    <ShoppingCart size={18} />
                  </button>
                </div>
                
                <div className="p-5">
                  <h3 
                    className="font-semibold text-gray-900 mb-2 truncate cursor-pointer hover:text-orange-500 transition-colors text-lg"
                    onClick={() => openProductDetail(product)}
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 h-12 overflow-hidden leading-relaxed mb-3">
                    {product.description && product.description.length > 80 
                      ? `${product.description.substring(0, 80)}...`
                      : product.description || 'Aucune description disponible'}
                  </p>
                  
                  {product.category && (
                    <div className="mb-3">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {product.category}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-900 text-lg">
                      {parseFloat(product.price || 0).toLocaleString()} FCFA
                    </span>
                    
                    {!product.isDigital && product.inStock <= 5 && product.inStock > 0 && (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">
                        Plus que {product.inStock}
                      </span>
                    )}
                  </div>

                  {/* Bouton d'ajout au panier principal */}
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
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <ShoppingBag size={64} className="text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Aucun produit disponible</h3>
            <p className="text-gray-500 mb-2">Cette boutique n'a pas encore ajouté de produits.</p>
            {store.owner && (
              <p className="text-gray-400 text-sm">
                Revenez bientôt pour découvrir les nouveautés !
              </p>
            )}
          </div>
        )}
      </Container>
      
      {/* Modal de détail produit */}
      {isProductDetailOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="flex flex-col lg:flex-row h-full">
              {/* Images du produit */}
              <div className="w-full lg:w-1/2 bg-gray-50 relative">
                <div className="h-64 lg:h-full bg-white flex items-center justify-center relative min-h-[400px]">
                  {selectedProduct.images && selectedProduct.images.length > 0 && selectedProduct.images[currentImageIndex] ? (
                    <img
                      src={getImageUrl(selectedProduct.images[currentImageIndex])}
                      alt={selectedProduct.name}
                      className="max-w-full max-h-full object-contain p-4"
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
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft size={24} />
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }} 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                        disabled={currentImageIndex === selectedProduct.images.length - 1}
                      >
                        <ChevronRight size={24} />
                      </button>
                      
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2">
                        {selectedProduct.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`w-3 h-3 rounded-full transition-all ${
                              index === currentImageIndex ? 'bg-orange-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Détails du produit */}
              <div className="w-full lg:w-1/2 p-8 overflow-y-auto flex flex-col max-h-[60vh] lg:max-h-[95vh]">
                <button 
                  onClick={closeProductDetail}
                  className="self-end text-gray-400 hover:text-gray-600 transition-colors p-2 -m-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{selectedProduct.name}</h2>
                <div className="text-2xl font-bold mb-4" style={{ color: store.accentColor }}>
                  {parseFloat(selectedProduct.price || 0).toLocaleString()} FCFA
                </div>
                
                {selectedProduct.category && (
                  <div className="mb-4">
                    <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1.5 rounded-full">
                      {selectedProduct.category}
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedProduct.description || 'Aucune description disponible.'}</p>
                </div>
                
                {/* Détails spécifiques au produit */}
                <div className="space-y-4 mb-6">
                  {!selectedProduct.isDigital && (
                    <>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="text-sm font-semibold text-gray-900">Disponibilité</h3>
                        <p className={`mt-1 text-sm font-medium ${
                          selectedProduct.inStock > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedProduct.inStock > 0 
                            ? `${selectedProduct.inStock} en stock` 
                            : 'Rupture de stock'}
                        </p>
                      </div>
                      
                      {selectedProduct.shippingFrom && (
                        <div className="border-l-4 border-orange-500 pl-4">
                          <h3 className="text-sm font-semibold text-gray-900">Expédié depuis</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.shippingFrom}</p>
                        </div>
                      )}
                      
                      {selectedProduct.deliveryTime && (
                        <div className="border-l-4 border-green-500 pl-4">
                          <h3 className="text-sm font-semibold text-gray-900">Délai de livraison estimé</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.deliveryTime}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {selectedProduct.isDigital && (
                    <>
                      {selectedProduct.digitalProductType && (
                        <div className="border-l-4 border-purple-500 pl-4">
                          <h3 className="text-sm font-semibold text-gray-900">Type de produit digital</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.digitalProductType}</p>
                        </div>
                      )}
                      
                      {selectedProduct.fileSize && (
                        <div className="border-l-4 border-indigo-500 pl-4">
                          <h3 className="text-sm font-semibold text-gray-900">Taille du fichier</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.fileSize}</p>
                        </div>
                      )}
                      
                      {selectedProduct.format && (
                        <div className="border-l-4 border-pink-500 pl-4">
                          <h3 className="text-sm font-semibold text-gray-900">Format</h3>
                          <p className="mt-1 text-sm text-gray-600">{selectedProduct.format}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {selectedProduct.tags && formatTags(selectedProduct.tags).length > 0 && (
                    <div className="border-l-4 border-gray-500 pl-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {formatTags(selectedProduct.tags).map((tag, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow"></div>
                
                {/* Bouton d'ajout au panier dans le modal */}
                <div className="mt-8">
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