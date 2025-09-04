import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../components/ui/Button';
import { analyticsAPI, AnalyticsSummary } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Star, Users, Store, MessageSquare } from 'lucide-react';

// Données simulées pour les graphiques
const salesTrendData = [
  { month: 'Jan', sales: 4500000, orders: 450, reviews: 120 },
  { month: 'Fév', sales: 3800000, orders: 380, reviews: 95 },
  { month: 'Mar', sales: 5200000, orders: 520, reviews: 140 },
  { month: 'Avr', sales: 4800000, orders: 480, reviews: 125 },
  { month: 'Mai', sales: 6100000, orders: 610, reviews: 165 },
  { month: 'Juin', sales: 5700000, orders: 570, reviews: 150 }
];

const popularProductsData = [
  { name: 'iPhone 15 Pro', sales: 1500000, reviews: 45, rating: 4.8 },
  { name: 'Robe Traditionnelle', sales: 750000, reviews: 32, rating: 4.6 },
  { name: 'Ordinateur Portable', sales: 2100000, reviews: 28, rating: 4.7 },
  { name: 'Chaussures Sport', sales: 600000, reviews: 38, rating: 4.5 },
  { name: 'Sac à Main', sales: 450000, reviews: 25, rating: 4.4 }
];

const satisfactionData = [
  { name: 'Excellent (5★)', value: 45, color: '#10B981' },
  { name: 'Bon (4★)', value: 30, color: '#3B82F6' },
  { name: 'Moyen (3★)', value: 15, color: '#F59E0B' },
  { name: 'Faible (1-2★)', value: 10, color: '#EF4444' }
];

export const EnhancedAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const { showToast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getSummary();
      setAnalytics(data);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de charger les analytics');
      // Utiliser des données simulées en cas d'erreur
      setAnalytics({
        total_revenue: 28500000,
        total_orders: 3010,
        total_reviews: 735,
        avg_rating: 4.6,
        conversion_rate: 3.2,
        trending_shops_count: 12,
        guest_orders_percentage: 25.5,
        monthly_growth: {
          revenue: 12.5,
          orders: 8.3,
          reviews: 15.2
        },
        top_categories: [
          { name: 'Électronique', sales: 12500000, percentage: 43.8 },
          { name: 'Mode', sales: 8200000, percentage: 28.8 },
          { name: 'Maison', sales: 4800000, percentage: 16.8 },
          { name: 'Sport', sales: 3000000, percentage: 10.5 }
        ],
        customer_satisfaction: {
          excellent: 45,
          good: 30,
          average: 15,
          poor: 10
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, changeType, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div className="flex items-center mt-1">
            {changeType === 'positive' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </span>
          </div>
        </div>
        <div className={`h-12 w-12 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Enrichis</h1>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          >
            <option value="1month">1 mois</option>
            <option value="3months">3 mois</option>
            <option value="6months">6 mois</option>
            <option value="1year">1 an</option>
          </select>
          <Button variant="outline" onClick={loadAnalytics}>
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'Affaires Total"
          value={`₣ ${analytics.total_revenue.toLocaleString()}`}
          change={`+${analytics.monthly_growth.revenue}% ce mois`}
          changeType="positive"
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Commandes Totales"
          value={analytics.total_orders.toLocaleString()}
          change={`+${analytics.monthly_growth.orders}% ce mois`}
          changeType="positive"
          icon={<ShoppingCart className="h-6 w-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Avis Clients"
          value={analytics.total_reviews.toLocaleString()}
          change={`+${analytics.monthly_growth.reviews}% ce mois`}
          changeType="positive"
          icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
          color="bg-purple-100"
        />
        <StatCard
          title="Note Moyenne"
          value={`${analytics.avg_rating}/5`}
          change={`${analytics.conversion_rate}% conversion`}
          changeType="positive"
          icon={<Star className="h-6 w-6 text-yellow-600" />}
          color="bg-yellow-100"
        />
      </div>

      {/* Métriques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Boutiques Tendance</h3>
            <Store className="h-6 w-6 text-[#FF6A00]" />
          </div>
          <p className="text-3xl font-bold text-[#FF6A00]">{analytics.trending_shops_count}</p>
          <p className="text-sm text-gray-600 mt-1">boutiques en tendance</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Commandes Invitées</h3>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{analytics.guest_orders_percentage}%</p>
          <p className="text-sm text-gray-600 mt-1">du total des commandes</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Taux de Conversion</h3>
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{analytics.conversion_rate}%</p>
          <p className="text-sm text-gray-600 mt-1">visiteurs → acheteurs</p>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Ventes et Avis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#FF6A00" strokeWidth={2} name="Ventes (₣)" />
              <Line yAxisId="right" type="monotone" dataKey="reviews" stroke="#8B5CF6" strokeWidth={2} name="Avis" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Satisfaction Client</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={satisfactionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {satisfactionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-4">
            {satisfactionData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top catégories et produits populaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Catégories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.top_categories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`₣ ${Number(value).toLocaleString()}`, 'Ventes']} />
              <Bar dataKey="sales" fill="#FF6A00" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits Populaires</h3>
          <div className="space-y-4">
            {popularProductsData.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-[#FF6A00] text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star size={12} className="text-yellow-400 fill-current mr-1" />
                      {product.rating} ({product.reviews} avis)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#FF6A00]">₣ {product.sales.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};