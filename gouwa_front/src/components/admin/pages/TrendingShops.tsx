import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { trendingShopsAPI, TrendingShop, ShopStats } from '../services/api';
import { Search, TrendingUp, Eye, Star, Users, ShoppingBag, DollarSign } from 'lucide-react';

export const TrendingShops: React.FC = () => {
  const [shops, setShops] = useState<TrendingShop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopType, setSelectedShopType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<TrendingShop | null>(null);
  const [shopStats, setShopStats] = useState<ShopStats | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadTrendingShops();
  }, []);

  const loadTrendingShops = async () => {
    try {
      setLoading(true);
      const data = await trendingShopsAPI.getTrendingShops();
      setShops(data);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de charger les boutiques tendance');
    } finally {
      setLoading(false);
    }
  };

  const viewShopStats = async (shop: TrendingShop) => {
    try {
      setSelectedShop(shop);
      const stats = await trendingShopsAPI.getShopStats(shop.id);
      setShopStats(stats);
      setIsStatsModalOpen(true);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de charger les statistiques');
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Boutique',
      render: (value: string, record: TrendingShop) => (
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
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'digital' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {value === 'digital' ? '💻 Numérique' : '📦 Physique'}
        </span>
      )
    },
    {
      key: 'category',
      title: 'Catégorie',
      render: (value: string) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value}
        </span>
      )
    },
    {
      key: 'location',
      title: 'Localisation',
      render: (value: string) => (
        <span className={`text-sm ${value === 'En ligne' ? 'text-blue-600 italic' : 'text-gray-600'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'total_sales',
      title: 'Ventes Totales',
      render: (value: number) => (
        <span className="font-medium text-green-600">₣ {value.toLocaleString()}</span>
      )
    },
    {
      key: 'orders_count',
      title: 'Commandes',
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'total_visits',
      title: 'Visites',
      render: (value: number) => (
        <span className="font-medium text-blue-600">{value.toLocaleString()}</span>
      )
    },
    {
      key: 'growth_rate',
      title: 'Croissance',
      render: (value: number) => (
        <div className="flex items-center">
          <TrendingUp 
            size={16} 
            className={value > 0 ? 'text-green-500 mr-1' : 'text-red-500 mr-1 rotate-180'} 
          />
          <span className={`font-medium ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {value > 0 ? '+' : ''}{value.toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: TrendingShop) => (
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

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.shop_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const trendingCount = shops.filter(shop => shop.is_trending).length;
  const totalSales = shops.reduce((sum, shop) => sum + shop.total_sales, 0);
  const totalVisits = shops.reduce((sum, shop) => sum + shop.total_visits, 0);
  const avgGrowth = shops.length > 0 ? shops.reduce((sum, shop) => sum + shop.growth_rate, 0) / shops.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Boutiques Tendance</h1>
        <Button variant="outline" onClick={loadTrendingShops}>
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
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
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">💻</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Boutiques Numériques</p>
              <p className="text-2xl font-bold text-gray-900">{digitalShops}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">📦</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Boutiques Physiques</p>
              <p className="text-2xl font-bold text-gray-900">{physicalShops}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ventes Totales</p>
              <p className="text-2xl font-bold text-gray-900">₣ {totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Visites Totales</p>
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
              <p className="text-sm font-medium text-gray-600">Croissance Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
              </p>
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
            <option value="all">Tous les types</option>
            <option value="digital">💻 Boutiques Numériques</option>
            <option value="physical">📦 Boutiques Physiques</option>
          </select>
        </div>

        <Table columns={columns} data={filteredShops} loading={loading} />
      </div>

      {/* Modal des statistiques détaillées */}
      <Modal
        isOpen={isStatsModalOpen}
        onClose={() => {
          setIsStatsModalOpen(false);
          setSelectedShop(null);
          setShopStats(null);
        }}
        title={`Statistiques - ${selectedShop?.name}`}
      >
        {shopStats && (
          <div className="space-y-6">
            {/* KPIs principaux */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                <p className="text-xl font-bold text-gray-900">₣ {shopStats.total_sales.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Commandes</p>
                <p className="text-xl font-bold text-gray-900">{shopStats.total_orders}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Taux de Conversion</p>
                <p className="text-xl font-bold text-gray-900">{shopStats.conversion_rate.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Panier Moyen</p>
                <p className="text-xl font-bold text-gray-900">₣ {shopStats.avg_order_value.toLocaleString()}</p>
              </div>
            </div>

            {/* Top produits */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Top Produits</h4>
              <div className="space-y-2">
                {shopStats.top_products.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-[#FF6A00] text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#FF6A00]">₣ {product.sales.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{product.quantity_sold} vendus</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};