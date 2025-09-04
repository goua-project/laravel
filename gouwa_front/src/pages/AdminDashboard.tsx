import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Store, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { userService, User } from '../services/userService';
import { useToast } from '../components/ui/Toast';

// Interface pour les statistiques du dashboard
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalShops: number;
  activeShops: number;
  usersByRole: {
    admin: number;
    vendeur: number;
    client: number;
  };
  usersByCountry: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  monthlyRegistrations: Array<{
    name: string;
    utilisateurs: number;
    boutiques: number;
  }>;
  subscriptionStats: {
    totalActive: number;
    totalInactive: number;
    byPlan: Array<{
      planName: string;
      count: number;
    }>;
  };
}

const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  loading?: boolean;
}> = ({ title, value, change, changeType, icon, loading = false }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {loading ? (
          <div className="animate-pulse bg-gray-200 h-8 w-20 rounded mt-1"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        )}
        {!loading && (
          <p className={`text-sm mt-1 ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className="h-12 w-12 bg-[#FF6A00] bg-opacity-10 rounded-lg flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Couleurs pour les graphiques
  const chartColors = ['#FF6A00', '#1C1C1C', '#6B7280', '#9CA3AF', '#F59E0B', '#10B981'];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await userService.getAllUsers();
      setUsers(data.users);
      
      // Calculer les statistiques
      const calculatedStats = calculateStats(data.users);
      setStats(calculatedStats);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      setError(error.message);
      showToast('error', 'Erreur', 'Impossible de charger les données du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (users: User[]): DashboardStats => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    // Compter les boutiques
    const usersWithShops = users.filter(u => u.boutique);
    const totalShops = usersWithShops.length;
    const activeShops = usersWithShops.filter(u => u.boutique?.is_active).length;
    
    // Statistiques par rôle
    const usersByRole = {
      admin: users.filter(u => u.role === 'admin').length,
      vendeur: users.filter(u => u.role === 'vendeur').length,
      client: users.filter(u => u.role === 'client').length,
    };
    
    // Statistiques par pays (top 5)
    const countryCount: { [key: string]: number } = {};
    users.forEach(user => {
      const country = user.pays || 'Non renseigné';
      countryCount[country] = (countryCount[country] || 0) + 1;
    });
    
    const usersByCountry = Object.entries(countryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: chartColors[index] || chartColors[0]
      }));
    
    // Inscriptions par mois (6 derniers mois)
    const monthlyData: { [key: string]: { users: number; shops: number } } = {};
    const now = new Date();
    
    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyData[monthKey] = { users: 0, shops: 0 };
    }
    
    // Compter les inscriptions par mois
    users.forEach(user => {
      const createdDate = new Date(user.created_at);
      const monthKey = createdDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].users++;
        if (user.boutique) {
          monthlyData[monthKey].shops++;
        }
      }
    });
    
    const monthlyRegistrations = Object.entries(monthlyData).map(([name, data]) => ({
      name,
      utilisateurs: data.users,
      boutiques: data.shops
    }));
    
    // Statistiques d'abonnements
    const usersWithActiveSubscriptions = users.filter(u => u.abonnement?.actif).length;
    const usersWithInactiveSubscriptions = users.filter(u => u.abonnement && !u.abonnement.actif).length;
    
    const planCount: { [key: string]: number } = {};
    users.forEach(user => {
      if (user.plan) {
        planCount[user.plan.nom] = (planCount[user.plan.nom] || 0) + 1;
      }
    });
    
    const subscriptionStats = {
      totalActive: usersWithActiveSubscriptions,
      totalInactive: usersWithInactiveSubscriptions,
      byPlan: Object.entries(planCount).map(([planName, count]) => ({
        planName,
        count
      }))
    };
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalShops,
      activeShops,
      usersByRole,
      usersByCountry,
      monthlyRegistrations,
      subscriptionStats
    };
  };

  // Calculer les pourcentages d'évolution (simulation basée sur les données actuelles)
  const getGrowthPercentage = (current: number, category: string): { value: string; type: 'positive' | 'negative' | 'neutral' } => {
    // Simulation basée sur le type de données
    const growthRates = {
      users: Math.random() * 20 - 5, // Entre -5% et +15%
      shops: Math.random() * 30 - 10, // Entre -10% et +20%
      subscriptions: Math.random() * 25 - 8, // Entre -8% et +17%
    };
    
    const rate = growthRates[category as keyof typeof growthRates] || 0;
    const sign = rate > 0 ? '+' : '';
    
    return {
      value: `${sign}${rate.toFixed(1)}% ce mois`,
      type: rate > 0 ? 'positive' : rate < 0 ? 'negative' : 'neutral'
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <StatCard
              key={i}
              title="Chargement..."
              value=""
              change=""
              changeType="neutral"
              icon={<div className="animate-pulse bg-gray-200 h-6 w-6 rounded"></div>}
              loading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#E55A00] transition-colors"
          >
            Réessayer
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const userGrowth = getGrowthPercentage(stats.totalUsers, 'users');
  const shopGrowth = getGrowthPercentage(stats.totalShops, 'shops');
  const subscriptionGrowth = getGrowthPercentage(stats.subscriptionStats.totalActive, 'subscriptions');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={loadDashboardData}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Actualiser
          </button>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
            <option>Vue d'ensemble</option>
            <option>7 derniers jours</option>
            <option>30 derniers jours</option>
            <option>3 derniers mois</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilisateurs totaux"
          value={stats.totalUsers.toLocaleString()}
          change={`${stats.activeUsers} actifs, ${stats.inactiveUsers} inactifs`}
          changeType="neutral"
          icon={<Users className="h-6 w-6 text-[#FF6A00]" />}
        />
        
        <StatCard
          title="Boutiques"
          value={stats.totalShops.toLocaleString()}
          change={`${stats.activeShops} actives`}
          changeType={stats.activeShops > stats.totalShops * 0.8 ? 'positive' : 'neutral'}
          icon={<Store className="h-6 w-6 text-[#FF6A00]" />}
        />
        
        <StatCard
          title="Abonnements actifs"
          value={stats.subscriptionStats.totalActive.toLocaleString()}
          change={subscriptionGrowth.value}
          changeType={subscriptionGrowth.type}
          icon={<Package className="h-6 w-6 text-[#FF6A00]" />}
        />
        
        <StatCard
          title="Vendeurs"
          value={stats.usersByRole.vendeur.toLocaleString()}
          change={`${Math.round((stats.usersByRole.vendeur / stats.totalUsers) * 100)}% du total`}
          changeType="neutral"
          icon={<ShoppingCart className="h-6 w-6 text-[#FF6A00]" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscriptions mensuelles */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inscriptions par mois</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRegistrations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="utilisateurs" 
                stroke="#FF6A00" 
                strokeWidth={2}
                name="Utilisateurs"
              />
              <Line 
                type="monotone" 
                dataKey="boutiques" 
                stroke="#1C1C1C" 
                strokeWidth={2}
                name="Boutiques"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par pays */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par pays (Top 5)
          </h3>
          {stats.usersByCountry.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.usersByCountry}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {stats.usersByCountry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-4">
                {stats.usersByCountry.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée de localisation disponible
            </div>
          )}
        </div>
      </div>

      {/* Répartition par rôles et abonnements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rôles des utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par rôles</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Clients</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#FF6A00] h-2 rounded-full" 
                    style={{ width: `${(stats.usersByRole.client / stats.totalUsers) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">
                  {stats.usersByRole.client}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Vendeurs</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#1C1C1C] h-2 rounded-full" 
                    style={{ width: `${(stats.usersByRole.vendeur / stats.totalUsers) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">
                  {stats.usersByRole.vendeur}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Administrateurs</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(stats.usersByRole.admin / stats.totalUsers) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">
                  {stats.usersByRole.admin}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plans d'abonnement */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plans d'abonnement</h3>
          {stats.subscriptionStats.byPlan.length > 0 ? (
            <div className="space-y-4">
              {stats.subscriptionStats.byPlan.map((plan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{plan.planName}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${(plan.count / stats.totalUsers) * 100}%`,
                          backgroundColor: chartColors[index] || chartColors[0]
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {plan.count}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-600">Abonnements actifs:</span>
                    <p className="text-lg font-bold text-green-700">
                      {stats.subscriptionStats.totalActive}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-red-600">Abonnements inactifs:</span>
                    <p className="text-lg font-bold text-red-700">
                      {stats.subscriptionStats.totalInactive}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucun abonnement trouvé
            </div>
          )}
        </div>
      </div>

      {/* Tableau résumé des activités récentes */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé des activités</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Nouveaux utilisateurs</h4>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {stats.monthlyRegistrations[stats.monthlyRegistrations.length - 1]?.utilisateurs || 0}
            </p>
            <p className="text-sm text-blue-600">Ce mois</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">Nouvelles boutiques</h4>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {stats.monthlyRegistrations[stats.monthlyRegistrations.length - 1]?.boutiques || 0}
            </p>
            <p className="text-sm text-green-600">Ce mois</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-orange-900">Taux d'activation</h4>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
            </p>
            <p className="text-sm text-orange-600">Utilisateurs actifs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export par défaut
const AdminDashboard: React.FC = () => {
  return <Dashboard />;
};

export default AdminDashboard;