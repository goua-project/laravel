import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import BoutiqueService from '../../services/boutiqueService';
import ProduitService from '../../services/produitService';
import Button from '../common/Button';
import { 
  ShoppingBag, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Package, 
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';

const DashboardOverview = () => {
  const { currentStore, setCurrentStore } = useStore();
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentProducts, setRecentProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Fonction pour récupérer les boutiques de l'utilisateur
  const fetchUserBoutiques = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
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
          products: [], // Sera chargé séparément
          createdAt: boutique.created_at,
          updatedAt: boutique.updated_at,
          // Données simulées pour les statistiques (à remplacer par de vraies données)
          salesAmount: boutique.sales_amount || 0,
          conversionRate: boutique.conversion_rate || 0,
          // Nouveaux champs pour les statistiques
          totalProducts: boutique.total_products || 0,
          publishedProducts: boutique.published_products || 0,
          totalRevenue: boutique.total_revenue || 0,
          monthlyRevenue: boutique.monthly_revenue || 0,
          weeklyOrders: boutique.weekly_orders || 0,
          monthlyOrders: boutique.monthly_orders || 0
        };
        
        setCurrentStore(transformedBoutique);
        
        // Charger les produits récents après avoir défini la boutique
        await fetchRecentProducts(transformedBoutique.id);
        
      } else if (response.success && response.data.length === 0) {
        // Utilisateur n'a pas de boutique
        setCurrentStore(null);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des boutiques:', err);
      setError(err.message || 'Erreur lors du chargement de la boutique');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fonction pour récupérer les produits récents
  const fetchRecentProducts = async (boutiqueId) => {
    try {
      setProductsLoading(true);
      const response = await ProduitService.getAllProduits(boutiqueId);
      
      if (response.success) {
        // Convertir les données Laravel vers le format React et prendre les 5 plus récents
        const convertedProducts = response.data
          .map(product => ProduitService.convertToReactFormat(product))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);
          
        setRecentProducts(convertedProducts);
        
        // Mettre à jour le nombre total de produits dans currentStore
        if (currentStore) {
          setCurrentStore(prev => ({
            ...prev,
            products: convertedProducts,
            totalProducts: response.data.length,
            publishedProducts: response.data.filter(p => p.visible).length
          }));
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Charger les boutiques au montage du composant
  useEffect(() => {
    fetchUserBoutiques();
  }, [setCurrentStore]);

  // Fonction pour actualiser les données
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserBoutiques(false);
  };

  // Calculer les statistiques basées sur les données réelles
  const calculateStats = () => {
    if (!currentStore) return [];

    // Calculer les revenus en fonction de la plage de temps
    const getRevenueForPeriod = () => {
      switch (timeRange) {
        case 'today':
          return currentStore.dailyRevenue || 0;
        case 'week':
          return currentStore.weeklyRevenue || 0;
        case 'month':
          return currentStore.monthlyRevenue || 0;
        case 'year':
          return currentStore.yearlyRevenue || currentStore.totalRevenue || 0;
        default:
          return currentStore.monthlyRevenue || 0;
      }
    };

    // Calculer les commandes en fonction de la plage de temps
    const getOrdersForPeriod = () => {
      switch (timeRange) {
        case 'today':
          return currentStore.dailyOrders || 0;
        case 'week':
          return currentStore.weeklyOrders || 0;
        case 'month':
          return currentStore.monthlyOrders || 0;
        case 'year':
          return currentStore.yearlyOrders || currentStore.orderCount || 0;
        default:
          return currentStore.monthlyOrders || 0;
      }
    };

    // Calculer les visites en fonction de la plage de temps
    const getVisitsForPeriod = () => {
      switch (timeRange) {
        case 'today':
          return currentStore.dailyVisits || 0;
        case 'week':
          return currentStore.weeklyVisits || 0;
        case 'month':
          return currentStore.monthlyVisits || currentStore.visitCount || 0;
        case 'year':
          return currentStore.yearlyVisits || currentStore.visitCount || 0;
        default:
          return currentStore.monthlyVisits || currentStore.visitCount || 0;
      }
    };

    const currentRevenue = getRevenueForPeriod();
    const currentOrders = getOrdersForPeriod();
    const currentVisits = getVisitsForPeriod();
    
    // Calculer le taux de conversion (commandes / visites * 100)
    const conversionRate = currentVisits > 0 ? ((currentOrders / currentVisits) * 100).toFixed(1) : 0;

    return [
      {
        name: 'Ventes',
        value: `${currentRevenue.toLocaleString()} FCFA`,
        change: currentStore.revenueGrowth ? `${currentStore.revenueGrowth > 0 ? '+' : ''}${currentStore.revenueGrowth}%` : '+0%',
        positive: !currentStore.revenueGrowth || currentStore.revenueGrowth >= 0,
        icon: <DollarSign size={24} className="text-green-500" />,
      },
      {
        name: 'Commandes',
        value: currentOrders.toString(),
        change: currentStore.ordersGrowth ? `${currentStore.ordersGrowth > 0 ? '+' : ''}${currentStore.ordersGrowth}%` : '+0%',
        positive: !currentStore.ordersGrowth || currentStore.ordersGrowth >= 0,
        icon: <ShoppingBag size={24} className="text-blue-500" />,
      },
      {
        name: 'Visites',
        value: currentVisits.toLocaleString(),
        change: currentStore.visitsGrowth ? `${currentStore.visitsGrowth > 0 ? '+' : ''}${currentStore.visitsGrowth}%` : '+0%',
        positive: !currentStore.visitsGrowth || currentStore.visitsGrowth >= 0,
        icon: <Users size={24} className="text-purple-500" />,
      },
      {
        name: 'Taux de conversion',
        value: `${conversionRate}%`,
        change: currentStore.conversionGrowth ? `${currentStore.conversionGrowth > 0 ? '+' : ''}${currentStore.conversionGrowth}%` : '+0%',
        positive: !currentStore.conversionGrowth || currentStore.conversionGrowth >= 0,
        icon: <TrendingUp size={24} className="text-orange-500" />,
      },
    ];
  };

  // Fonction pour obtenir l'URL de l'image du produit
  const getProductImageUrl = (product) => {
    if (!product.images || product.images.length === 0) return null;
    
    const firstImage = product.images[0];
    if (!firstImage) return null;
    
    // Si c'est déjà une URL complète, la retourner
    if (firstImage.startsWith('http')) return firstImage;
    
    // Sinon, construire l'URL avec le service
    return ProduitService.getImageUrl(firstImage);
  };

  // Affichage pendant le chargement initial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement de votre boutique</h3>
          <p className="text-gray-500">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-100 rounded-full p-4 mx-auto mb-4 w-20 h-20 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <div className="space-x-3">
          <Button variant="primary" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Réessayer
          </Button>
          <Link to="/create-store">
            <Button variant="outline">Créer une boutique</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Affichage si aucune boutique trouvée
  if (!currentStore) {
    return (
      <div className="text-center py-16">
        <div className="bg-orange-100 rounded-full p-4 mx-auto mb-4 w-20 h-20 flex items-center justify-center">
          <Package size={32} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune boutique trouvée</h3>
        <p className="text-gray-500 mb-6">Vous n'avez pas encore créé de boutique. Créez votre première boutique pour commencer à vendre en ligne.</p>
        <Link to="/create-store">
          <Button variant="primary">Créer ma boutique</Button>
        </Link>
      </div>
    );
  }
  
  const stats = calculateStats();
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-black text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">Bienvenue dans votre boutique</h2>
              <p className="mt-1 text-gray-300">Suivez les performances de {currentStore.name}</p>
              {currentStore.slogan && (
                <p className="mt-1 text-sm text-gray-400 italic">"{currentStore.slogan}"</p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-white hover:bg-white/10 p-2 rounded-md transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <Loader2 size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <Link to={`/store/${currentStore.slug}`} target="_blank">
                <Button variant="outline" className="text-white border-white hover:bg-white/10" icon={<ExternalLink size={16} />} iconPosition="right">
                  Voir ma boutique
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="border-b border-gray-200 px-6 py-2 bg-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Aperçu des performances</h3>
          <div className="flex bg-white border border-gray-200 rounded-md">
            {(['today', 'week', 'month', 'year']).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range === 'today' ? "Aujourd'hui" : 
                 range === 'week' ? '7 jours' : 
                 range === 'month' ? '30 jours' : '12 mois'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                {stat.icon}
              </div>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                  {stat.change}
                  <span className="text-xs ml-1">vs période précédente</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Products */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Produits récents
            {productsLoading && <Loader2 size={16} className="animate-spin ml-2 inline" />}
          </h3>
          <Link 
            to="/dashboard/products" 
            className="text-sm text-orange-500 hover:text-orange-600 flex items-center transition-colors"
          >
            Voir tous
            <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentProducts.length > 0 ? (
            recentProducts.map((product) => (
              <div key={product.id} className="px-6 py-4 flex items-center hover:bg-gray-50 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                  {getProductImageUrl(product) ? (
                    <img 
                      src={getProductImageUrl(product)} 
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="h-full w-full flex items-center justify-center"
                    style={{display: getProductImageUrl(product) ? 'none' : 'flex'}}
                  >
                    <Package size={20} className="text-gray-400" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {product.isDigital ? 'Produit digital' : `Stock: ${product.inStock || 0}`} • 
                    <span className={`ml-1 ${product.isVisible ? 'text-green-600' : 'text-gray-500'}`}>
                      {product.isVisible ? 'Publié' : 'Non publié'}
                    </span>
                  </p>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {product.price ? `${parseFloat(product.price).toLocaleString()} FCFA` : 'Prix non défini'}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <Package size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit</h3>
              <p className="text-gray-500 mb-6">Vous n'avez pas encore ajouté de produits à votre boutique.</p>
              <Link to="/add-product">
                <Button variant="primary" icon={<ArrowRight size={16} />} iconPosition="right">
                  Ajouter un produit
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Actions rapides</h3>
          <p className="text-sm text-gray-500 mt-1">Gérez rapidement votre boutique</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/add-product" className="group">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center">
              <div className="bg-orange-100 rounded-full p-3 mb-3 group-hover:bg-orange-200 transition-colors">
                <Package size={24} className="text-orange-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Ajouter un produit</h4>
              <p className="text-sm text-gray-500">Enrichir votre catalogue de vente</p>
            </div>
          </Link>
          
          <Link to="/dashboard/settings" className="group">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center">
              <div className="bg-blue-100 rounded-full p-3 mb-3 group-hover:bg-blue-200 transition-colors">
                <Users size={24} className="text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Personnaliser</h4>
              <p className="text-sm text-gray-500">Modifier l'apparence de votre boutique</p>
            </div>
          </Link>
          
          <Link to="/dashboard/payments" className="group">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center">
              <div className="bg-green-100 rounded-full p-3 mb-3 group-hover:bg-green-200 transition-colors">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Configurer paiements</h4>
              <p className="text-sm text-gray-500">Accepter des paiements en ligne</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Store Information Card */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-lg bg-white border-2 border-orange-200 flex items-center justify-center overflow-hidden">
              {currentStore.logo ? (
                <img src={currentStore.logo} alt={currentStore.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-orange-600">
                  {currentStore.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{currentStore.name}</h3>
              <p className="text-sm text-orange-700 mb-1">
                Catégorie: {currentStore.category === 'physical' ? 'Produits physiques' : 
                           currentStore.category === 'digital' ? 'Produits digitaux' : 
                           currentStore.category === 'mixed' ? 'Produits mixtes' : 'Non définie'}
              </p>
              <p className="text-xs text-gray-600 max-w-md line-clamp-2">
                {currentStore.description}
              </p>
            </div>
          </div>
          <Link to="/dashboard/settings" className="text-orange-600 hover:text-orange-700">
            <Button variant="outline" size="sm">
              Modifier
            </Button>
          </Link>
        </div>
        
        <div className="mt-4 pt-4 border-t border-orange-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-600">{currentStore.totalProducts || recentProducts.length}</p>
              <p className="text-xs text-gray-600">Produits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{currentStore.visitCount}</p>
              <p className="text-xs text-gray-600">Visites</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{currentStore.orderCount}</p>
              <p className="text-xs text-gray-600">Commandes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {currentStore.createdAt ? new Date(currentStore.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
              <p className="text-xs text-gray-600">Créée le</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;