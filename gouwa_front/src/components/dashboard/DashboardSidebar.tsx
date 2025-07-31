import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import BoutiqueService from '../../services/BoutiqueService';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Settings, 
  Users, 
  BarChart2, 
  ChevronRight,
  Menu,
  X,
  Share2,
  Copy,
  MessageCircle,
  Facebook,
  Instagram,
  Send,
  Loader2
} from 'lucide-react';

const DashboardSidebar: React.FC = () => {
  const location = useLocation();
  const { currentStore, setCurrentStore } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Récupérer les boutiques de l'utilisateur au chargement
  useEffect(() => {
    const fetchUserBoutiques = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await BoutiqueService.getMyBoutiques();
        
        if (response.success && response.data.length > 0) {
          // Prendre la première boutique ou celle qui était déjà sélectionnée
          const boutique = response.data[0];
          
          // Transformer les données pour correspondre au format attendu
          const transformedBoutique = {
            id: boutique.id,
            name: boutique.nom,
            slug: boutique.slug,
            logo: boutique.logo ? BoutiqueService.getLogoUrl(boutique.logo) : null,
            description: boutique.description,
            slogan: boutique.slogan,
            category: boutique.categorie,
            accentColor: boutique.couleur_accent,
            keywords: boutique.mots_cles,
            visitCount: boutique.visit_count || 0,
            orderCount: boutique.order_count || 0,
            products: boutique.products || [],
            createdAt: boutique.created_at,
            updatedAt: boutique.updated_at
          };
          
          setCurrentStore(transformedBoutique);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des boutiques:', err);
        setError(err.message || 'Erreur lors du chargement de la boutique');
      } finally {
        setLoading(false);
      }
    };

    fetchUserBoutiques();
  }, [setCurrentStore]);
  
  const isActive = (path: string) => {
    return location.pathname === `/dashboard${path}` || location.pathname === `/dashboard${path}/`;
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Fonction pour copier le lien
  const copyStoreLink = async () => {
    if (!currentStore) return;
    
    const storeUrl = `${window.location.origin}/store/${currentStore.slug}`;
    try {
      await navigator.clipboard.writeText(storeUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = storeUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Fonction pour partager sur les réseaux sociaux
  const shareOnSocial = (platform: string) => {
    if (!currentStore) return;
    
    const storeUrl = `${window.location.origin}/store/${currentStore.slug}`;
    const storeTitle = `Découvrez ${currentStore.name} - Ma boutique en ligne`;
    const encodedUrl = encodeURIComponent(storeUrl);
    const encodedTitle = encodeURIComponent(storeTitle);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };
  
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', path: '' },
    { icon: <Package size={20} />, label: 'Produits', path: '/products' },
    { icon: <ShoppingCart size={20} />, label: 'Commandes', path: '/orders' },
    { icon: <CreditCard size={20} />, label: 'Paiements', path: '/payments' },
    { icon: <BarChart2 size={20} />, label: 'Statistiques', path: '/stats' },
    { icon: <Users size={20} />, label: 'Clients', path: '/customers' },
    { icon: <Settings size={20} />, label: 'Paramètres', path: '/settings' },
  ];

  // Affichage pendant le chargement
  if (loading) {
    return (
      <>
        {/* Bouton burger mobile */}
        <div className="lg:hidden">
          <button
            onClick={toggleMobileMenu}
            className="fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200"
            aria-label="Toggle menu"
          >
            <Menu size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Sidebar avec loader */}
        <aside className="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 h-full flex flex-col">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Chargement de votre boutique...</p>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <>
        {/* Bouton burger mobile */}
        <div className="lg:hidden">
          <button
            onClick={toggleMobileMenu}
            className="fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200"
            aria-label="Toggle menu"
          >
            <Menu size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Sidebar avec erreur */}
        <aside className="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 h-full flex flex-col">
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-3 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                <X size={24} className="text-red-500" />
              </div>
              <p className="text-sm text-red-600 mb-2">Erreur de chargement</p>
              <p className="text-xs text-gray-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
              >
                Réessayer
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }
  
  return (
    <>
      {/* Bouton burger mobile - toujours visible sur mobile */}
      <div className="lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X size={20} className="text-gray-700" />
          ) : (
            <Menu size={20} className="text-gray-700" />
          )}
        </button>
      </div>

      {/* Overlay pour mobile */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 h-full flex flex-col
        transform transition-transform duration-300 ease-in-out lg:transform-none
        shadow-xl lg:shadow-none
      `}>
        {/* Header de la sidebar avec bouton fermer mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={closeMobileMenu}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Store info */}
        {currentStore ? (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {currentStore.logo ? (
                  <img src={currentStore.logo} alt={currentStore.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-gray-400">
                    {currentStore.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{currentStore.name}</p>
                <div className="flex items-center space-x-2">
                  <Link 
                    to={`/store/${currentStore.slug}`} 
                    target="_blank"
                    className="text-xs text-orange-500 hover:text-orange-600 flex items-center"
                    onClick={closeMobileMenu}
                  >
                    Voir la boutique
                    <ChevronRight size={12} className="ml-1" />
                  </Link>
                  <button
                    onClick={() => setShowShareOptions(!showShareOptions)}
                    className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded"
                    title="Partager la boutique"
                  >
                    <Share2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-gray-200">
            <div className="text-center text-sm text-gray-500">
              Aucune boutique trouvée
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={`/dashboard${item.path}`}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ${
                    isActive(item.path)
                      ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`mr-3 transition-colors duration-150 ${
                    isActive(item.path) ? 'text-orange-500' : 'text-gray-400'
                  }`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Stats section */}
        {currentStore && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Statistiques</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Visites</span>
                  <span className="text-sm font-semibold text-gray-900 bg-white px-2 py-1 rounded">
                    {currentStore.visitCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commandes</span>
                  <span className="text-sm font-semibold text-gray-900 bg-white px-2 py-1 rounded">
                    {currentStore.orderCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Produits</span>
                  <span className="text-sm font-semibold text-gray-900 bg-white px-2 py-1 rounded">
                    {currentStore.products?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Section de partage */}
            {showShareOptions && currentStore && (
              <div className="mt-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                    <Share2 size={14} className="mr-2" />
                    Partager votre boutique
                  </h4>
                  
                  {/* Lien de la boutique */}
                  <div className="mb-3">
                    <div className="flex items-center bg-white rounded-md border border-gray-200 p-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/store/${currentStore.slug}`}
                        readOnly
                        className="flex-1 text-xs text-gray-600 bg-transparent border-none outline-none"
                      />
                      <button
                        onClick={copyStoreLink}
                        className={`ml-2 p-1 rounded text-xs transition-colors ${
                          linkCopied 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Copier le lien"
                      >
                        {linkCopied ? '✓' : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Boutons de partage réseaux sociaux */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => shareOnSocial('whatsapp')}
                      className="flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle size={14} className="mr-1" />
                      WhatsApp
                    </button>
                    
                    <button
                      onClick={() => shareOnSocial('facebook')}
                      className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Facebook size={14} className="mr-1" />
                      Facebook
                    </button>
                    
                    <button
                      onClick={() => shareOnSocial('telegram')}
                      className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                      <Send size={14} className="mr-1" />
                      Telegram
                    </button>
                    
                    <button
                      onClick={() => shareOnSocial('twitter')}
                      className="flex items-center justify-center px-3 py-2 bg-black text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-sm mr-1">𝕏</span>
                      Twitter
                    </button>
                  </div>

                  {/* Bouton fermer */}
                  <button
                    onClick={() => setShowShareOptions(false)}
                    className="w-full mt-3 text-xs text-gray-500 hover:text-gray-700 py-1"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default DashboardSidebar;