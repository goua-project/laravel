// components/orders/OrderHistory.js
// components/orders/OrderHistory.js
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Download, 
  RotateCcw,
  ExternalLink,
  Calendar,
  CreditCard,
  Smartphone,
  Truck,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
// CORRECTION : Import du bon nom de fichier
import CommandeApiService from '../services/commandeApiService';

const OrderHistory = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtres
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Charger les commandes avec gestion d'erreur améliorée
  const loadOrders = async (page = 1, showLoader = true) => {
    if (!isAuthenticated) return;
    
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      console.log('Chargement des commandes, page:', page);
      const response = await CommandeApiService.listerCommandes(page);
      console.log('Réponse API:', response);
      
      if (response.success) {
        // CORRECTION : Structure de données Laravel avec pagination
        const commandesData = response.data;
        
        if (commandesData && typeof commandesData === 'object') {
          // Si c'est un objet de pagination Laravel
          if (commandesData.data && Array.isArray(commandesData.data)) {
            setOrders(commandesData.data);
            setCurrentPage(commandesData.current_page || 1);
            setTotalPages(commandesData.last_page || 1);
          }
          // Si c'est directement un tableau
          else if (Array.isArray(commandesData)) {
            setOrders(commandesData);
            setCurrentPage(1);
            setTotalPages(1);
          }
          // Si c'est un objet avec une propriété commandes
          else if (commandesData.commandes) {
            const commandes = commandesData.commandes;
            if (Array.isArray(commandes)) {
              setOrders(commandes);
            } else if (commandes.data) {
              setOrders(commandes.data);
              setCurrentPage(commandes.current_page || 1);
              setTotalPages(commandes.last_page || 1);
            }
          } else {
            console.warn('Structure de données inattendue:', commandesData);
            setOrders([]);
          }
        } else if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      } else {
        setError(response.message || 'Erreur lors du chargement des commandes');
        console.error('Erreur API:', response);
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
      console.error('Erreur chargement commandes:', err);
      
      // Afficher plus de détails sur l'erreur en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('Détails de l\'erreur:', {
          message: err.message,
          stack: err.stack,
          response: err.response
        });
      }
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  // Actualiser les commandes
  const refreshOrders = async () => {
    setRefreshing(true);
    await loadOrders(currentPage, false);
  };

  // Charger les détails d'une commande avec meilleure gestion d'erreur
  const loadOrderDetails = async (orderId) => {
    try {
      console.log('Chargement détails commande:', orderId);
      const response = await CommandeApiService.afficherCommande(orderId);
      console.log('Détails commande response:', response);
      
      if (response.success) {
        // CORRECTION : Gérer différentes structures de réponse
        let orderData = response.data;
        
        // Si les données sont dans une sous-propriété
        if (orderData.commande) {
          orderData = orderData.commande;
        }
        
        setSelectedOrder(orderData);
        setShowOrderDetails(true);
      } else {
        setError('Erreur lors du chargement des détails: ' + (response.message || 'Erreur inconnue'));
      }
    } catch (err) {
      setError('Erreur lors du chargement des détails');
      console.error('Erreur détails commande:', err);
    }
  };

  // Annuler une commande avec meilleure validation
  const cancelOrder = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }
    
    try {
      console.log('Annulation commande:', orderId);
      const response = await CommandeApiService.annulerCommande(orderId);
      console.log('Réponse annulation:', response);
      
      if (response.success) {
        await refreshOrders();
        setError(null);
        
        // Mettre à jour la commande sélectionnée si elle est ouverte
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, statut: 'annulee' });
        }
        
        // Optionnel : Afficher un message de succès
        console.log('Commande annulée avec succès');
      } else {
        setError(response.message || 'Erreur lors de l\'annulation');
      }
    } catch (err) {
      setError('Erreur lors de l\'annulation');
      console.error('Erreur annulation:', err);
    }
  };

  // Relancer un paiement avec validation du statut
  const retryPayment = async (orderId) => {
    try {
      console.log('Relance paiement pour commande:', orderId);
      
      // Utiliser webpay par défaut pour la relance
      const response = await CommandeApiService.relancerPaiementKalia(orderId, {
        type_paiement_kalia: 'webpay',
        custom_data: `relance_${orderId}_${Date.now()}`
      });
      
      console.log('Réponse relance paiement:', response);
      
      if (response.success) {
        // CORRECTION : Gérer différentes structures de données de paiement
        const paiementData = response.data?.paiement || response.paiement;
        
        if (paiementData) {
          // Ouvrir l'URL de paiement si disponible
          if (paiementData.redirect_url) {
            window.open(paiementData.redirect_url, '_blank');
          } else if (paiementData.payment_url) {
            window.open(paiementData.payment_url, '_blank');
          }
        }
        
        await refreshOrders();
        console.log('Paiement relancé avec succès');
      } else {
        setError(response.message || 'Erreur lors de la relance du paiement');
      }
    } catch (err) {
      setError('Erreur lors de la relance du paiement');
      console.error('Erreur relance paiement:', err);
    }
  };

  // Debug : Vérifier la configuration du service
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      CommandeApiService.verifierConfiguration();
    }
  }, []);

  // Effet pour charger les commandes au montage et changement de page
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authentifié, chargement des commandes...');
      loadOrders(currentPage);
    } else {
      console.log('User non authentifié');
      setOrders([]);
      setLoading(false);
    }
  }, [isAuthenticated, currentPage]);

  // Utilitaires de formatage - UTILISENT les méthodes du service
  const formatPrice = (price) => {
    return CommandeApiService.formaterMontant(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Configuration des statuts - UTILISENT les méthodes du service
  const getStatusConfig = (status) => {
    const label = CommandeApiService.getLibelleStatut(status);
    const color = CommandeApiService.getCouleurStatut(status);
    
    const configs = {
      orange: {
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: <Clock size={16} />,
      },
      blue: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: <Package size={16} />,
      },
      green: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle size={16} />,
      },
      purple: {
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        icon: <Package size={16} />,
      },
      red: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <XCircle size={16} />,
      },
      gray: {
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: <AlertCircle size={16} />,
      }
    };
    
    return {
      ...configs[color] || configs.gray,
      label
    };
  };

  // Configuration des méthodes de paiement - UTILISENT les méthodes du service
  const getPaymentMethodConfig = (method) => {
    const label = CommandeApiService.getLibelleMethodePaiement(method);
    
    const configs = {
      'kaliapay': {
        icon: <Smartphone size={16} />,
        color: 'text-blue-600'
      },
      'kaliapay_webpay': {
        icon: <Smartphone size={16} />,
        color: 'text-blue-600'
      },
      'kaliapay_flash': {
        icon: <Smartphone size={16} />,
        color: 'text-blue-600'
      },
      'kaliapay_mobpay': {
        icon: <Smartphone size={16} />,
        color: 'text-blue-600'
      },
      'kaliapay_eshoppay': {
        icon: <Smartphone size={16} />,
        color: 'text-blue-600'
      },
      'carte_bancaire': {
        icon: <CreditCard size={16} />,
        color: 'text-purple-600'
      },
      'en_ligne': {
        icon: <CreditCard size={16} />,
        color: 'text-purple-600'
      },
      'especes_livraison': {
        icon: <Truck size={16} />,
        color: 'text-orange-600'
      },
      'a_la_livraison': {
        icon: <Truck size={16} />,
        color: 'text-orange-600'
      }
    };
    
    return {
      icon: configs[method]?.icon || <CreditCard size={16} />,
      label: label,
      color: configs[method]?.color || 'text-gray-600'
    };
  };

  // Filtrer les commandes
  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.statut !== filters.status) {
      return false;
    }
    if (filters.paymentMethod !== 'all' && order.methode_paiement !== filters.paymentMethod) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'amount_high':
        return b.montant_total - a.montant_total;
      case 'amount_low':
        return a.montant_total - b.montant_total;
      default:
        return 0;
    }
  });

  // Composant d'état vide amélioré
  const EmptyState = () => (
    <div className="text-center py-12">
      <Package size={64} className="text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        {orders.length === 0 && !loading ? 'Aucune commande trouvée' : 'Aucune commande correspondante'}
      </h3>
      <p className="text-gray-600 mb-6">
        {orders.length === 0 && !loading ? 
          'Vous n\'avez pas encore passé de commande.' :
          'Aucune commande ne correspond à vos filtres actuels.'
        }
      </p>
      {orders.length === 0 && !loading && (
        <div className="space-y-2">
          <Button
            variant="primary"
            onClick={() => window.location.href = '/'}
          >
            Découvrir les boutiques
          </Button>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={refreshOrders}
              icon={<RefreshCw size={16} />}
              iconPosition="left"
            >
              Actualiser
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Composant de filtres
  const FiltersPanel = () => (
    <div className={`bg-gray-50 border-t p-4 space-y-4 transition-all duration-300 ${
      showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
    }`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Statut</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirmee">Confirmée</option>
            <option value="payee">Payée</option>
            <option value="en_cours">En cours</option>
            <option value="expediee">Expédiée</option>
            <option value="livree">Livrée</option>
            <option value="annulee">Annulée</option>
            <option value="rembourse">Remboursée</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Méthode de paiement</label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Toutes les méthodes</option>
            <option value="kaliapay">KaliaPay</option>
            <option value="carte_bancaire">Carte bancaire</option>
            <option value="en_ligne">Paiement en ligne</option>
            <option value="a_la_livraison">À la livraison</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Tri</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="newest">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="amount_high">Montant décroissant</option>
            <option value="amount_low">Montant croissant</option>
          </select>
        </div>
      </div>
      
      {/* Bouton pour réinitialiser les filtres */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="small"
          onClick={() => setFilters({
            status: 'all',
            paymentMethod: 'all',
            sortBy: 'newest'
          })}
        >
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  );

  // Composant de carte de commande
  const OrderCard = ({ order }) => {
    const statusConfig = getStatusConfig(order.statut);
    const paymentConfig = getPaymentMethodConfig(order.methode_paiement);
    
    // UTILISE les méthodes du service pour vérifier les actions possibles
    const canCancel = CommandeApiService.peutAnnulerCommande(order);
    const canRetryPayment = CommandeApiService.peutRelancerPaiement(order);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-800">
                Commande #{order.reference}
              </h4>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border`}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(order.created_at)}
              </div>
              
              <div className={`flex items-center gap-1 ${paymentConfig.color}`}>
                {paymentConfig.icon}
                {paymentConfig.label}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-800">
              {formatPrice(order.montant_total)}
            </div>
            {order.boutique && (
              <div className="text-sm text-gray-600">
                {order.boutique.nom}
              </div>
            )}
          </div>
        </div>

        {/* Produits aperçu */}
        {order.produits && order.produits.length > 0 && (
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-1">
              {order.produits.length} produit{order.produits.length !== 1 ? 's' : ''}:
            </div>
            <div className="flex flex-wrap gap-1">
              {order.produits.slice(0, 3).map((produit, index) => (
                <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  {produit.nom} (×{produit.pivot?.quantite || 1})
                </span>
              ))}
              {order.produits.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{order.produits.length - 3} autre{order.produits.length - 3 !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="small"
              onClick={() => loadOrderDetails(order.id)}
              icon={<Eye size={14} />}
              iconPosition="left"
            >
              Détails
            </Button>
            
            {canCancel && (
              <Button
                variant="outline"
                size="small"
                onClick={() => cancelOrder(order.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
                icon={<XCircle size={14} />}
                iconPosition="left"
              >
                Annuler
              </Button>
            )}
            
            {canRetryPayment && (
              <Button
                variant="outline"
                size="small"
                onClick={() => retryPayment(order.id)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                icon={<RotateCcw size={14} />}
                iconPosition="left"
              >
                Relancer
              </Button>
            )}
          </div>
          
          {order.transaction_id && (
            <div className="text-xs text-gray-500">
              ID: {order.transaction_id.slice(0, 8)}...
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal des détails de commande (reste identique)
  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    const statusConfig = getStatusConfig(selectedOrder.statut);
    const paymentConfig = getPaymentMethodConfig(selectedOrder.paiement?.methode || selectedOrder.methode_paiement);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Commande #{selectedOrder.reference}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatDate(selectedOrder.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium mb-2">Informations de commande</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boutique:</span>
                    <span className="font-medium">{selectedOrder.boutique?.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant total:</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(selectedOrder.montant_total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais commission:</span>
                    <span>{formatPrice(selectedOrder.frais_commission)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Paiement</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {paymentConfig.icon}
                    <span className="font-medium">{paymentConfig.label}</span>
                  </div>
                  {selectedOrder.paiement && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Référence:</span>
                        <span className="font-mono text-xs">
                          {selectedOrder.paiement.reference}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut paiement:</span>
                        <span className={
                          selectedOrder.paiement.statut === 'paye' ? 'text-green-600' :
                          selectedOrder.paiement.statut === 'echec' ? 'text-red-600' :
                          'text-amber-600'
                        }>
                          {selectedOrder.paiement.statut}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Adresse de livraison */}
            {selectedOrder.adresse_livraison && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Adresse de livraison</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  {selectedOrder.adresse_livraison}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Notes</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  {selectedOrder.notes}
                </div>
              </div>
            )}

            {/* Produits */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Produits commandés</h4>
              <div className="space-y-3">
                {selectedOrder.produits?.map((produit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{produit.nom}</div>
                      <div className="text-sm text-gray-600">
                        {formatPrice(produit.pivot?.prix_unitaire || produit.prix)} × {produit.pivot?.quantite || 1}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatPrice(produit.pivot?.sous_total || (produit.prix * (produit.pivot?.quantite || 1)))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowOrderDetails(false)}
                fullWidth
              >
                Fermer
              </Button>
              
              {selectedOrder.statut === 'payee' && selectedOrder.produits?.some(p => p.type === 'digital') && (
                <Button
                  variant="primary"
                  icon={<Download size={16} />}
                  iconPosition="left"
                  fullWidth
                >
                  Télécharger les produits
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Affichage conditionnel selon l'état d'authentification
  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-lg p-6 text-center ${className}`}>
        <Package size={48} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Connectez-vous pour voir vos commandes
        </h3>
        <p className="text-gray-600 mb-4">
          Accédez à l'historique de toutes vos commandes et suivez leur statut.
        </p>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/auth/login'}
        >
          Se connecter
        </Button>
      </div>
    );
  }

  // État de chargement
  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-gray-200 rounded w-32" />
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Historique des commandes
            </h3>
            <p className="text-sm text-gray-600">
              {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} trouvée{filteredOrders.length !== 1 ? 's' : ''}
              {orders.length !== filteredOrders.length && ` sur ${orders.length} au total`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter size={16} />}
              iconPosition="left"
            >
              Filtres
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            
            <Button
              variant="outline"
              size="small"
              onClick={refreshOrders}
              disabled={refreshing}
              icon={refreshing ? 
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" /> :
                <RefreshCw size={16} />
              }
            >
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </div>
        </div>
        
        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={() => setError(null)}
              className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              Masquer
            </Button>
          </div>
        )}

        {/* Informations de debug en mode développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="text-xs text-blue-700">
              <strong>Debug Info:</strong>
              <br />
              Orders count: {orders.length}
              <br />
              Filtered count: {filteredOrders.length}
              <br />
              Current page: {currentPage}
              <br />
              Total pages: {totalPages}
              <br />
              Is authenticated: {String(isAuthenticated)}
              <br />
              Loading: {String(loading)}
            </div>
          </div>
        )}
      </div>

      {/* Panneau de filtres */}
      <FiltersPanel />

      {/* Liste des commandes */}
      <div className="p-6">
        {filteredOrders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={`order-${order.id}`} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 border-t">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Précédent
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Modal des détails de commande */}
      {showOrderDetails && <OrderDetailsModal />}
    </div>
  );
};

export default OrderHistory;