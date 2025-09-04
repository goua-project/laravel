import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { transactionsAPI, ProductTransaction, TransactionSummary } from '../services/api';
import { Search, Filter, RefreshCw, DollarSign, TrendingUp, CreditCard, AlertCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<ProductTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadTransactions();
    loadSummary();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionsAPI.getTransactions();
      setTransactions(data);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de charger les transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await transactionsAPI.getTransactionSummary();
      setSummary(data);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de charger le résumé');
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: string) => {
    try {
      await transactionsAPI.updateTransactionStatus(transactionId, status);
      setTransactions(transactions.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, status: status as ProductTransaction['status'] }
          : transaction
      ));
      
      const statusLabels = {
        completed: 'complétée',
        failed: 'échouée',
        refunded: 'remboursée'
      };
      
      showToast('success', 'Statut mis à jour', 
        `La transaction a été marquée comme ${statusLabels[status as keyof typeof statusLabels]}`);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const refundTransaction = async (transactionId: string) => {
    const reason = window.prompt('Raison du remboursement:');
    if (!reason) return;

    try {
      await transactionsAPI.refundTransaction(transactionId, reason);
      setTransactions(transactions.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, status: 'refunded' }
          : transaction
      ));
      showToast('success', 'Remboursement effectué', 'La transaction a été remboursée');
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible d\'effectuer le remboursement');
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard size={16} className="text-blue-600" />;
      case 'mobile_money':
        return <span className="text-green-600 font-bold text-sm">MM</span>;
      case 'bank_transfer':
        return <span className="text-purple-600 font-bold text-sm">BT</span>;
      case 'cash':
        return <span className="text-gray-600 font-bold text-sm">💵</span>;
      default:
        return <CreditCard size={16} className="text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      card: 'Carte bancaire',
      mobile_money: 'Mobile Money',
      bank_transfer: 'Virement bancaire',
      cash: 'Espèces'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const columns = [
    {
      key: 'reference_number',
      title: 'Référence',
      render: (value: string, record: ProductTransaction) => (
        <div>
          <p className="font-medium font-mono text-sm">{value}</p>
          <p className="text-gray-500 text-xs">{record.transaction_id}</p>
        </div>
      )
    },
    {
      key: 'product_name',
      title: 'Produit',
      render: (value: string, record: ProductTransaction) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-gray-500 text-sm">{record.shop_name}</p>
        </div>
      )
    },
    {
      key: 'buyer_name',
      title: 'Acheteur',
      render: (value: string, record: ProductTransaction) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-gray-500 text-sm">{record.buyer_email}</p>
        </div>
      )
    },
    {
      key: 'amount',
      title: 'Montant',
      render: (value: number, record: ProductTransaction) => (
        <div>
          <p className="font-medium">₣ {value.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">
            Commission: ₣ {record.commission.toLocaleString()}
          </p>
          <p className="text-green-600 text-sm font-medium">
            Net: ₣ {record.net_amount.toLocaleString()}
          </p>
        </div>
      )
    },
    {
      key: 'payment_method',
      title: 'Paiement',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {getPaymentMethodIcon(value)}
          <span className="text-sm">{getPaymentMethodLabel(value)}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string, record: ProductTransaction) => {
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente', icon: AlertCircle },
          completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Complétée', icon: CheckCircle },
          failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Échouée', icon: XCircle },
          refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Remboursée', icon: RotateCcw }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        const IconComponent = config.icon;
        
        return (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center`}>
              <IconComponent size={12} className="mr-1" />
              {config.label}
            </span>
            {value === 'pending' && (
              <div className="flex space-x-1">
                <button
                  onClick={() => updateTransactionStatus(record.id, 'completed')}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  title="Marquer comme complétée"
                >
                  ✓
                </button>
                <button
                  onClick={() => updateTransactionStatus(record.id, 'failed')}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  title="Marquer comme échouée"
                >
                  ✗
                </button>
              </div>
            )}
            {value === 'completed' && (
              <button
                onClick={() => refundTransaction(record.id)}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                title="Rembourser"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        );
      }
    },
    {
      key: 'created_at',
      title: 'Date',
      render: (value: string, record: ProductTransaction) => (
        <div>
          <p className="text-sm font-medium">{new Date(value).toLocaleDateString('fr-FR')}</p>
          <p className="text-gray-500 text-xs">{new Date(value).toLocaleTimeString('fr-FR')}</p>
          {record.completed_at && (
            <p className="text-green-600 text-xs">
              Complétée: {new Date(record.completed_at).toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
      )
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.shop_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
    const matchesPaymentMethod = selectedPaymentMethod === 'all' || transaction.payment_method === selectedPaymentMethod;
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

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
          <Button variant="outline">
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
                <p className="text-2xl font-bold text-gray-900">₣ {summary.total_revenue.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">₣ {summary.total_commission.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">₣ {summary.pending_amount.toLocaleString()}</p>
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
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="amount" stroke="#FF6A00" strokeWidth={2} name="Montant (₣)" />
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
              <option value="pending">En attente</option>
              <option value="completed">Complétées</option>
              <option value="failed">Échouées</option>
              <option value="refunded">Remboursées</option>
            </select>
          </div>

          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          >
            <option value="all">Toutes les méthodes</option>
            <option value="card">Carte bancaire</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Virement bancaire</option>
            <option value="cash">Espèces</option>
          </select>
        </div>

        <Table columns={columns} data={filteredTransactions} loading={loading} />
      </div>
    </div>
  );
};