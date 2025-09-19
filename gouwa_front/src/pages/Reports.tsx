import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import CommandeApiService from '../services/commandeApiService';
import BoutiqueCommandeService from '../services/BoutiqueCommandeService';

export const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [reportType, setReportType] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    commandes: [],
    statistiques: null,
    evolutionData: [],
    produitsPopulaires: [],
    clientsUniques: []
  });

  // Récupérer l'ID de la boutique depuis le localStorage ou le contexte
  const getBoutiqueId = () => {
    return localStorage.getItem('boutique_id') || '1'; // Valeur par défaut
  };

  // Charger les données au montage du composant
  useEffect(() => {
    chargerDonneesRapports();
  }, [selectedPeriod]);

  const chargerDonneesRapports = async () => {
    setLoading(true);
    setError(null);

    try {
      const boutiqueId = getBoutiqueId();
      
      // Filtres basés sur la période sélectionnée
      const filtres = getFiltersForPeriod(selectedPeriod);

      // Charger les commandes et statistiques en parallèle
      const [commandesResult, statsResult] = await Promise.all([
        BoutiqueCommandeService.listerCommandesBoutique(boutiqueId, filtres),
        BoutiqueCommandeService.obtenirStatistiquesBoutique(boutiqueId)
      ]);

      if (commandesResult.success && statsResult.success) {
        const commandes = commandesResult.data.data || [];
        
        // Traiter les données pour les graphiques
        const evolutionData = BoutiqueCommandeService.calculerEvolutionCommandes(commandes, 30);
        const produitsPopulaires = BoutiqueCommandeService.analyserProduitsPopulaires(commandes);
        const clientsUniques = BoutiqueCommandeService.extraireClientsUniques(commandes);

        setData({
          commandes,
          statistiques: statsResult.data,
          evolutionData,
          produitsPopulaires: produitsPopulaires.slice(0, 5), // Top 5
          clientsUniques: clientsUniques.slice(0, 10) // Top 10
        });
      } else {
        setError(commandesResult.message || statsResult.message || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const getFiltersForPeriod = (period) => {
    const now = new Date();
    const filters = {};

    switch (period) {
      case '1month':
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        filters.date_debut = oneMonthAgo.toISOString().split('T')[0];
        break;
      case '3months':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        filters.date_debut = threeMonthsAgo.toISOString().split('T')[0];
        break;
      case '6months':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        filters.date_debut = sixMonthsAgo.toISOString().split('T')[0];
        break;
      case '1year':
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        filters.date_debut = oneYearAgo.toISOString().split('T')[0];
        break;
    }

    return filters;
  };

  const calculerKPIs = () => {
    const { commandes, statistiques } = data;
    
    if (!commandes.length) {
      return {
        totalSales: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        growthRate: 0,
        newCustomers: 0
      };
    }

    // Calculer le chiffre d'affaires total (commandes payées uniquement)
    const totalSales = commandes
      .filter(c => ['payee', 'livree'].includes(c.statut))
      .reduce((sum, c) => sum + parseFloat(c.montant_total), 0);

    const totalOrders = commandes.length;
    const avgOrderValue = totalSales / (totalOrders || 1);

    // Calculer le taux de croissance (comparaison avec la période précédente)
    const evolutionData = data.evolutionData;
    let growthRate = 0;
    if (evolutionData.length >= 2) {
      const currentPeriod = evolutionData.slice(-7); // 7 derniers jours
      const previousPeriod = evolutionData.slice(-14, -7); // 7 jours précédents
      
      const currentSum = currentPeriod.reduce((sum, d) => sum + d.chiffre_affaires, 0);
      const previousSum = previousPeriod.reduce((sum, d) => sum + d.chiffre_affaires, 0);
      
      if (previousSum > 0) {
        growthRate = ((currentSum - previousSum) / previousSum) * 100;
      }
    }

    // Compter les nouveaux clients
    const newCustomers = data.clientsUniques.length;

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      growthRate,
      newCustomers
    };
  };

  const exporterPDF = async () => {
    try {
      const boutiqueId = getBoutiqueId();
      const filtres = getFiltersForPeriod(selectedPeriod);
      
      await BoutiqueCommandeService.exporterCommandesCSV(boutiqueId, filtres);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      alert('Erreur lors de l\'export des données');
    }
  };

  const transformDataForChart = () => {
    return data.evolutionData.map(item => ({
      month: item.date_formatee,
      sales: item.chiffre_affaires,
      orders: item.commandes,
      customers: Math.floor(item.commandes * 0.7) // Estimation
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6A00] mx-auto mb-4" />
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={chargerDonneesRapports}
            className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#E55A00]"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const kpis = calculerKPIs();
  const chartData = transformDataForChart();

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
          <button
            onClick={exporterPDF}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download size={16} />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {BoutiqueCommandeService.formaterMontant(kpis.totalSales)}
              </p>
              <div className="flex items-center mt-1">
                {kpis.growthRate > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${kpis.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(kpis.growthRate).toFixed(1)}% ce mois
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
              <p className="text-2xl font-bold text-gray-900">{kpis.totalOrders}</p>
              <p className="text-sm text-green-600 mt-1">
                {data.commandes.filter(c => c.statut === 'payee').length} payées
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {BoutiqueCommandeService.formaterMontant(kpis.avgOrderValue)}
              </p>
              <p className="text-sm text-blue-600 mt-1">Moyenne</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.newCustomers}</p>
              <p className="text-sm text-green-600 mt-1">Clients uniques</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
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
              <option value="customers">Clients actifs</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  reportType === 'sales' ? BoutiqueCommandeService.formaterMontant(value) : value,
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
            {data.produitsPopulaires.length > 0 ? (
              data.produitsPopulaires.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.nom}</p>
                    <p className="text-sm text-gray-500">{product.quantite_vendue} vendus</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#FF6A00]">
                      {BoutiqueCommandeService.formaterMontant(product.chiffre_affaires)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                Aucun produit vendu pour cette période
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison Mensuelle</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'sales' ? BoutiqueCommandeService.formaterMontant(value) : value,
                name === 'sales' ? 'Ventes' : 'Commandes'
              ]}
            />
            <Bar yAxisId="left" dataKey="sales" fill="#FF6A00" name="sales" />
            <Bar yAxisId="right" dataKey="orders" fill="#1C1C1C" name="orders" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section Clients */}
      {data.clientsUniques.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commandes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière Commande
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.clientsUniques.slice(0, 5).map((client, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.prenom} {client.nom}
                        </div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.total_commandes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {BoutiqueCommandeService.formaterMontant(client.montant_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {BoutiqueCommandeService.formaterDate(client.derniere_commande)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};