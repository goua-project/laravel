import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import TrendsService from '../services/TrendsService';
import { Search, TrendingUp, Eye, Star, Users, ShoppingBag, DollarSign } from 'lucide-react';

export const TrendingShops = () => {
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopType, setSelectedShopType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopStats, setShopStats] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadTrendingShops();
  }, []);

  const loadTrendingShops = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les boutiques avec leurs statistiques
      const boutiquesResponse = await TrendsService.getAllBoutiquesWithStats();
      console.log('Boutiques avec stats récupérées:', boutiquesResponse);

      if (boutiquesResponse && boutiquesResponse.length > 0) {
        // Enrichir chaque boutique avec ses données
        const enrichedShops = await Promise.all(
          boutiquesResponse.map(async (boutique) => {
            try {
              // Récupérer les produits de la boutique
              const productsData = await TrendsService.getBoutiqueProducts(boutique.id).catch(() => []);

              return {
                id: boutique.id,
                name: boutique.nom,
                owner: boutique.user?.nom || boutique.user?.name || 'Propriétaire',
                shop_type: boutique.type || 'physical',
                category: getCategoryDisplay(boutique.categorie),
                location: 'Côte d\'Ivoire',
                total_sales: boutique.total_sales || 0,
                orders_count: boutique.total_orders || 0,
                total_visits: boutique.total_views || 0,
                unique_visits: boutique.unique_views || 0,
                growth_rate: Math.max(boutique.views_growth || 0, boutique.orders_growth || 0),
                is_trending: boutique.is_trending || false,
                avatar: boutique.logo ? getLogoUrl(boutique.logo) : null,
                slug: boutique.slug,
                description: boutique.description,
                products_count: Array.isArray(productsData) ? productsData.length : 0,
                created_at: boutique.created_at,
                is_active: boutique.is_active,
                status: boutique.status,
                original_boutique: boutique
              };
            } catch (error) {
              console.error(`Erreur lors de l'enrichissement de la boutique ${boutique.nom}:`, error);
              
              return {
                id: boutique.id,
                name: boutique.nom,
                owner: boutique.user?.nom || boutique.user?.name || 'Propriétaire',
                shop_type: boutique.type || 'physical',
                category: getCategoryDisplay(boutique.categorie),
                location: 'Côte d\'Ivoire',
                total_sales: 0,
                orders_count: 0,
                total_visits: 0,
                unique_visits: 0,
                growth_rate: 0,
                is_trending: false,
                avatar: boutique.logo ? getLogoUrl(boutique.logo) : null,
                slug: boutique.slug,
                description: boutique.description,
                products_count: 0,
                created_at: boutique.created_at,
                is_active: boutique.is_active,
                status: boutique.status,
                original_boutique: boutique
              };
            }
          })
        );

        // Filtrer les boutiques actives et les trier par tendance et vues
        const activeShops = enrichedShops.filter(shop => 
          shop.is_active && shop.status === 'active'
        );

        const sortedShops = activeShops.sort((a, b) => {
          if (a.is_trending && !b.is_trending) return -1;
          if (!a.is_trending && b.is_trending) return 1;
          
          if (Math.abs(a.growth_rate - b.growth_rate) > 1) {
            return b.growth_rate - a.growth_rate;
          }
          
          return b.total_visits - a.total_visits;
        });

        setShops(sortedShops);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des boutiques tendance:', error);
      showToast('error', 'Erreur', 'Impossible de charger les boutiques tendance');
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour déterminer le statut tendance
  const calculateTrendingStatus = (viewsGrowth, ordersGrowth, totalViews, totalOrders) => {
    const hasHighViewsGrowth = viewsGrowth > 20;
    const hasHighOrdersGrowth = ordersGrowth > 15;
    const hasGoodTrafficWithGrowth = totalViews > 50 && viewsGrowth > 0;
    const hasGoodSalesWithGrowth = totalOrders > 5 && ordersGrowth > 0;
    
    return hasHighViewsGrowth || hasHighOrdersGrowth || hasGoodTrafficWithGrowth || hasGoodSalesWithGrowth;
  };

  const getCategoryDisplay = (category) => {
    const categories = {
      'physical': 'Produits Physiques',
      'digital': 'Produits Numériques', 
      'service': 'Services'
    };
    return categories[category] || category || 'Non catégorisé';
  };

  const getLogoUrl = (logoPath) => {
    // Implémentez votre logique pour générer l'URL du logo
    return logoPath ? `/storage/${logoPath}` : null;
  };

  const viewShopStats = async (shop) => {
    try {
      setSelectedShop(shop);
      setIsStatsModalOpen(true);

      // Charger les statistiques détaillées
      const [detailedViews, detailedOrders, topProductsData, paymentsData] = await Promise.all([
        TrendsService.getDetailedViews(shop.id),
        TrendsService.getDetailedOrders(shop.id),
        TrendsService.getTopProducts(shop.id),
        TrendsService.getPaymentsStats(shop.id)
      ]);

      const detailedStats = {
        total_sales: detailedOrders.total_sales,
        total_orders: detailedOrders.total_orders,
        completed_orders: detailedOrders.completed_orders,
        pending_orders: detailedOrders.pending_orders,
        avg_order_value: detailedOrders.avg_order_value,
        
        total_views: detailedViews.total_views,
        unique_views: detailedViews.unique_views,
        conversion_rate: detailedViews.total_views > 0 ? 
          (detailedOrders.total_orders / detailedViews.total_views * 100) : 0,
        
        views_growth_rate: detailedViews.growth_rate,
        orders_growth_rate: detailedOrders.growth_rate,
        
        top_products: topProductsData.map(item => ({
          id: item.produit_id,
          name: item.produit_nom,
          total_quantity: parseInt(item.total_quantity),
          total_sales: parseFloat(item.total_sales),
          unit_price: parseFloat(item.prix_unitaire)
        })),
        
        successful_payments: paymentsData.successful_payments,
        failed_payments: paymentsData.failed_payments,
        payment_success_rate: paymentsData.success_rate,
        
        top_countries: detailedViews.top_countries || [],
        top_cities: detailedViews.top_cities || [],
        top_browsers: detailedViews.top_browsers || [],
        top_devices: detailedViews.top_devices || [],
        daily_views: detailedViews.daily_views || [],
        daily_orders: detailedOrders.daily_orders || []
      };

      setShopStats(detailedStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques détaillées:', error);
      showToast('error', 'Erreur', 'Impossible de charger les statistiques détaillées');
      
      setShopStats({
        total_sales: shop.total_sales || 0,
        total_orders: shop.orders_count || 0,
        total_views: shop.total_visits || 0,
        conversion_rate: 0,
        avg_order_value: 0,
        views_growth_rate: shop.growth_rate || 0,
        orders_growth_rate: 0,
        top_products: [],
        successful_payments: 0,
        failed_payments: 0,
        payment_success_rate: 0,
        top_countries: [],
        top_cities: [],
        top_browsers: [],
        top_devices: []
      });
    }
  };

  // Fonctions pour récupérer les données détaillées
  const getDetailedViews = async (boutiqueId) => {
    try {
      const response = await fetch(`/api/boutiques/${boutiqueId}/detailed-views`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Erreur récupération vues détaillées:', error);
    }
    return { total_views: 0, unique_views: 0, growth_rate: 0 };
  };

  const getDetailedOrders = async (boutiqueId) => {
    try {
      const response = await fetch(`/api/boutiques/${boutiqueId}/detailed-orders`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Erreur récupération commandes détaillées:', error);
    }
    return { total_orders: 0, total_sales: 0, avg_order_value: 0, growth_rate: 0 };
  };

  const getTopProducts = async (boutiqueId) => {
    try {
      const response = await fetch(`/api/boutiques/${boutiqueId}/top-products`);
      if (response.ok) {
        const data = await response.json();
        return data.map(item => ({
          id: item.produit_id,
          name: item.produit_nom,
          total_quantity: parseInt(item.total_quantity),
          total_sales: parseFloat(item.total_sales),
          unit_price: parseFloat(item.prix_unitaire)
        }));
      }
    } catch (error) {
      console.error('Erreur récupération top produits:', error);
    }
    return [];
  };

  const getPaymentsStats = async (boutiqueId) => {
    try {
      const response = await fetch(`/api/boutiques/${boutiqueId}/payments-stats`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Erreur récupération stats paiements:', error);
    }
    return { successful_payments: 0, failed_payments: 0, success_rate: 0 };
  };

  const columns = [
    {
      key: 'name',
      title: 'Boutique',
      render: (value, record) => (
        <div className="flex items-center">
          <div className="w-12 h-12 bg-[#FF6A00] rounded-lg flex items-center justify-center text-white font-medium">
            {record.avatar ? (
              <img src={record.avatar} alt={value} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              value.charAt(0).toUpperCase()
            )}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <p className="font-medium">{value}</p>
              {record.is_trending && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  Tendance
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{record.owner}</p>
          </div>
        </div>
      )
    },
    {
      key: 'shop_type',
      title: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'digital' 
            ? 'bg-blue-100 text-blue-800' 
            : value === 'service'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {value === 'digital' ? '💻 Numérique' : 
           value === 'service' ? '🔧 Service' : '📦 Physique'}
        </span>
      )
    },
    {
      key: 'category',
      title: 'Catégorie',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value}
        </span>
      )
    },
    {
      key: 'products_count',
      title: 'Produits',
      render: (value) => (
        <span className="font-medium text-gray-600">{value || 0}</span>
      )
    },
    {
      key: 'total_sales',
      title: 'CA Réel',
      render: (value) => (
        <span className="font-medium text-green-600">
          {value > 0 ? `${value.toLocaleString()} CFA` : '0 CFA'}
        </span>
      )
    },
    {
      key: 'orders_count',
      title: 'Commandes',
      render: (value) => (
        <span className="font-medium">{value || 0}</span>
      )
    },
    {
      key: 'total_visits',
      title: 'Vues Totales',
      render: (value) => (
        <span className="font-medium text-blue-600">{(value || 0).toLocaleString()}</span>
      )
    },
    {
      key: 'unique_visits',
      title: 'Vues Uniques',
      render: (value) => (
        <span className="font-medium text-indigo-600">{(value || 0).toLocaleString()}</span>
      )
    },
    {
      key: 'growth_rate',
      title: 'Croissance',
      render: (value) => (
        <div className="flex items-center">
          <TrendingUp 
            size={16} 
            className={value > 0 ? 'text-green-500 mr-1' : 'text-red-500 mr-1 rotate-180'} 
          />
          <span className={`font-medium ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {value > 0 ? '+' : ''}{(value || 0).toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <button
          className="p-2 text-gray-600 hover:text-[#FF6A00] transition-colors"
          onClick={() => viewShopStats(record)}
          title="Voir les statistiques détaillées"
        >
          <Eye size={16} />
        </button>
      )
    }
  ];

  // Filtrer les boutiques
  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedShopType === 'all' || shop.shop_type === selectedShopType;
    
    return matchesSearch && matchesType;
  });

  // Calculer les vraies statistiques globales
  const trendingCount = shops.filter(shop => shop.is_trending).length;
  const digitalShops = shops.filter(shop => shop.shop_type === 'digital').length;
  const physicalShops = shops.filter(shop => shop.shop_type === 'physical').length;
  const serviceShops = shops.filter(shop => shop.shop_type === 'service').length;
  const totalSales = shops.reduce((sum, shop) => sum + (shop.total_sales || 0), 0);
  const totalVisits = shops.reduce((sum, shop) => sum + (shop.total_visits || 0), 0);
  const totalOrders = shops.reduce((sum, shop) => sum + (shop.orders_count || 0), 0);
  const avgGrowth = shops.length > 0 ? shops.reduce((sum, shop) => sum + (shop.growth_rate || 0), 0) / shops.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Boutiques Tendance</h1>
        <Button variant="outline" onClick={loadTrendingShops}>
          Actualiser
        </Button>
      </div>

      {/* Stats Cards - Données réelles */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Boutiques Tendance</p>
              <p className="text-2xl font-bold text-gray-900">{trendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">CA Total Réel</p>
              <p className="text-2xl font-bold text-gray-900">{totalSales.toLocaleString()} CFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Commandes Totales</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Vues Totales</p>
              <p className="text-2xl font-bold text-gray-900">{totalVisits.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Croissance Moy.</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold text-xs">🏪</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Boutiques</p>
              <p className="text-2xl font-bold text-gray-900">{shops.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher une boutique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedShopType}
            onChange={(e) => setSelectedShopType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          >
            <option value="all">Tous les types ({shops.length})</option>
            <option value="physical">📦 Physiques ({physicalShops})</option>
            <option value="digital">💻 Numériques ({digitalShops})</option>
            <option value="service">🔧 Services ({serviceShops})</option>
          </select>
        </div>

        <Table columns={columns} data={filteredShops} loading={loading} />
      </div>

      {/* Modal des statistiques détaillées - Avec vraies données */}
      <Modal
        isOpen={isStatsModalOpen}
        onClose={() => {
          setIsStatsModalOpen(false);
          setSelectedShop(null);
          setShopStats(null);
        }}
        title={`Statistiques Détaillées - ${selectedShop?.name}`}
      >
        {shopStats && (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* KPIs principaux - Vraies données */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-600">Chiffre d'Affaires Réel</p>
                <p className="text-xl font-bold text-green-900">{shopStats.total_sales.toLocaleString()} CFA</p>
                {shopStats.orders_growth_rate !== 0 && (
                  <p className={`text-sm ${shopStats.orders_growth_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {shopStats.orders_growth_rate > 0 ? '+' : ''}{shopStats.orders_growth_rate.toFixed(1)}% vs période précédente
                  </p>
                )}
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Commandes</p>
                <p className="text-xl font-bold text-blue-900">{shopStats.total_orders}</p>
                <p className="text-sm text-blue-600">
                  Panier moyen: {shopStats.avg_order_value.toLocaleString()} CFA
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-purple-600">Taux de Conversion</p>
                <p className="text-xl font-bold text-purple-900">{shopStats.conversion_rate.toFixed(2)}%</p>
                <p className="text-sm text-purple-600">
                  {shopStats.total_orders} commandes / {shopStats.total_views} vues
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-orange-600">Taux de Paiement</p>
                <p className="text-xl font-bold text-orange-900">{shopStats.payment_success_rate.toFixed(1)}%</p>
                <p className="text-sm text-orange-600">
                  {shopStats.successful_payments} réussis / {shopStats.failed_payments} échecs
                </p>
              </div>
            </div>

            {/* Statistiques de trafic */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-indigo-600">Vues Totales</p>
                <p className="text-lg font-bold text-indigo-900">{shopStats.total_views.toLocaleString()}</p>
                <p className={`text-sm ${shopStats.views_growth_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {shopStats.views_growth_rate > 0 ? '+' : ''}{shopStats.views_growth_rate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-cyan-600">Vues Uniques</p>
                <p className="text-lg font-bold text-cyan-900">{shopStats.unique_views.toLocaleString()}</p>
                <p className="text-sm text-cyan-600">
                  {shopStats.total_views > 0 ? ((shopStats.unique_views / shopStats.total_views) * 100).toFixed(1) : 0}% du total
                </p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-pink-600">Commandes en Cours</p>
                <p className="text-lg font-bold text-pink-900">{shopStats.pending_orders || 0}</p>
                <p className="text-sm text-pink-600">
                  {shopStats.completed_orders || 0} terminées
                </p>
              </div>
            </div>

            {/* Top produits - Vraies données de commande_produit */}
            {shopStats.top_products.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Top Produits (Ventes Réelles)</h4>
                <div className="space-y-2">
                  {shopStats.top_products.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-[#FF6A00] text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <p className="text-sm text-gray-500">{product.unit_price.toLocaleString()} CFA/unité</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#FF6A00]">{product.total_sales.toLocaleString()} CFA</p>
                        <p className="text-sm text-gray-600">{product.total_quantity} vendus</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Données géographiques - Si disponibles */}
            {shopStats.top_countries.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Répartition Géographique</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Top Pays</p>
                    <div className="space-y-1">
                      {shopStats.top_countries.slice(0, 3).map((country, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{country.country || 'Non spécifié'}</span>
                          <span className="font-medium">{country.views}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Top Villes</p>
                    <div className="space-y-1">
                      {shopStats.top_cities.slice(0, 3).map((city, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{city.city || 'Non spécifiée'}</span>
                          <span className="font-medium">{city.views}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Données techniques - Si disponibles */}
            {shopStats.top_browsers.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Données Techniques</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Top Navigateurs</p>
                    <div className="space-y-1">
                      {shopStats.top_browsers.slice(0, 3).map((browser, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{browser.browser || 'Inconnu'}</span>
                          <span className="font-medium">{browser.views}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Top Appareils</p>
                    <div className="space-y-1">
                      {shopStats.top_devices.slice(0, 3).map((device, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{device.device_type || 'Inconnu'}</span>
                          <span className="font-medium">{device.views}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message si pas de données */}
            {shopStats.top_products.length === 0 && (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune vente enregistrée pour cette boutique</p>
                <p className="text-sm text-gray-400 mt-1">
                  {shopStats.total_views > 0 ? `${shopStats.total_views} vues mais aucune conversion` : 'Aucune activité détectée'}
                </p>
              </div>
            )}

            {/* Informations sur la boutique */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Informations Boutique</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Statut:</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedShop?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedShop?.status === 'active' ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600">Nombre de produits:</p>
                  <p className="font-medium">{selectedShop?.products_count || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Créée le:</p>
                  <p className="font-medium">
                    {selectedShop?.created_at ? new Date(selectedShop.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Type de boutique:</p>
                  <p className="font-medium">{getCategoryDisplay(selectedShop?.shop_type)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};