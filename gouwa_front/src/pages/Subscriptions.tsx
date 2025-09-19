import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import AdminSubscriptionService from '../services/AdminSubscriptionService';
import { Search, Plus, Edit, Trash2, Crown, Users, Calendar, DollarSign, Package, Star, AlertCircle, XCircle, CheckCircle, RefreshCw } from 'lucide-react';

// Interface pour les types de données
interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration_months?: number;
  max_products: number;
  features: string[];
  commission: number;
  is_active: boolean;
  is_free: boolean;
  is_popular?: boolean;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  user_name: string;
  shop_name: string;
  plan_id: string;
  plan_name: string;
  amount_paid: number;
  products_used: number;
  max_products: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  auto_renewal: boolean;
  reference_paiement?: string;
}

export const Subscriptions: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    duree_mois: '1',
    limite_produits: '',
    features: '',
    commission: '0',
    is_popular: false,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'plans') {
        await loadPlans();
      } else {
        await loadSubscriptions();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(`Impossible de charger les données: ${errorMessage}`);
      showToast('error', 'Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      console.log('🔄 Chargement des plans d\'abonnement...');
      
      const response = await AdminSubscriptionService.getAllPlans();
      console.log('📊 Réponse des plans:', response);
      
      if (response.success && response.data) {
        // Transformation des données du backend vers le format du composant
        const transformedPlans = response.data.map((plan: any) => ({
          id: plan.id,
          name: plan.name || plan.nom,
          slug: plan.slug || '',
          description: plan.description,
          price: plan.price || plan.prix,
          duration_months: plan.duration_months || plan.duree_mois || 1,
          max_products: plan.max_products || plan.limite_produits,
          features: Array.isArray(plan.features) ? plan.features : 
                   typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : [],
          commission: plan.commission || 0,
          is_active: plan.is_active,
          is_free: plan.is_free || false,
          is_popular: plan.is_popular || false,
          status: plan.is_active ? 'active' : 'inactive'
        }));
        
        console.log('✅ Plans transformés:', transformedPlans);
        setPlans(transformedPlans);
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des plans:', error);
      throw error;
    }
  };

  const loadSubscriptions = async () => {
    try {
      console.log('🔄 Chargement des abonnements utilisateurs...');
      
      const response = await AdminSubscriptionService.getAllUserSubscriptions();
      console.log('📊 Réponse des abonnements:', response);
      
      if (response.success && response.data) {
        const transformedSubscriptions = response.data.map((sub: any) => ({
          id: sub.id,
          user_id: sub.user_id,
          user_name: sub.user_name || sub.user?.name || 'Utilisateur inconnu',
          shop_name: sub.shop_name || sub.shop?.name || 'Boutique inconnue',
          plan_id: sub.plan_id,
          plan_name: sub.plan_name || sub.plan?.name || 'Plan inconnu',
          amount_paid: sub.amount_paid || sub.price || 0,
          products_used: sub.products_used || 0,
          max_products: sub.max_products || sub.plan?.max_products || 0,
          start_date: sub.start_date || sub.created_at,
          end_date: sub.end_date || sub.expires_at,
          status: sub.status,
          auto_renewal: sub.auto_renewal || false,
          reference_paiement: sub.reference_paiement || sub.payment_reference || ''
        }));
        
        console.log('✅ Abonnements transformés:', transformedSubscriptions);
        setSubscriptions(transformedSubscriptions);
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des abonnements:', error);
      throw error;
    }
  };

  // Colonnes pour les plans d'abonnement
  const planColumns = [
    {
      key: 'name',
      title: 'Plan',
      render: (value: string, record: any) => (
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
      render: (value: number, record: any) => (
        <div>
          <p className="font-medium text-[#FF6A00]">₣ {value.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">/{record.duration_months || 1} mois</p>
        </div>
      )
    },
    {
      key: 'max_products',
      title: 'Limite Produits',
      render: (value: number) => (
        <span className="font-medium">
          {value === -1 || value === null ? 'Illimité' : `${value} produits`}
        </span>
      )
    },
    {
      key: 'features',
      title: 'Fonctionnalités',
      render: (value: string[]) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600">
            {Array.isArray(value) ? value.slice(0, 2).join(', ') : 'Aucune fonctionnalité'}
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
      render: (_: any, record: any) => (
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
      render: (value: number, record: UserSubscription) => {
        const maxProducts = record.max_products;
        const percentage = maxProducts > 0 ? Math.round((value / maxProducts) * 100) : 0;
        
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {value}/{maxProducts === -1 ? '∞' : maxProducts}
              </span>
              <span className="text-sm text-gray-500">
                {maxProducts === -1 ? '∞' : `${percentage}%`}
              </span>
            </div>
            {maxProducts > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#FF6A00] h-2 rounded-full" 
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        );
      }
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
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
        
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
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: UserSubscription) => (
        <div className="flex space-x-2">
          <button
            className="p-1 text-gray-600 hover:text-green-600"
            onClick={() => reactivateSubscription(record.id)}
            title="Réactiver"
            disabled={record.status === 'active'}
          >
            <CheckCircle size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-red-600"
            onClick={() => cancelSubscription(record.id)}
            title="Annuler"
            disabled={record.status === 'cancelled'}
          >
            <XCircle size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-blue-600"
            onClick={() => extendSubscription(record.id)}
            title="Prolonger"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planData = {
        name: formData.nom,
        description: formData.description,
        price: parseFloat(formData.prix),
        duration_months: parseInt(formData.duree_mois),
        max_products: parseInt(formData.limite_produits),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f),
        commission: parseFloat(formData.commission),
        is_active: formData.is_active,
        is_popular: formData.is_popular
      };

      if (selectedPlan) {
        // Mise à jour du plan
        const response = await AdminSubscriptionService.updatePlan(selectedPlan.id, planData);
        if (response.success) {
          showToast('success', 'Succès', 'Plan mis à jour avec succès');
        }
      } else {
        // Création du plan
        const response = await AdminSubscriptionService.createPlan(planData);
        if (response.success) {
          showToast('success', 'Succès', 'Plan créé avec succès');
        }
      }
      
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showToast('error', 'Erreur', 'Impossible de sauvegarder le plan');
    }
  };

  const editPlan = (plan: any) => {
    setSelectedPlan(plan);
    setFormData({
      nom: plan.name || '',
      description: plan.description || '',
      prix: plan.price?.toString() || '',
      duree_mois: plan.duration_months?.toString() || '1',
      limite_produits: plan.max_products?.toString() || '',
      features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
      commission: plan.commission?.toString() || '0',
      is_popular: plan.is_popular || false,
      is_active: plan.status === 'active'
    });
    setIsModalOpen(true);
  };

  const deletePlan = async (planId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      return;
    }

    try {
      const response = await AdminSubscriptionService.deletePlan(planId);
      if (response.success) {
        showToast('success', 'Succès', 'Plan supprimé avec succès');
        setPlans(plans.filter(plan => plan.id !== planId));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showToast('error', 'Erreur', 'Impossible de supprimer le plan');
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) {
      return;
    }

    try {
      const response = await AdminSubscriptionService.cancelSubscription(subscriptionId, 'Annulation administrative');
      if (response.success) {
        showToast('success', 'Succès', 'Abonnement annulé avec succès');
        loadSubscriptions();
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      showToast('error', 'Erreur', 'Impossible d\'annuler l\'abonnement');
    }
  };

  const reactivateSubscription = async (subscriptionId: string) => {
    try {
      const response = await AdminSubscriptionService.reactivateSubscription(subscriptionId);
      if (response.success) {
        showToast('success', 'Succès', 'Abonnement réactivé avec succès');
        loadSubscriptions();
      }
    } catch (error) {
      console.error('Erreur lors de la réactivation:', error);
      showToast('error', 'Erreur', 'Impossible de réactiver l\'abonnement');
    }
  };

  const extendSubscription = async (subscriptionId: string) => {
    const days = prompt('Nombre de jours à ajouter :');
    if (!days || isNaN(parseInt(days))) return;

    try {
      const response = await AdminSubscriptionService.extendSubscription(subscriptionId, {
        days: parseInt(days)
      });
      if (response.success) {
        showToast('success', 'Succès', 'Abonnement prolongé avec succès');
        loadSubscriptions();
      }
    } catch (error) {
      console.error('Erreur lors de la prolongation:', error);
      showToast('error', 'Erreur', 'Impossible de prolonger l\'abonnement');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix: '',
      duree_mois: '1',
      limite_produits: '',
      features: '',
      commission: '0',
      is_popular: false,
      is_active: true
    });
    setSelectedPlan(null);
  };

  const filteredData = activeTab === 'plans' 
    ? plans.filter(plan => plan.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : subscriptions.filter(sub => 
        sub.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const getStats = () => {
    if (activeTab === 'plans') {
      const activePlans = plans.filter(p => p.status === 'active');
      const popularPlans = plans.filter(p => p.is_popular);
      const avgPrice = plans.length > 0 ? plans.reduce((sum, p) => sum + (p.price || 0), 0) / plans.length : 0;

      return {
        total: plans.length,
        active: activePlans.length,
        popular: popularPlans.length,
        avgPrice: Math.round(avgPrice)
      };
    } else {
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
      const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired');
      const revenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

      return {
        total: subscriptions.length,
        active: activeSubscriptions.length,
        expired: expiredSubscriptions.length,
        revenue: revenue
      };
    }
  };

  const stats = getStats();

  // Affichage d'erreur si nécessaire
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Abonnements</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Erreur de chargement</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <Button 
                onClick={() => {
                  setError(null);
                  loadData();
                }}
                className="mt-3"
                size="sm"
              >
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
              value={formData.prix}
              onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
              placeholder="50000"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (mois)
              </label>
              <select
                value={formData.duree_mois}
                onChange={(e) => setFormData({ ...formData, duree_mois: e.target.value })}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Limite de produits (-1 pour illimité)"
              type="number"
              value={formData.limite_produits}
              onChange={(e) => setFormData({ ...formData, limite_produits: e.target.value })}
              placeholder="-1"
              required
            />
            
            <Input
              label="Commission (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.commission}
              onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
              placeholder="0"
            />
          </div>

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
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
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