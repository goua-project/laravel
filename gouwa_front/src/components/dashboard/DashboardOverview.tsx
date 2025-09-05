import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import BoutiqueService from '../../services/BoutiqueService';
import BoutiqueCommandeService from '../../services/BoutiqueCommandeService';
import ProduitService from '../../services/produitService';
import StatsService from '../../services/StatsService';
import SubscriptionService from '../../services/SubscriptionService';
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
  AlertCircle,
  Crown,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react';

const DashboardOverview = () => {
  const { currentStore, setCurrentStore } = useStore();
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentProducts, setRecentProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  
  // États pour les statistiques de vues
  const [viewsStats, setViewsStats] = useState({
    total_views: 0,
    unique_views: 0,
    previous_views: 0,
    growth_rate: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  
  // États pour les statistiques de commandes
  const [ordersStats, setOrdersStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    orders_growth: 0,
    revenue_growth: 0
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

// Remplacez la fonction fetchSubscriptionInfo par :
const fetchSubscriptionInfo = async () => {
  try {
    setSubscriptionLoading(true);
    const response = await SubscriptionService.getCurrentSubscription();
    
    if (response.success && response.data) {
      setSubscriptionInfo(response.data);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des informations d\'abonnement:', error);
  } finally {
    setSubscriptionLoading(false);
  }
};

// Fonction pour récupérer les statistiques de vues avec gestion d'erreur améliorée
const fetchViewsStats = async (boutiqueId, period = 'month', isRefresh = false) => {
  if (!boutiqueId || boutiqueId <= 0) {
    console.warn('ID de boutique invalide pour les statistiques:', boutiqueId);
    return;
  }

  try {
    if (!isRefresh) {
      setStatsLoading(true);
    }
    setStatsError(null);
    
    console.log('Récupération des statistiques de vues pour la boutique:', boutiqueId, 'période:', period);
    
    // Utiliser le service de statistiques
    const response = await StatsService.getDashboardStats(boutiqueId, period);
    
    console.log('Réponse des statistiques:', response);
    
    if (response.success && response.data) {
      const statsData = {
        total_views: parseInt(response.data.total_views) || 0,
        unique_views: parseInt(response.data.unique_views) || 0,
        previous_views: parseInt(response.data.previous_views) || 0,
        growth_rate: parseFloat(response.data.growth_rate) || 0
      };
      
      console.log('Statistiques formatées:', statsData);
      setViewsStats(statsData);
      
      // Mettre à jour le store avec les nouvelles données
      if (currentStore) {
        setCurrentStore(prev => ({
          ...prev,
          visitCount: statsData.total_views,
          previousVisits: statsData.previous_views,
          visitsGrowth: statsData.growth_rate,
          uniqueVisits: statsData.unique_views
        }));
      }
    } else {
      // Aucune donnée disponible ou erreur d'authentification - utiliser des valeurs par défaut
      console.warn('Aucune donnée de statistiques récupérée ou problème d\'authentification, utilisation des valeurs par défaut');
      const defaultStats = {
        total_views: 0,
        unique_views: 0,
        previous_views: 0,
        growth_rate: 0
      };
      setViewsStats(defaultStats);
      
      // Ne pas afficher d'erreur d'authentification
      if (response.requireAuth) {
        console.info('Statistiques non disponibles - authentification requise côté API');
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de vues:', error);
    
    // Si c'est une erreur 401, ne pas l'afficher comme erreur utilisateur
    if (error.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.info('Statistiques non disponibles - authentification requise côté API');
      setStatsError(null); // Ne pas afficher d'erreur
    } else {
      setStatsError(error.message || 'Erreur lors du chargement des statistiques');
    }
    
    // En cas d'erreur, utiliser des valeurs par défaut
    const defaultStats = {
      total_views: 0,
      unique_views: 0,
      previous_views: 0,
      growth_rate: 0
    };
    setViewsStats(defaultStats);
  } finally {
    if (!isRefresh) {
      setStatsLoading(false);
    }
  }
};

  // Fonction pour récupérer les statistiques de commandes
  const fetchOrdersStats = async (boutiqueId, period = 'month', isRefresh = false) => {
    if (!boutiqueId || boutiqueId <= 0) {
      console.warn('ID de boutique invalide pour les statistiques de commandes:', boutiqueId);
      return;
    }

    try {
      if (!isRefresh) {
        setOrdersLoading(true);
      }
      setOrdersError(null);
      
      console.log('Récupération des statistiques de commandes pour la boutique:', boutiqueId);
      
      // Utiliser BoutiqueCommandeService pour récupérer les statistiques
      const response = await BoutiqueCommandeService.obtenirStatistiquesBoutique(boutiqueId);
      
      console.log('Réponse des statistiques de commandes:', response);
      
      if (response.success && response.data) {
        const statsData = {
          total_orders: parseInt(response.data.total_commandes) || 0,
          total_revenue: parseFloat(response.data.chiffre_affaires) || 0,
          orders_growth: parseFloat(response.data.croissance_commandes) || 0,
          revenue_growth: parseFloat(response.data.croissance_chiffre_affaires) || 0
        };
        
        console.log('Statistiques de commandes formatées:', statsData);
        setOrdersStats(statsData);
        
        // Mettre à jour le store avec les nouvelles données
        if (currentStore) {
          setCurrentStore(prev => ({
            ...prev,
            orderCount: statsData.total_orders,
            totalRevenue: statsData.total_revenue,
            ordersGrowth: statsData.orders_growth,
            revenueGrowth: statsData.revenue_growth
          }));
        }
      } else {
        // Aucune donnée disponible, utiliser des valeurs par défaut
        console.warn('Aucune donnée de commandes récupérée, utilisation des valeurs par défaut');
        const defaultStats = {
          total_orders: 0,
          total_revenue: 0,
          orders_growth: 0,
          revenue_growth: 0
        };
        setOrdersStats(defaultStats);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de commandes:', error);
      setOrdersError(error.message || 'Erreur lors du chargement des statistiques de commandes');
      
      // En cas d'erreur, utiliser des valeurs par défaut
      const defaultStats = {
        total_orders: 0,
        total_revenue: 0,
        orders_growth: 0,
        revenue_growth: 0
      };
      setOrdersStats(defaultStats);
    } finally {
      if (!isRefresh) {
        setOrdersLoading(false);
      }
    }
  };

  // Fonction pour calculer les jours restants
  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Fonction pour récupérer les boutiques de l'utilisateur
  const fetchUserBoutiques = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      const response = await BoutiqueService.getMyBoutiques();
      
      if (response.success && response.data.length > 0) {
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
          visitCount: 0, // Sera mis à jour par les statistiques réelles
          orderCount: boutique.order_count || 0,
          products: [],
          createdAt: boutique.created_at,
          updatedAt: boutique.updated_at,
          // Données pour les statistiques
          salesAmount: boutique.sales_amount || 0,
          conversionRate: boutique.conversion_rate || 0,
          totalProducts: boutique.total_products || 0,
          publishedProducts: boutique.published_products || 0,
          totalRevenue: boutique.total_revenue || 0,
          monthlyRevenue: boutique.monthly_revenue || 0,
          weeklyOrders: boutique.weekly_orders || 0,
          monthlyOrders: boutique.monthly_orders || 0,
          dailyRevenue: boutique.daily_revenue || 0,
          weeklyRevenue: boutique.weekly_revenue || 0,
          yearlyRevenue: boutique.yearly_revenue || 0,
          dailyOrders: boutique.daily_orders || 0,
          yearlyOrders: boutique.yearly_orders || 0,
          revenueGrowth: boutique.revenue_growth || 0,
          ordersGrowth: boutique.orders_growth || 0,
          conversionGrowth: boutique.conversion_growth || 0
        };
        
        setCurrentStore(transformedBoutique);
        
        // Charger les produits récents après avoir défini la boutique
        await fetchRecentProducts(transformedBoutique.id);
        
        // Charger les statistiques de vues réelles
        await fetchViewsStats(transformedBoutique.id, timeRange);
        
        // Charger les statistiques de commandes
        await fetchOrdersStats(transformedBoutique.id);
        
        // Charger les informations d'abonnement
        await fetchSubscriptionInfo();
        
      } else if (response.success && response.data.length === 0) {
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
  }, []);

  // Recharger les statistiques quand la période change
  useEffect(() => {
    if (currentStore && currentStore.id) {
      fetchViewsStats(currentStore.id, timeRange);
    }
  }, [timeRange, currentStore?.id]);

  // Fonction pour actualiser les données
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Actualiser les données de la boutique
    await fetchUserBoutiques(false);
    
    // Actualiser spécifiquement les statistiques de vues
    if (currentStore && currentStore.id) {
      await fetchViewsStats(currentStore.id, timeRange, true);
    }
    
    // Actualiser spécifiquement les statistiques de commandes
    if (currentStore && currentStore.id) {
      await fetchOrdersStats(currentStore.id, timeRange, true);
    }
    
    setRefreshing(false);
  };

  // Fonction pour actualiser uniquement les statistiques
  const handleStatsRefresh = async () => {
    if (currentStore && currentStore.id) {
      await fetchViewsStats(currentStore.id, timeRange, true);
    }
  };

  // Fonction pour actualiser uniquement les statistiques de commandes
  const handleOrdersStatsRefresh = async () => {
    if (currentStore && currentStore.id) {
      await fetchOrdersStats(currentStore.id, timeRange, true);
    }
  };

  // Calculer les statistiques basées sur les données réelles
  const calculateStats = () => {
    if (!currentStore) return [];

    // Utiliser les vraies données de vues depuis viewsStats
    const currentViews = viewsStats.total_views;
    const uniqueViews = viewsStats.unique_views;
    const visitsGrowth = viewsStats.growth_rate;

    // Utiliser les vraies données de commandes depuis ordersStats
    const currentOrders = ordersStats.total_orders;
    const currentRevenue = ordersStats.total_revenue;
    const ordersGrowth = ordersStats.orders_growth;
    const revenueGrowth = ordersStats.revenue_growth;

    // Calculer le taux de conversion (commandes / visites * 100)
    const conversionRate = currentViews > 0 ? ((currentOrders / currentViews) * 100).toFixed(1) : 0;

    return [
      {
        name: 'Ventes',
        value: `${BoutiqueCommandeService.formaterMontant(currentRevenue)}`,
        change: revenueGrowth ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}%` : '+0%',
        positive: !revenueGrowth || revenueGrowth >= 0,
        icon: <DollarSign size={24} className="text-green-500" />,
        loading: ordersLoading,
        error: ordersError,
        onRefresh: handleOrdersStatsRefresh
      },
      {
        name: 'Commandes',
        value: ordersLoading ? (
          <div className="flex items-center">
            <Loader2 size={16} className="animate-spin mr-1" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span>{currentOrders.toLocaleString()}</span>
            {ordersError && (
              <button 
                onClick={handleOrdersStatsRefresh}
                className="ml-2 text-red-500 hover:text-red-600"
                title="Réessayer"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        ),
        change: ordersLoading ? '...' : `${ordersGrowth > 0 ? '+' : ''}${ordersGrowth}%`,
        positive: !ordersLoading && ordersGrowth >= 0,
        icon: <ShoppingBag size={24} className="text-blue-500" />,
        error: ordersError
      },
      {
        name: 'Visites',
        value: statsLoading ? (
          <div className="flex items-center">
            <Loader2 size={16} className="animate-spin mr-1" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span>{currentViews.toLocaleString()}</span>
            {statsError && (
              <button 
                onClick={handleStatsRefresh}
                className="ml-2 text-red-500 hover:text-red-600"
                title="Réessayer"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        ),
        change: statsLoading ? '...' : `${visitsGrowth > 0 ? '+' : ''}${visitsGrowth}%`,
        positive: !statsLoading && visitsGrowth >= 0,
        icon: <Users size={24} className="text-purple-500" />,
        subtitle: statsLoading ? '' : `${uniqueViews} uniques`,
        error: statsError
      },
      {
        name: 'Taux de conversion',
        value: statsLoading || ordersLoading ? (
          <div className="flex items-center">
            <Loader2 size={16} className="animate-spin mr-1" />
            <span className="text-sm">...</span>
          </div>
        ) : `${conversionRate}%`,
        change: '+0%', // À adapter si vous avez ces données
        positive: true,
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

  // Composant pour affiler les informations d'abonnement
  const SubscriptionBadge = () => {
    if (subscriptionLoading) {
      return (
        <div className="flex items-center text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin mr-2" />
          Chargement...
        </div>
      );
    }

    if (!subscriptionInfo) {
      return (
        <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
          <Package size={16} className="text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">Plan Gratuit</span>
        </div>
      );
    }

    const daysRemaining = calculateDaysRemaining(subscriptionInfo.date_fin);
    const isPremium = !subscriptionInfo.plan?.is_free;
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;

    return (
      <div className={`flex items-center px-3 py-1 rounded-full ${
        isPremium 
          ? isExpiringSoon 
            ? 'bg-red-100 text-red-700' 
            : 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700'
          : 'bg-gray-100 text-gray-700'
      }`}>
        {isPremium ? (
          <Crown size={16} className="mr-2" />
        ) : (
          <Package size={16} className="mr-2" />
        )}
        <span className="text-sm font-medium">
          {subscriptionInfo.plan?.nom || 'Plan Gratuit'}
        </span>
        {isPremium && daysRemaining !== null && (
          <div className="flex items-center ml-2 pl-2 border-l border-current border-opacity-30">
            <Clock size={14} className="mr-1" />
            <span className="text-xs">
              {daysRemaining > 0 ? `${daysRemaining}j restants` : 'Expiré'}
            </span>
          </div>
        )}
      </div>
    );
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
  const daysRemaining = subscriptionInfo ? calculateDaysRemaining(subscriptionInfo.date_fin) : null;
  const isPremium = subscriptionInfo && !subscriptionInfo.plan?.is_free;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-black text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">Bienvenue dans votre boutique</h2>
                <SubscriptionBadge />
              </div>
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
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <Link to={`/store/${currentStore.slug}`} target="_blank">
                <Button variant="outline" className="text-white border-white hover:bg-white/10" icon={<ExternalLink size={16} />} iconPosition="right">
                  Voir ma boutique
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Alerte d'expiration d'abonnement */}
        {isPremium && isExpiringSoon && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">
                  <span className="font-medium">Attention !</span> Votre abonnement {subscriptionInfo.plan?.nom} expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}.
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <Link to="/dashboard/subscriptions">
                  <Button size="sm" variant="primary">
                    Renouveler
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Alerte d'erreur pour les statistiques */}
        {statsError && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Problème de statistiques :</span> {statsError}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button 
                  onClick={handleStatsRefresh}
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerte d'erreur pour les statistiques de commandes */}
        {ordersError && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Problème de commandes :</span> {ordersError}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button 
                  onClick={handleOrdersStatsRefresh}
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="border-b border-gray-200 px-6 py-2 bg-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Aperçu des performances</h3>
          <div className="flex bg-white border border-gray-200 rounded-md">
            {(['today', 'week', 'month', 'year']).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                disabled={statsLoading || ordersLoading}
                className={`px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
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
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
                {stat.error && (
                  <p className="text-xs text-red-500 mt-1">Erreur de chargement</p>
                )}
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
          
          <Link to="/dashboard/subscriptions" className="group">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center">
              <div className="bg-green-100 rounded-full p-3 mb-3 group-hover:bg-green-200 transition-colors">
                <Crown size={24} className="text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Mon abonnement</h4>
              <p className="text-sm text-gray-500">Gérer votre plan d'abonnement</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Store Information Card with Subscription Details */}
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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{currentStore.name}</h3>
                {isPremium && (
                  <div className="flex items-center bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-2 py-1 rounded-full text-xs">
                    <Crown size={12} className="mr-1" />
                    Premium
                  </div>
                )}
              </div>
              <p className="text-sm text-orange-700 mb-1">
                Catégorie: {currentStore.category === 'physical' ? 'Produits physiques' : 
                           currentStore.category === 'digital' ? 'Produits digitaux' : 
                           currentStore.category === 'mixed' ? 'Produits mixtes' : 'Non définie'}
              </p>
              <p className="text-xs text-gray-600 max-w-md line-clamp-2">
                {currentStore.description}
              </p>
              {/* Informations d'abonnement */}
              {subscriptionInfo && (
                <div className="mt-2 text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>Plan: {subscriptionInfo.plan?.nom || 'Gratuit'}</span>
                    {isPremium && daysRemaining !== null && (
                      <span className={`flex items-center ${isExpiringSoon ? 'text-red-600' : 'text-green-600'}`}>
                        <Calendar size={12} className="mr-1" />
                        {daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Expiré'}
                      </span>
                    )}
                  </div>
                </div>
              )}
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
              <div className="flex items-center justify-center">
                <p className="text-2xl font-bold text-orange-600">
                  {statsLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    viewsStats.total_views.toLocaleString()
                  )}
                </p>
                {statsError && (
                  <button 
                    onClick={handleStatsRefresh}
                    className="ml-1 text-red-500 hover:text-red-600"
                    title="Erreur de chargement - Cliquer pour réessayer"
                  >
                    <AlertCircle size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600">
                Visites {viewsStats.unique_views > 0 ? `(${viewsStats.unique_views} uniques)` : ''}
              </p>
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

        {/* Section abonnement étendue pour les plans premium */}
        {isPremium && subscriptionInfo && (
          <div className="mt-4 pt-4 border-t border-orange-200">
            <div className="bg-white bg-opacity-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Crown size={16} className="text-orange-500 mr-2" />
                  Mon abonnement {subscriptionInfo.plan?.nom}
                </h4>
                <Link to="/dashboard/subscriptions">
                  <Button variant="outline" size="sm">
                    Gérer
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    subscriptionInfo.statut === 'actif' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {subscriptionInfo.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Expire le:</span>
                  <span className="font-medium">
                    {new Date(subscriptionInfo.date_fin).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Jours restants:</span>
                  <span className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-green-600'}`}>
                    {daysRemaining > 0 ? daysRemaining : 0}
                  </span>
                </div>
              </div>

              {/* Barre de progression pour les jours restants */}
              {daysRemaining !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Période d'abonnement</span>
                    <span>
                      {Math.max(0, Math.round((daysRemaining / 30) * 100))}% restant
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isExpiringSoon ? 'bg-red-400' : 'bg-gradient-to-r from-orange-400 to-yellow-400'
                      }`}
                      style={{
                        width: `${Math.max(5, Math.min(100, (daysRemaining / 30) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions selon l'état de l'abonnement */}
              {isExpiringSoon && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle size={16} className="text-red-500 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        Abonnement bientôt expiré
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Renouvelez maintenant pour éviter l'interruption de service
                      </p>
                    </div>
                    <Link to="/dashboard/subscriptions">
                      <Button size="sm" variant="primary">
                        Renouveler
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Incitation à l'upgrade pour les utilisateurs gratuits */}
        {!isPremium && (
          <div className="mt-4 pt-4 border-t border-orange-200">
            <div className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium flex items-center">
                    <Crown size={16} className="mr-2" />
                    Passez au premium
                  </h4>
                  <p className="text-sm opacity-90 mt-1">
                    Débloquez toutes les fonctionnalités avancées
                  </p>
                </div>
                <Link to="/dashboard/subscriptions">
                  <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-orange-600">
                    Voir les plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;