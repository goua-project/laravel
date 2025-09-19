import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input'; 
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import SubscriptionService from '../services/SubscriptionService';
import BoutiqueCommandeService from '../services/BoutiqueCommandeService';
import { Search, Filter, RefreshCw, DollarSign, TrendingUp, CreditCard, AlertCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export const Transactions = () => {
  const [commandes, setCommandes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Récupérer l'ID de la boutique depuis le contexte ou les paramètres
  const boutiqueId = 1; // À remplacer par la vraie logique de récupération

  useEffect(() => {
    loadTransactions();
    loadSummary();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Charger les commandes de la boutique
      const commandesResult = await BoutiqueCommandeService.listerCommandesBoutique(boutiqueId);
      if (commandesResult.success) {
        setCommandes(commandesResult.data || []);
      } else {
        showToast('error', 'Erreur', commandesResult.message);
      }

      // Charger l'historique des abonnements
      try {
        const subscriptionsData = await SubscriptionService.getSubscriptionHistory();
        setSubscriptions(subscriptionsData || []);
      } catch (error) {
        console.error('Erreur chargement abonnements:', error);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      showToast('error', 'Erreur', 'Impossible de charger les transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      // Charger les statistiques de la boutique
      const statsResult = await BoutiqueCommandeService.obtenirStatistiquesBoutique(boutiqueId);
      if (statsResult.success) {
        const stats = statsResult.data;
        
        // Calculer les données de résumé à partir des statistiques
        const commandesPayees = commandes.filter(c => ['payee', 'livree'].includes(c.statut));
        const aujourdhui = new Date().toISOString().split('T')[0];
        const commandesAujourdhui = commandesPayees.filter(c => 
          new Date(c.created_at).toISOString().split('T')[0] === aujourdhui
        );

        // Générer l'évolution des transactions
        const evolution = BoutiqueCommandeService.calculerEvolutionCommandes(commandes, 7);
        
        // Analyser les méthodes de paiement
        const methodesMap = new Map();
        commandes.forEach(commande => {
          const methode = commande.methode_paiement || 'kaliapay';
          methodesMap.set(methode, (methodesMap.get(methode) || 0) + 1);
        });

        const totalCommandes = commandes.length;
        const topPaymentMethods = Array.from(methodesMap.entries()).map(([method, count]) => ({
          method,
          count,
          percentage: totalCommandes > 0 ? ((count / totalCommandes) * 100).toFixed(1) : 0
        }));

        const summaryData = {
          total_transactions: stats.total_commandes || totalCommandes,
          total_revenue: stats.chiffre_affaires || commandesPayees.reduce((sum, c) => sum + parseFloat(c.montant_total || 0), 0),
          total_commission: stats.commissions_totales || (stats.chiffre_affaires * 0.05), // 5% de commission par défaut
          pending_amount: commandes
            .filter(c => c.statut === 'en_attente')
            .reduce((sum, c) => sum + parseFloat(c.montant_total || 0), 0),
          completed_today: commandesAujourdhui.length,
          monthly_growth: stats.croissance_mensuelle || 12.5,
          transaction_trends: evolution.map(item => ({
            date: item.date_formatee,
            amount: item.chiffre_affaires,
            count: item.commandes
          })),
          top_payment_methods: topPaymentMethods
        };

        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du résumé:', error);
      showToast('error', 'Erreur', 'Impossible de charger le résumé');
    }
  };

  const updateTransactionStatus = async (commandeId, statut) => {
    try {
      const result = await BoutiqueCommandeService.mettreAJourStatutCommande(boutiqueId, commandeId, statut);
      
      if (result.success) {
        setCommandes(commandes.map(commande => 
          commande.id === commandeId 
            ? { ...commande, statut: statut }
            : commande
        ));
        
        const statusLabels = {
          'livree': 'livrée',
          'annulee': 'annulée',
          'payee': 'payée',
          'en_cours': 'en cours'
        };
        
        showToast('success', 'Statut mis à jour', 
          `La commande a été marquée comme ${statusLabels[statut]}`);
      } else {
        showToast('error', 'Erreur', result.message);
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      showToast('error', 'Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const refundTransaction = async (commandeId) => {
    const reason = window.prompt('Raison du remboursement:');
    if (!reason) return;

    try {
      // Marquer la commande comme annulée (équivalent du remboursement)
      const result = await BoutiqueCommandeService.mettreAJourStatutCommande(boutiqueId, commandeId, 'annulee');
      
      if (result.success) {
        setCommandes(commandes.map(commande => 
          commande.id === commandeId 
            ? { ...commande, statut: 'annulee' }
            : commande
        ));
        showToast('success', 'Remboursement effectué', 'La commande a été annulée');
      } else {
        showToast('error', 'Erreur', result.message);
      }
    } catch (error) {
      console.error('Erreur remboursement:', error);
      showToast('error', 'Erreur', 'Impossible d\'effectuer le remboursement');
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'kaliapay':
      case 'en_ligne':
        return <CreditCard size={16} className="text-blue-600" />;
      case 'a_la_livraison':
        return <span className="text-green-600 font-bold text-sm">💰</span>;
      case 'virement':
        return <span className="text-purple-600 font-bold text-sm">🏦</span>;
      case 'especes':
        return <span className="text-gray-600 font-bold text-sm">💵</span>;
      case 'cheque':
        return <span className="text-orange-600 font-bold text-sm">📋</span>;
      default:
        return <CreditCard size={16} className="text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    return BoutiqueCommandeService.getLibelleMethodePaiement(method);
  };

  const getStatusConfig = (status) => {
    const configs = {
      'en_attente': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente', icon: AlertCircle },
      'payee': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Payée', icon: CheckCircle },
      'en_cours': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En cours', icon: AlertCircle },
      'livree': { bg: 'bg-green-100', text: 'text-green-800', label: 'Livrée', icon: CheckCircle },
      'annulee': { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée', icon: XCircle }
    };
    return configs[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: AlertCircle };
  };

  const columns = [
    {
      key: 'reference',
      title: 'Référence',
      render: (value, record) => (
        <div>
          <p className="font-medium font-mono text-sm">{value}</p>
          <p className="text-gray-500 text-xs">ID: {record.id}</p>
        </div>
      )
    },
    {
      key: 'produits',
      title: 'Produits',
      render: (value, record) => (
        <div>
          <p className="font-medium">
            {value && value.length > 0 ? 
              value.map(p => p.nom).join(', ') : 
              'Produits variés'
            }
          </p>
          <p className="text-gray-500 text-sm">Boutique #{record.boutique_id || boutiqueId}</p>
        </div>
      )
    },
    {
      key: 'user',
      title: 'Client',
      render: (value, record) => (
        <div>
          <p className="font-medium">
            {value ? `${value.prenom || ''} ${value.nom || ''}`.trim() : 'Client inconnu'}
          </p>
          <p className="text-gray-500 text-sm">{value?.email || 'Email non disponible'}</p>
        </div>
      )
    },
    {
      key: 'montant_total',
      title: 'Montant',
      render: (value, record) => {
        const montant = parseFloat(value || 0);
        const commission = montant * 0.05; // 5% de commission
        const net = montant - commission;
        
        return (
          <div>
            <p className="font-medium">{BoutiqueCommandeService.formaterMontant(montant)}</p>
            <p className="text-gray-500 text-sm">
              Commission: {BoutiqueCommandeService.formaterMontant(commission)}
            </p>
            <p className="text-green-600 text-sm font-medium">
              Net: {BoutiqueCommandeService.formaterMontant(net)}
            </p>
          </div>
        );
      }
    },
    {
      key: 'methode_paiement',
      title: 'Paiement',
      render: (value) => (
        <div className="flex items-center space-x-2">
          {getPaymentMethodIcon(value)}
          <span className="text-sm">{getPaymentMethodLabel(value)}</span>
        </div>
      )
    },
    {
      key: 'statut',
      title: 'Statut',
      render: (value, record) => {
        const config = getStatusConfig(value);
        const IconComponent = config.icon;
        
        return (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center`}>
              <IconComponent size={12} className="mr-1" />
              {config.label}
            </span>
            {value === 'en_attente' && (
              <div className="flex space-x-1">
                <button
                  onClick={() => updateTransactionStatus(record.id, 'payee')}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  title="Marquer comme payée"
                >
                  ✓
                </button>
                <button
                  onClick={() => updateTransactionStatus(record.id, 'annulee')}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  title="Annuler"
                >
                  ✗
                </button>
              </div>
            )}
            {value === 'payee' && (
              <div className="flex space-x-1">
                <button
                  onClick={() => updateTransactionStatus(record.id, 'livree')}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  title="Marquer comme livrée"
                >
                  📦
                </button>
                <button
                  onClick={() => refundTransaction(record.id)}
                  className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                  title="Rembourser"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'created_at',
      title: 'Date',
      render: (value, record) => (
        <div>
          <p className="text-sm font-medium">
            {BoutiqueCommandeService.formaterDate(value).split(' ')[0]}
          </p>
          <p className="text-gray-500 text-xs">
            {BoutiqueCommandeService.formaterDate(value).split(' ').slice(1).join(' ')}
          </p>
          {record.updated_at && record.updated_at !== value && (
            <p className="text-green-600 text-xs">
              Mis à jour: {BoutiqueCommandeService.formaterDate(record.updated_at).split(' ').slice(1).join(' ')}
            </p>
          )}
        </div>
      )
    }
  ];

  const filteredTransactions = BoutiqueCommandeService.filtrerCommandes(commandes, {
    search: searchTerm,
    statut: selectedStatus === 'all' ? null : selectedStatus,
    methode_paiement: selectedPaymentMethod === 'all' ? null : selectedPaymentMethod
  });

  const exportTransactions = async () => {
    try {
      const filters = {
        statut: selectedStatus === 'all' ? null : selectedStatus,
        methode_paiement: selectedPaymentMethod === 'all' ? null : selectedPaymentMethod
      };
      
      const result = await BoutiqueCommandeService.exporterCommandesCSV(boutiqueId, filters);
      if (result.success) {
        showToast('success', 'Export réussi', result.message);
      } else {
        showToast('error', 'Erreur d\'export', result.message);
      }
    } catch (error) {
      console.error('Erreur export:', error);
      showToast('error', 'Erreur', 'Impossible d\'exporter les données');
    }
  };

  const paymentMethodColors = ['#FF6A00', '#1C1C1C', '#10B981', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions Produits</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadTransactions}>
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportTransactions}>
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_transactions.toLocaleString()}</p>
                <p className="text-sm text-blue-600 mt-1">+{summary.completed_today} aujourd'hui</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                <p className="text-2xl font-bold text-gray-900">{BoutiqueCommandeService.formaterMontant(summary.total_revenue)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{summary.monthly_growth.toFixed(1)}% ce mois</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commissions</p>
                <p className="text-2xl font-bold text-gray-900">{BoutiqueCommandeService.formaterMontant(summary.total_commission)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {((summary.total_commission / summary.total_revenue) * 100).toFixed(1)}% du CA
                </p>
              </div>
              <div className="h-12 w-12 bg-[#FF6A00] bg-opacity-10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#FF6A00]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-gray-900">{BoutiqueCommandeService.formaterMontant(summary.pending_amount)}</p>
                <p className="text-sm text-yellow-600 mt-1">À traiter</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graphiques */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Transactions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={summary.transaction_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => [
                  name === 'amount' ? BoutiqueCommandeService.formaterMontant(value) : value,
                  name === 'amount' ? 'Montant' : 'Nombre'
                ]} />
                <Line yAxisId="left" type="monotone" dataKey="amount" stroke="#FF6A00" strokeWidth={2} name="Montant" />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke="#1C1C1C" strokeWidth={2} name="Nombre" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de Paiement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary.top_payment_methods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                >
                  {summary.top_payment_methods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={paymentMethodColors[index % paymentMethodColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {summary.top_payment_methods.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: paymentMethodColors[index % paymentMethodColors.length] }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {getPaymentMethodLabel(item.method)}: {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tableau des transactions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher une transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="payee">Payées</option>
              <option value="en_cours">En cours</option>
              <option value="livree">Livrées</option>
              <option value="annulee">Annulées</option>
            </select>
          </div>

          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          >
            <option value="all">Toutes les méthodes</option>
            <option value="kaliapay">KaliaPay</option>
            <option value="en_ligne">Paiement en ligne</option>
            <option value="a_la_livraison">À la livraison</option>
            <option value="virement">Virement bancaire</option>
            <option value="especes">Espèces</option>
            <option value="cheque">Chèque</option>
          </select>
        </div>

        <Table columns={columns} data={filteredTransactions} loading={loading} />
      </div>
    </div>
  );
};