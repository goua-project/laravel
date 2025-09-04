import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { subscriptionsAPI, SubscriptionPlan, UserSubscription } from '../services/api';
import { Search, Plus, Edit, Trash2, Crown, Users, Calendar, DollarSign, Package, Star } from 'lucide-react';

export const Subscriptions: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_months: '1',
    max_products: '',
    features: '',
    is_popular: false,
    status: 'active' as const
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'plans') {
        const plansData = await subscriptionsAPI.getPlans();
        setPlans(plansData);
      } else {
        const subscriptionsData = await subscriptionsAPI.getUserSubscriptions();
        setSubscriptions(subscriptionsData);
      }
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  // Colonnes pour les plans d'abonnement
  const planColumns = [
    {
      key: 'name',
      title: 'Plan',
      render: (value: string, record: SubscriptionPlan) => (
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium ${
            record.is_popular ? 'bg-[#FF6A00]' : 'bg-gray-600'
          }`}>
            {record.is_popular ? <Crown size={20} /> : <Package size={20} />}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <p className="font-medium">{value}</p>
              {record.is_popular && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
                  <Star size={10} className="mr-1" />
                  Populaire
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{record.description}</p>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      title: 'Prix',
      render: (value: number, record: SubscriptionPlan) => (
        <div>
          <p className="font-medium text-[#FF6A00]">₣ {value.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">/{record.duration_months} mois</p>
        </div>
      )
    },
    {
      key: 'max_products',
      title: 'Limite Produits',
      render: (value: number) => (
        <span className="font-medium">{value} produits</span>
      )
    },
    {
      key: 'features',
      title: 'Fonctionnalités',
      render: (value: string[]) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600">
            {Array.isArray(value) ? value.slice(0, 2).join(', ') : value}
            {Array.isArray(value) && value.length > 2 && '...'}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value === 'active' ? 'Actif' : 'Inactif'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: SubscriptionPlan) => (
        <div className="flex space-x-2">
          <button
            className="p-1 text-gray-600 hover:text-[#FF6A00]"
            onClick={() => editPlan(record)}
            title="Modifier"
          >
            <Edit size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-red-600"
            onClick={() => deletePlan(record.id)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  // Colonnes pour les abonnements utilisateurs
  const subscriptionColumns = [
    {
      key: 'user_name',
      title: 'Utilisateur',
      render: (value: string, record: UserSubscription) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-medium text-sm">
            {value.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="font-medium">{value}</p>
            <p className="text-gray-500 text-sm">{record.shop_name}</p>
          </div>
        </div>
      )
    },
    {
      key: 'plan_name',
      title: 'Plan',
      render: (value: string, record: UserSubscription) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-gray-500 text-sm">₣ {record.amount_paid.toLocaleString()}</p>
        </div>
      )
    },
    {
      key: 'products_used',
      title: 'Utilisation',
      render: (value: number, record: UserSubscription) => (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{value}/{record.max_products}</span>
            <span className="text-sm text-gray-500">
              {Math.round((value / record.max_products) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#FF6A00] h-2 rounded-full" 
              style={{ width: `${Math.min((value / record.max_products) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      key: 'end_date',
      title: 'Expiration',
      render: (value: string, record: UserSubscription) => {
        const endDate = new Date(value);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div>
            <p className="text-sm font-medium">{endDate.toLocaleDateString('fr-FR')}</p>
            <p className={`text-xs ${daysLeft < 7 ? 'text-red-600' : 'text-gray-500'}`}>
              {daysLeft > 0 ? `${daysLeft} jours restants` : 'Expiré'}
            </p>
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string, record: UserSubscription) => {
        const statusConfig = {
          active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Actif' },
          expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expiré' },
          cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Annulé' },
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        
        return (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            {record.auto_renewal && (
              <span className="text-xs text-blue-600" title="Renouvellement automatique">
                🔄
              </span>
            )}
          </div>
        );
      }
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        max_products: parseInt(formData.max_products),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      };

      if (selectedPlan) {
        await subscriptionsAPI.updatePlan(selectedPlan.id, planData);
        showToast('success', 'Plan modifié', 'Le plan d\'abonnement a été mis à jour');
      } else {
        await subscriptionsAPI.createPlan(planData);
        showToast('success', 'Plan créé', 'Le nouveau plan d\'abonnement a été créé');
      }
      
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de sauvegarder le plan');
    }
  };

  const editPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      duration_months: plan.duration_months.toString(),
      max_products: plan.max_products.toString(),
      features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features,
      is_popular: plan.is_popular,
      status: plan.status
    });
    setIsModalOpen(true);
  };

  const deletePlan = async (planId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      return;
    }

    try {
      await subscriptionsAPI.deletePlan(planId);
      setPlans(plans.filter(plan => plan.id !== planId));
      showToast('success', 'Plan supprimé', 'Le plan d\'abonnement a été supprimé');
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de supprimer le plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_months: '1',
      max_products: '',
      features: '',
      is_popular: false,
      status: 'active'
    });
    setSelectedPlan(null);
  };

  const filteredData = activeTab === 'plans' 
    ? plans.filter(plan => plan.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : subscriptions.filter(sub => 
        sub.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const getStats = () => {
    if (activeTab === 'plans') {
      return {
        total: plans.length,
        active: plans.filter(p => p.status === 'active').length,
        popular: plans.filter(p => p.is_popular).length,
        avgPrice: plans.length > 0 ? plans.reduce((sum, p) => sum + p.price, 0) / plans.length : 0
      };
    } else {
      return {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        expired: subscriptions.filter(s => s.status === 'expired').length,
        revenue: subscriptions.reduce((sum, s) => sum + s.amount_paid, 0)
      };
    }
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Abonnements</h1>
        {activeTab === 'plans' && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nouveau plan</span>
          </Button>
        )}
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-[#FF6A00] text-[#FF6A00]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package size={18} />
              <span>Plans d'Abonnement</span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscriptions'
                  ? 'border-[#FF6A00] text-[#FF6A00]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users size={18} />
              <span>Abonnements Utilisateurs</span>
            </button>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeTab === 'plans' ? (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Plans</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Crown className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Plans Actifs</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Plans Populaires</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.popular}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-[#FF6A00]" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Prix Moyen</p>
                      <p className="text-2xl font-bold text-gray-900">₣ {stats.avgPrice.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Abonnements</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Actifs</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Expirés</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-[#FF6A00]" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Revenus</p>
                      <p className="text-2xl font-bold text-gray-900">₣ {stats.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recherche et tableau */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder={`Rechercher ${activeTab === 'plans' ? 'un plan' : 'un abonnement'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table 
            columns={activeTab === 'plans' ? planColumns : subscriptionColumns} 
            data={filteredData} 
            loading={loading} 
          />
        </div>
      </div>

      {/* Modal pour créer/modifier un plan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedPlan ? 'Modifier le plan' : 'Nouveau plan d\'abonnement'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom du plan"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="ex: Plan Premium"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              rows={3}
              placeholder="Description du plan..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prix (₣)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="50000"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (mois)
              </label>
              <select
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                required
              >
                <option value="1">1 mois</option>
                <option value="3">3 mois</option>
                <option value="6">6 mois</option>
                <option value="12">12 mois</option>
              </select>
            </div>
          </div>

          <Input
            label="Limite de produits"
            type="number"
            value={formData.max_products}
            onChange={(e) => setFormData({ ...formData, max_products: e.target.value })}
            placeholder="100"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fonctionnalités (séparées par des virgules)
            </label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              rows={2}
              placeholder="Support prioritaire, Analytics avancés, API access"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_popular}
                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00]"
              />
              <span className="ml-2 text-sm text-gray-700">Plan populaire</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedPlan ? 'Modifier' : 'Créer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};