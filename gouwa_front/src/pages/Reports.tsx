import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/Button';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';

const salesData = [
  { month: 'Jan', sales: 4500000, orders: 450, customers: 320 },
  { month: 'Fév', sales: 3800000, orders: 380, customers: 290 },
  { month: 'Mar', sales: 5200000, orders: 520, customers: 410 },
  { month: 'Avr', sales: 4800000, orders: 480, customers: 380 },
  { month: 'Mai', sales: 6100000, orders: 610, customers: 480 },
  { month: 'Juin', sales: 5700000, orders: 570, customers: 450 }
];

const topProducts = [
  { name: 'iPhone 15 Pro', sales: 1500000, quantity: 20 },
  { name: 'Robe Traditionnelle', sales: 750000, quantity: 30 },
  { name: 'Ordinateur Portable', sales: 2100000, quantity: 15 },
  { name: 'Chaussures Sport', sales: 600000, quantity: 40 },
  { name: 'Sac à Main', sales: 450000, quantity: 25 }
];

export const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [reportType, setReportType] = useState('sales');

  const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalSales / totalOrders;
  const currentMonth = salesData[salesData.length - 1];
  const previousMonth = salesData[salesData.length - 2];
  const growthRate = ((currentMonth.sales - previousMonth.sales) / previousMonth.sales) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Analyses</h1>
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
          <Button variant="outline" className="flex items-center space-x-2">
            <Download size={16} />
            <span>Exporter PDF</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-gray-900">₣ {totalSales.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {growthRate > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(growthRate).toFixed(1)}% ce mois
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">+{currentMonth.orders} ce mois</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur Moyenne Commande</p>
              <p className="text-2xl font-bold text-gray-900">₣ {avgOrderValue.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-1">Stable</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nouveaux Clients</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonth.customers}</p>
              <p className="text-sm text-green-600 mt-1">+{currentMonth.customers - previousMonth.customers} ce mois</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Évolution des Ventes</h3>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            >
              <option value="sales">Chiffre d'affaires</option>
              <option value="orders">Nombre de commandes</option>
              <option value="customers">Nouveaux clients</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  reportType === 'sales' ? `₣ ${Number(value).toLocaleString()}` : value,
                  reportType === 'sales' ? 'Ventes' : reportType === 'orders' ? 'Commandes' : 'Clients'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey={reportType} 
                stroke="#FF6A00" 
                strokeWidth={2}
                dot={{ fill: '#FF6A00', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Produits</h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.quantity} vendus</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#FF6A00]">
                    ₣ {product.sales.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison Mensuelle</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="sales" fill="#FF6A00" name="Ventes (₣)" />
            <Bar yAxisId="right" dataKey="orders" fill="#1C1C1C" name="Commandes" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};