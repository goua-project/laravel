import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Store, Package, ShoppingCart } from 'lucide-react';

const salesData = [
  { name: 'Jan', ventes: 4000, commandes: 240 },
  { name: 'Fév', ventes: 3000, commandes: 180 },
  { name: 'Mar', ventes: 5000, commandes: 300 },
  { name: 'Avr', ventes: 4500, commandes: 270 },
  { name: 'Mai', ventes: 6000, commandes: 360 },
  { name: 'Juin', ventes: 5500, commandes: 330 },
];

const categoryData = [
  { name: 'Électronique', value: 35, color: '#FF6A00' },
  { name: 'Mode', value: 25, color: '#1C1C1C' },
  { name: 'Maison', value: 20, color: '#6B7280' },
  { name: 'Sport', value: 20, color: '#9CA3AF' },
];

const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
}> = ({ title, value, change, changeType, icon }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className={`text-sm mt-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </p>
      </div>
      <div className="h-12 w-12 bg-[#FF6A00] bg-opacity-10 rounded-lg flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
            <option>7 derniers jours</option>
            <option>30 derniers jours</option>
            <option>3 derniers mois</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenus totaux"
          value="₣ 245,650"
          change="+12.5% ce mois"
          changeType="positive"
          icon={<TrendingUp className="h-6 w-6 text-[#FF6A00]" />}
        />
        <StatCard
          title="Utilisateurs actifs"
          value="12,483"
          change="+8.2% ce mois"
          changeType="positive"
          icon={<Users className="h-6 w-6 text-[#FF6A00]" />}
        />
        <StatCard
          title="Boutiques"
          value="345"
          change="+23 nouvelles"
          changeType="positive"
          icon={<Store className="h-6 w-6 text-[#FF6A00]" />}
        />
        <StatCard
          title="Commandes"
          value="1,847"
          change="-2.1% ce mois"
          changeType="negative"
          icon={<ShoppingCart className="h-6 w-6 text-[#FF6A00]" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des ventes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ventes" stroke="#FF6A00" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par catégorie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-4">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commandes par mois</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="commandes" fill="#FF6A00" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};