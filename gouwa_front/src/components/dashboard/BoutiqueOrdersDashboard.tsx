import React, { useState, useEffect } from 'react';
import { useStore } from '../../contexts/StoreContext';
import CommandeApiService from '../../services/commandeApiService';
import { 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Users,
  Eye,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Loader2,
  RefreshCw,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const BoutiqueOrdersDashboard = () => {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState('commandes');
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    statut: '',
    methode_paiement: '',
    date_debut: '',
    date_fin: '',
    search: ''
  });
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (currentStore?.id) {
      loadData();
    }
  }, [currentStore, filters, currentPage]);

  const loadData = async () => {
    if (!currentStore?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Charger les commandes de la boutique
      const commandesResult = await CommandeApiService.listerCommandesBoutique(
        currentStore.id, 
        { ...filters, page: currentPage }
      );

      if (commandesResult.success) {
        setCommandes(commandesResult.data.data || []);
        const meta = commandesResult.data.meta;
        if (meta) {
          setCurrentPage(meta.current_page);
          setTotalPages(meta.last_page || Math.ceil(meta.total / meta.per_page));
        }
        
        // Extraire les clients uniques
        const clientsMap = new Map();
        commandesResult.data.data.forEach(commande => {
          if (commande.user && !clientsMap.has(commande.user.id)) {
            clientsMap.set(commande.user.id, {
              ...commande.user,
              total_commandes: 1,
              montant_total: commande.montant_total,
              derniere_commande: commande.created_at
            });
          } else if (commande.user) {
            const client = clientsMap.get(commande.user.id);
            client.total_commandes++;
            client.montant_total += commande.montant_total;
            if (new Date(commande.created_at) > new Date(client.derniere_commande)) {
              client.derniere_commande = commande.created_at;
            }
          }
        });
        setClients(Array.from(clientsMap.values()));
      }

      // Charger les statistiques
      const statsResult = await CommandeApiService.obtenirStatistiquesBoutique(currentStore.id);
      if (statsResult.success) {
        setStatistics(statsResult.data);
      }

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant) => {
    return CommandeApiService.formaterMontant(montant);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutColor = (statut) => {
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CommandeApiService.getCouleurStatut(statut)}`;
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'payee':
      case 'livree':
        return <CheckCircle size={16} />;
      case 'en_attente':
        return <Clock size={16} />;
      case 'annulee':
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      statut: '',
      methode_paiement: '',
      date_debut: '',
      date_fin: '',
      search: ''
    });
    setCurrentPage(1);
  };

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune boutique sélectionnée</p>
        </div>
      </div>
    );
  }

  if (loading && commandes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 size={48} className="text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const renderStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Commandes
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {statistics?.total_commandes || commandes.length}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Chiffre d'affaires
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {statistics?.chiffre_affaires ? formatMontant(statistics.chiffre_affaires) : 
                 formatMontant(commandes.filter(c => c.statut === 'payee' || c.statut === 'livree')
                   .reduce((sum, c) => sum + parseFloat(c.montant_total), 0))}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Clients
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {statistics?.clients_uniques || clients.length}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Panier Moyen
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {statistics?.commande_moyenne ? formatMontant(statistics.commande_moyenne) :
                 commandes.length > 0 ? formatMontant(commandes.reduce((sum, c) => sum + parseFloat(c.montant_total), 0) / commandes.length) : formatMontant(0)}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <Filter size={16} className="mr-2" />
          {showFilters ? 'Masquer' : 'Afficher'} les filtres
          <ChevronDown size={16} className={`ml-1 transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Référence, client..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filters.statut}
              onChange={(e) => handleFilterChange('statut', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="payee">Payée</option>
              <option value="en_cours">En cours</option>
              <option value="livree">Livrée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paiement
            </label>
            <select
              value={filters.methode_paiement}
              onChange={(e) => handleFilterChange('methode_paiement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Toutes les méthodes</option>
              <option value="kaliapay">KaliaPay</option>
              <option value="en_ligne">En ligne</option>
              <option value="a_la_livraison">À la livraison</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={filters.date_debut}
              onChange={(e) => handleFilterChange('date_debut', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCommandes = () => (
    <div className="space-y-4">
      {commandes.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune commande trouvée</p>
        </div>
      ) : (
        commandes.map((commande) => (
          <div key={commande.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-medium text-gray-900">#{commande.reference}</h3>
                  <p className="text-sm text-gray-600">
                    {commande.user ? `${commande.user.nom} ${commande.user.prenom}` : 'Client supprimé'}
                  </p>
                </div>
                <span className={getStatutColor(commande.statut)}>
                  {getStatutIcon(commande.statut)}
                  <span className="ml-1">{CommandeApiService.getLibelleStatut(commande.statut)}</span>
                </span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatMontant(commande.montant_total)}</p>
                <p className="text-sm text-gray-600">{formatDate(commande.created_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Produits</h4>
                <div className="space-y-1">
                  {commande.produits?.slice(0, 3).map((produit, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate">{produit.nom}</span>
                      <span className="text-gray-900">{produit.quantite}x {formatMontant(produit.prix)}</span>
                    </div>
                  ))}
                  {commande.produits?.length > 3 && (
                    <p className="text-xs text-gray-500">+{commande.produits.length - 3} autres produits</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Détails</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CreditCard size={14} className="mr-2" />
                    {CommandeApiService.getLibelleMethodePaiement(commande.methode_paiement)}
                  </div>
                  {commande.user?.telephone && (
                    <div className="flex items-center">
                      <Phone size={14} className="mr-2" />
                      {commande.user.telephone}
                    </div>
                  )}
                  {commande.user?.email && (
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2" />
                      {commande.user.email}
                    </div>
                  )}
                  {commande.adresse_livraison && (
                    <div className="flex items-start">
                      <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{commande.adresse_livraison}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                {commande.paiement && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    commande.paiement.statut === 'paye' ? 'bg-green-100 text-green-800' :
                    commande.paiement.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Paiement: {commande.paiement.statut}
                  </span>
                )}
                {commande.notes && (
                  <span className="text-xs text-gray-500 italic">Note: {commande.notes}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedCommande(commande)}
                className="flex items-center text-sm text-orange-600 hover:text-orange-800"
              >
                <Eye size={16} className="mr-1" />
                Voir détails
              </button>
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Page {currentPage} sur {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderClients = () => (
    <div className="space-y-4">
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun client trouvé</p>
        </div>
      ) : (
        clients.map((client) => (
          <div key={client.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{client.nom} {client.prenom}</h3>
                <div className="mt-1 space-y-1">
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail size={14} className="mr-2" />
                      {client.email}
                    </div>
                  )}
                  {client.telephone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={14} className="mr-2" />
                      {client.telephone}
                    </div>
                  )}
                  {client.localite && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={14} className="mr-2" />
                      {client.localite}, {client.pays}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {formatMontant(client.montant_total)}
                </div>
                <div className="text-sm text-gray-600">
                  {client.total_commandes} commande{client.total_commandes > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">
                  Dernière: {formatDate(client.derniere_commande)}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPaiements = () => {
    const paiements = commandes.filter(c => c.paiement).map(c => c.paiement);
    
    return (
      <div className="space-y-4">
        {paiements.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun paiement trouvé</p>
          </div>
        ) : (
          paiements.map((paiement) => {
            const commande = commandes.find(c => c.paiement?.id === paiement.id);
            return (
              <div key={paiement.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">#{paiement.reference}</h3>
                    <p className="text-sm text-gray-600">
                      Commande: #{commande?.reference}
                    </p>
                    <p className="text-sm text-gray-600">
                      Client: {commande?.user ? `${commande.user.nom} ${commande.user.prenom}` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatMontant(paiement.montant)}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      paiement.statut === 'paye' ? 'bg-green-100 text-green-800' :
                      paiement.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {paiement.statut}
                    </span>
                    <div className="text-sm text-gray-600 mt-1">
                      {CommandeApiService.getLibelleMethodePaiement(paiement.methode)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
              <p className="text-gray-600 mt-1">
                Boutique: {currentStore.name}
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Statistics */}
        {renderStatistics()}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircle size={16} className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'paiements', label: 'Paiements', icon: CreditCard },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-3 py-2 font-medium text-sm rounded-md transition-colors ${
                  activeTab === id
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} className="mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        {activeTab === 'commandes' && renderFilters()}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'commandes' && renderCommandes()}
          {activeTab === 'clients' && renderClients()}
          {activeTab === 'paiements' && renderPaiements()}
        </div>

        {/* Modal pour détails de commande */}
        {selectedCommande && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Détails de la commande #{selectedCommande.reference}
                  </h2>
                  <button
                    onClick={() => setSelectedCommande(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Informations Client</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nom:</strong> {selectedCommande.user?.nom} {selectedCommande.user?.prenom}</p>
                      <p><strong>Email:</strong> {selectedCommande.user?.email}</p>
                      <p><strong>Téléphone:</strong> {selectedCommande.user?.telephone}</p>
                      <p><strong>Localité:</strong> {selectedCommande.user?.localite}, {selectedCommande.user?.pays}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Informations Commande</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Statut:</strong> 
                        <span className={getStatutColor(selectedCommande.statut) + ' ml-2'}>
                          {CommandeApiService.getLibelleStatut(selectedCommande.statut)}
                        </span>
                      </p>
                      <p><strong>Paiement:</strong> {CommandeApiService.getLibelleMethodePaiement(selectedCommande.methode_paiement)}</p>
                      <p><strong>Date:</strong> {formatDate(selectedCommande.created_at)}</p>
                      <p><strong>Montant:</strong> {formatMontant(selectedCommande.montant_total)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Produits commandés</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prix unitaire
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantité
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sous-total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedCommande.produits?.map((produit, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {produit.nom}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatMontant(produit.prix)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {produit.quantite}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatMontant(produit.prix * produit.quantite)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <div className="text-lg font-semibold text-gray-900">
                      Total: {formatMontant(selectedCommande.montant_total)}
                    </div>
                  </div>
                </div>

                {selectedCommande.adresse_livraison && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Adresse de livraison</h3>
                    <p className="text-sm text-gray-600">{selectedCommande.adresse_livraison}</p>
                  </div>
                )}

                {selectedCommande.notes && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
                    <p className="text-sm text-gray-600">{selectedCommande.notes}</p>
                  </div>
                )}

                {selectedCommande.paiement && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Informations de paiement</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Référence:</strong> {selectedCommande.paiement.reference}</p>
                          <p><strong>Méthode:</strong> {CommandeApiService.getLibelleMethodePaiement(selectedCommande.paiement.methode)}</p>
                        </div>
                        <div>
                          <p><strong>Statut:</strong> 
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              selectedCommande.paiement.statut === 'paye' ? 'bg-green-100 text-green-800' :
                              selectedCommande.paiement.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {selectedCommande.paiement.statut}
                            </span>
                          </p>
                          <p><strong>Montant:</strong> {formatMontant(selectedCommande.paiement.montant)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoutiqueOrdersDashboard;