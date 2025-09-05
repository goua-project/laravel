import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { Search, Eye, Package, RefreshCw, AlertCircle, CheckCircle, X, Truck } from 'lucide-react';
import CommandeApiService from '../services/commandeApiService';

interface CommandeProduit {
  id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
  produit?: {
    id: string;
    nom: string;
    prix: number;
    type: 'physique' | 'digital' | 'service';
  };
}

interface Commande {
  id: string;
  reference: string;
  user_id: string;
  boutique_id: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
  };
  boutique: {
    id: string;
    nom: string;
  };
  montant_total: number;
  frais_commission: number;
  statut: 'en_attente' | 'payee' | 'en_cours' | 'livree' | 'annulee';
  methode_paiement: string;
  transaction_id?: string;
  adresse_livraison?: string;
  notes?: string;
  produits: CommandeProduit[];
  created_at: string;
  updated_at: string;
  paiement?: {
    id: string;
    reference: string;
    statut: string;
    methode: string;
    details: any;
  };
}

interface CommandeStats {
  total_commandes: number;
  commandes_en_attente: number;
  commandes_payees: number;
  commandes_en_cours: number;
  commandes_livrees: number;
  commandes_annulees: number;
  chiffre_affaires_total: number;
  chiffre_affaires_mois: number;
}

export const AdminOrders: React.FC = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState<CommandeStats>({
    total_commandes: 0,
    commandes_en_attente: 0,
    commandes_payees: 0,
    commandes_en_cours: 0,
    commandes_livrees: 0,
    commandes_annulees: 0,
    chiffre_affaires_total: 0,
    chiffre_affaires_mois: 0
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });
  const { showToast } = useToast();

  // Charger toutes les commandes en utilisant le service
  const loadCommandes = async (page = 1) => {
    try {
      setLoading(true);
      
      // Utiliser le service pour lister les commandes (endpoint admin)
      const response = await fetch(`http://localhost:8000/api/admin/commandes?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const commandesData = data.data || data.commandes || [];
        
        // Transformer les données pour correspondre à l'interface
        const transformedCommandes = commandesData.map((commande: any) => ({
          id: commande.id.toString(),
          reference: commande.reference,
          user_id: commande.user_id.toString(),
          boutique_id: commande.boutique_id.toString(),
          user: commande.user || {
            id: commande.user_id.toString(),
            nom: 'Inconnu',
            prenom: 'Utilisateur',
            email: 'inconnu@example.com'
          },
          boutique: commande.boutique || {
            id: commande.boutique_id.toString(),
            nom: 'Boutique inconnue'
          },
          montant_total: parseFloat(commande.montant_total),
          frais_commission: parseFloat(commande.frais_commission || 0),
          statut: commande.statut,
          methode_paiement: commande.methode_paiement,
          transaction_id: commande.transaction_id,
          adresse_livraison: commande.adresse_livraison,
          notes: commande.notes,
          produits: commande.produits || commande.commande_produits || [],
          created_at: commande.created_at,
          updated_at: commande.updated_at,
          paiement: commande.paiement
        }));
        
        setCommandes(transformedCommandes);
        
        // Mettre à jour la pagination si disponible
        if (data.current_page) {
          setPagination({
            current_page: data.current_page,
            last_page: data.last_page || 1,
            per_page: data.per_page || 15,
            total: data.total || 0
          });
        }
      } else {
        showToast('error', 'Erreur', data.message || 'Impossible de charger les commandes');
        setCommandes([]);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      showToast('error', 'Erreur', 'Une erreur inattendue s\'est produite');
      setCommandes([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les stats à partir des commandes chargées
  const calculateStatsFromCommandes = () => {
    const newStats = commandes.reduce((acc, commande) => {
      acc.total_commandes++;
      
      switch (commande.statut) {
        case 'en_attente':
          acc.commandes_en_attente++;
          break;
        case 'payee':
          acc.commandes_payees++;
          acc.chiffre_affaires_total += commande.montant_total;
          break;
        case 'en_cours':
          acc.commandes_en_cours++;
          break;
        case 'livree':
          acc.commandes_livrees++;
          acc.chiffre_affaires_total += commande.montant_total;
          break;
        case 'annulee':
          acc.commandes_annulees++;
          break;
      }
      
      return acc;
    }, {
      total_commandes: 0,
      commandes_en_attente: 0,
      commandes_payees: 0,
      commandes_en_cours: 0,
      commandes_livrees: 0,
      commandes_annulees: 0,
      chiffre_affaires_total: 0,
      chiffre_affaires_mois: 0
    });
    
    setStats(newStats);
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async (commandeId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('access_token');

      const response = await fetch(`http://localhost:8000/api/admin/commandes/${commandeId}/statut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success || response.ok) {
        setCommandes(commandes.map(commande => 
          commande.id === commandeId 
            ? { ...commande, statut: newStatus as Commande['statut'] }
            : commande
        ));
        
        const statusLabels: Record<string, string> = {
          payee: 'payée',
          annulee: 'annulée', 
          en_cours: 'mise en cours',
          livree: 'livrée'
        };
        
        showToast('success', 'Statut mis à jour', 
          `La commande a été ${statusLabels[newStatus] || newStatus}`);
        
        // Recalculer les stats
        setTimeout(calculateStatsFromCommandes, 100);
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      showToast('error', 'Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  // Voir les détails d'une commande
  const viewOrderDetails = async (commande: Commande) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/commandes/${commande.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const commandeDetails = data.commande || data.data;
        
        const details = `
Commande: ${commandeDetails.reference || commande.reference}
Client: ${commande.user.prenom} ${commande.user.nom}
Email: ${commande.user.email}
Téléphone: ${commande.user.telephone || 'Non renseigné'}
Boutique: ${commande.boutique.nom}
Montant: ${CommandeApiService.formaterMontant(commande.montant_total)}
Frais commission: ${CommandeApiService.formaterMontant(commande.frais_commission)}
Méthode paiement: ${CommandeApiService.getLibelleMethodePaiement(commande.methode_paiement)}
Statut: ${CommandeApiService.getLibelleStatut(commande.statut)}
${commande.adresse_livraison ? `Adresse: ${commande.adresse_livraison}` : ''}
${commande.notes ? `Notes: ${commande.notes}` : ''}
${commande.transaction_id ? `Transaction: ${commande.transaction_id}` : ''}
Produits: ${commande.produits.length} article(s)
Créée le: ${new Date(commande.created_at).toLocaleString('fr-FR')}
Modifiée le: ${new Date(commande.updated_at).toLocaleString('fr-FR')}
        `;
        
        alert(details);
      }
    } catch (error) {
      console.error('Erreur affichage détails:', error);
      // Fallback avec les données déjà disponibles
      const details = `
Commande: ${commande.reference}
Client: ${commande.user.prenom} ${commande.user.nom}
Email: ${commande.user.email}
Téléphone: ${commande.user.telephone || 'Non renseigné'}
Boutique: ${commande.boutique.nom}
Montant: ${CommandeApiService.formaterMontant(commande.montant_total)}
Frais commission: ${CommandeApiService.formaterMontant(commande.frais_commission)}
Méthode paiement: ${CommandeApiService.getLibelleMethodePaiement(commande.methode_paiement)}
Statut: ${CommandeApiService.getLibelleStatut(commande.statut)}
${commande.adresse_livraison ? `Adresse: ${commande.adresse_livraison}` : ''}
${commande.notes ? `Notes: ${commande.notes}` : ''}
Produits: ${commande.produits.length} article(s)
      `;
      alert(details);
    }
  };

  // Annuler une commande
  const cancelOrder = async (commandeId: string) => {
    try {
      const commande = commandes.find(c => c.id === commandeId);
      if (!commande) return;

      if (commande.statut !== 'en_attente') {
        showToast('error', 'Action impossible', 'Seules les commandes en attente peuvent être annulées');
        return;
      }

      if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
        return;
      }

      const response = await fetch(`http://localhost:8000/api/admin/commandes/${commandeId}/annuler`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setCommandes(commandes.map(c => 
          c.id === commandeId 
            ? { ...c, statut: 'annulee' }
            : c
        ));
        
        showToast('success', 'Commande annulée', 'La commande a été annulée avec succès');
        setTimeout(calculateStatsFromCommandes, 100);
      } else {
        showToast('error', 'Erreur', data.message || 'Impossible d\'annuler la commande');
      }
    } catch (error) {
      console.error('Erreur annulation commande:', error);
      showToast('error', 'Erreur', 'Une erreur inattendue s\'est produite');
    }
  };

  // Configuration des colonnes du tableau avec largeurs fixes
  const columns = [
    {
      key: 'reference',
      title: 'Commande',
      width: '180px',
      render: (value: string, record: Commande) => (
        <div className="min-w-[160px]">
          <p className="font-medium text-blue-600 truncate">{value}</p>
          <p className="text-gray-500 text-sm">
            {new Date(record.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )
    },
    {
      key: 'user',
      title: 'Client',
      width: '220px',
      render: (user: Commande['user']) => (
        <div className="flex items-center min-w-[200px]">
          <div className="w-8 h-8 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {user.prenom.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="font-medium truncate">{user.prenom} {user.nom}</p>
            <p className="text-gray-500 text-sm truncate">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'boutique',
      title: 'Boutique',
      width: '150px',
      render: (boutique: Commande['boutique']) => (
        <div className="min-w-[130px]">
          <span className="truncate block">{boutique.nom}</span>
        </div>
      )
    },
    {
      key: 'produits',
      title: 'Articles',
      width: '100px',
      render: (produits: CommandeProduit[]) => (
        <div className="min-w-[80px] text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {produits.length} article{produits.length > 1 ? 's' : ''}
          </span>
        </div>
      )
    },
    {
      key: 'montant_total',
      title: 'Montant',
      width: '140px',
      render: (value: number, record: Commande) => (
        <div className="min-w-[120px]">
          <span className="font-medium text-green-600">{CommandeApiService.formaterMontant(value)}</span>
          {record.frais_commission > 0 && (
            <p className="text-xs text-gray-500">
              Frais: {CommandeApiService.formaterMontant(record.frais_commission)}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'methode_paiement',
      title: 'Paiement',
      width: '120px',
      render: (value: string) => (
        <div className="min-w-[100px]">
          <span className="text-sm">{CommandeApiService.getLibelleMethodePaiement(value)}</span>
        </div>
      )
    },
    {
      key: 'statut',
      title: 'Statut & Actions',
      width: '280px',
      render: (value: string, record: Commande) => {
        const statusConfig = {
          en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente', icon: AlertCircle },
          payee: { bg: 'bg-green-100', text: 'text-green-800', label: 'Payée', icon: CheckCircle },
          en_cours: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En cours', icon: RefreshCw },
          livree: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livrée', icon: CheckCircle },
          annulee: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée', icon: X }
        };
        
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.en_attente;
        const IconComponent = config.icon;
        
        return (
          <div className="flex flex-col space-y-2 min-w-[260px]">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${config.bg} ${config.text}`}>
              <IconComponent size={12} className="mr-1" />
              {config.label}
            </span>
            <div className="flex space-x-1">
              {value === 'en_attente' && (
                <>
                  <button
                    onClick={() => updateOrderStatus(record.id, 'payee')}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    title="Marquer comme payée"
                  >
                    ✓ Payée
                  </button>
                  <button
                    onClick={() => cancelOrder(record.id)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    title="Annuler"
                  >
                    ✗ Annuler
                  </button>
                </>
              )}
              {value === 'payee' && (
                <button
                  onClick={() => updateOrderStatus(record.id, 'en_cours')}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  title="Marquer comme en cours"
                >
                  ➔ En cours
                </button>
              )}
              {value === 'en_cours' && (
                <button
                  onClick={() => updateOrderStatus(record.id, 'livree')}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                  title="Marquer comme livrée"
                >
                  ✅ Livrée
                </button>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Détails',
      width: '80px',
      render: (_: any, record: Commande) => (
        <div className="min-w-[60px]">
          <button
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            onClick={() => viewOrderDetails(record)}
            title="Voir détails"
          >
            <Eye size={16} />
          </button>
        </div>
      )
    }
  ];

  // Filtrer les commandes
  const filteredCommandes = commandes.filter(commande => {
    const matchesSearch = commande.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${commande.user.prenom} ${commande.user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commande.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commande.boutique.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || commande.statut === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Effects
  useEffect(() => {
    loadCommandes();
  }, []);

  useEffect(() => {
    if (commandes.length > 0) {
      calculateStatsFromCommandes();
    }
  }, [commandes]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    loadCommandes(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Administration et suivi de toutes les commandes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => loadCommandes(pagination.current_page)}
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total_commandes}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.commandes_en_attente}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Payées</p>
          <p className="text-2xl font-bold text-green-600">{stats.commandes_payees}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">En cours</p>
          <p className="text-2xl font-bold text-blue-600">{stats.commandes_en_cours}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Livrées</p>
          <p className="text-2xl font-bold text-green-600">{stats.commandes_livrees}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Annulées</p>
          <p className="text-2xl font-bold text-red-600">{stats.commandes_annulees}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
          <p className="text-2xl font-bold text-[#FF6A00]">
            {CommandeApiService.formaterMontant(stats.chiffre_affaires_total)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher par commande, client, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
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

          <div className="text-sm text-gray-500">
            {filteredCommandes.length} sur {commandes.length} commandes
          </div>
        </div>

        {/* Indication de défilement horizontal */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-700 text-sm">
            <Package size={16} className="mr-2" />
            <span>💡 Faites défiler horizontalement pour voir toutes les colonnes</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin mr-2" size={24} />
            <span>Chargement des commandes...</span>
          </div>
        ) : (
          <>
            {/* Container avec défilement horizontal */}
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="overflow-hidden border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                            style={{ width: column.width }}
                          >
                            {column.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCommandes.map((commande, index) => (
                        <tr key={commande.id} className="hover:bg-gray-50 transition-colors">
                          {columns.map((column) => (
                            <td
                              key={`${commande.id}-${column.key}`}
                              className="px-4 py-4 border-r border-gray-200 last:border-r-0 align-top"
                              style={{ width: column.width }}
                            >
                              {column.render 
                                ? column.render(commande[column.key as keyof Commande], commande)
                                : String(commande[column.key as keyof Commande] || '')
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredCommandes.length === 0 && (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Aucune commande trouvée</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Page {pagination.current_page} sur {pagination.last_page} 
                  ({pagination.total} commandes au total)
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};