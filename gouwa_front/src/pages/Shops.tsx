import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, MapPin, RefreshCw } from 'lucide-react';
import { boutiqueService, type Boutique } from '../services/adminboutiqueService';

// Interface pour les filtres - alignée avec le service
interface BoutiqueFilters {
  status?: 'active' | 'inactive';
  categorie?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Composants UI simples
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline';
  type?: 'button' | 'submit';
  disabled?: boolean;
}> = ({ children, onClick, className = '', variant = 'default', type = 'button', disabled = false }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' 
    : 'bg-[#FF6A00] text-white hover:bg-[#E55A00]';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}> = ({ label, value, onChange, placeholder, className = '', required = false }) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] ${className}`}
    />
  </div>
);

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Table: React.FC<{
  columns: Array<{
    key: string;
    title: string;
    render?: (value: any, record: any) => React.ReactNode;
  }>;
  data: any[];
  loading?: boolean;
}> = ({ columns, data, loading = false }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
              Chargement...
            </td>
          </tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
              Aucune boutique trouvée
            </td>
          </tr>
        ) : (
          data.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                  {column.render ? column.render(item[column.key], item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// Hook pour les toasts
const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>>([]);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="font-medium">{toast.title}</div>
          <div className="text-sm">{toast.message}</div>
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
};

export const Shops: React.FC = () => {
  const [shops, setShops] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Boutique | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1
  });
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    categorie: 'Électronique',
    type: 'physical' as const,
    couleur_accent: '#FF6A00',
    status: 'active' as const
  });

  // Charger les boutiques
  const loadBoutiques = async (page: number = 1) => {
    setLoading(true);
    try {
      const filters: BoutiqueFilters = {
        page,
        per_page: pagination.per_page
      };
      
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter as 'active' | 'inactive';
      if (categoryFilter !== 'all') filters.categorie = categoryFilter;

      const response = await boutiqueService.getBoutiques(filters);
      
      // Le service retourne { boutiques: Boutique[], total: number, categories: string[] }
      setShops(response.boutiques);
      setCategories(response.categories);
      
      // Mise à jour de la pagination - calculer les valeurs nécessaires
      const totalPages = Math.ceil(response.total / pagination.per_page);
      setPagination(prev => ({
        ...prev,
        current_page: page,
        total: response.total,
        last_page: totalPages
      }));

      console.log(`✅ ${response.boutiques.length} boutiques chargées`);
      
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des boutiques:', error);
      showToast('error', 'Erreur', error.message || 'Impossible de charger les boutiques');
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les boutiques au montage du composant
  useEffect(() => {
    loadBoutiques(1);
  }, []);

  // Appliquer les filtres avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadBoutiques(1); // Revenir à la page 1 lors d'une nouvelle recherche
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, categoryFilter]);

  const columns = [
    {
      key: 'nom',
      title: 'Boutique',
      render: (value: string, record: Boutique) => (
        <div className="flex items-center space-x-3">
          {record.logo && (
            <img 
              src={record.logo} 
              alt={`Logo ${record.nom}`}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-gray-500 text-sm">
              {record.user ? `${record.user.prenom} ${record.user.nom}` : 'Propriétaire inconnu'}
            </p>
            {record.slogan && (
              <p className="text-gray-400 text-xs italic">{record.slogan}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'categorie',
      title: 'Catégorie',
      render: (value: string, record: Boutique) => (
        <div>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {value}
          </span>
          <p className="text-xs text-gray-500 mt-1 capitalize">{record.type}</p>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (_: any, record: Boutique) => (
        <div className="text-sm">
          {record.user?.email ? (
            <div className="flex items-center text-gray-600">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{record.user.email}</span>
            </div>
          ) : (
            <span className="text-gray-400">Non défini</span>
          )}
        </div>
      )
    },
    {
      key: 'produits',
      title: 'Produits',
      render: (_: any, record: Boutique) => (
        <div>
          <span className="font-medium">{record.total_produits || 0} total</span>
          <p className="text-xs text-gray-500">{record.produits_actifs || 0} actifs</p>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (_: any, record: Boutique) => {
        const isActive = record.is_active && record.status === 'active';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isActive ? 'Actif' : 'Inactif'}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      title: 'Créée le',
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('fr-FR')}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: Boutique) => (
        <div className="flex space-x-2">
          <button
            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
            onClick={() => viewShop(record)}
            title="Voir les détails"
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-[#FF6A00] transition-colors"
            onClick={() => editShop(record)}
            title="Modifier"
          >
            <Edit size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
            onClick={() => deleteShop(record.id)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedShop) {
        const updatedShop = await boutiqueService.updateBoutique(selectedShop.id, formData);
        showToast('success', 'Boutique modifiée', 'Les informations ont été mises à jour');
        loadBoutiques(pagination.current_page);
      } else {
        showToast('info', 'Information', 'Création de boutique non implémentée côté service');
      }
    } catch (error: any) {
      showToast('error', 'Erreur', error.message || 'Une erreur est survenue');
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const viewShop = async (shop: Boutique) => {
    try {
      const response = await boutiqueService.getBoutique(shop.id);
      showToast('success', 'Détails chargés', `Informations de ${shop.nom} récupérées`);
      console.log('Détails de la boutique:', response);
      // Ici vous pourriez ouvrir un modal détaillé ou naviguer vers une page de détails
    } catch (error: any) {
      showToast('error', 'Erreur', error.message || 'Impossible de charger les détails');
    }
  };

  const editShop = (shop: Boutique) => {
    setSelectedShop(shop);
    setFormData({
      nom: shop.nom,
      description: shop.description,
      categorie: shop.categorie,
      type: shop.type,
      couleur_accent: shop.couleur_accent,
      status: shop.status
    });
    setIsModalOpen(true);
  };

  const deleteShop = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      try {
        await boutiqueService.deleteBoutique(id);
        showToast('success', 'Boutique supprimée', 'La boutique a été retirée du système');
        loadBoutiques(pagination.current_page);
      } catch (error: any) {
        if (error.message.includes('dependencies') || error.message.includes('contraintes')) {
          // Proposer la suppression forcée si il y a des contraintes
          if (window.confirm('Cette boutique a des dépendances. Voulez-vous forcer la suppression ?')) {
            try {
              await boutiqueService.forceDeleteBoutique(id);
              showToast('success', 'Boutique supprimée', 'La boutique a été supprimée avec force');
              loadBoutiques(pagination.current_page);
            } catch (forceError: any) {
              showToast('error', 'Erreur', forceError.message || 'Impossible de supprimer la boutique');
            }
          }
        } else {
          showToast('error', 'Erreur', error.message || 'Impossible de supprimer la boutique');
        }
      }
    }
  };

  const toggleShopStatus = async (shop: Boutique) => {
    try {
      const updatedShop = await boutiqueService.toggleStatus(shop.id);
      const newStatus = updatedShop.is_active ? 'activée' : 'désactivée';
      showToast('success', 'Statut modifié', `La boutique ${shop.nom} a été ${newStatus}`);
      loadBoutiques(pagination.current_page);
    } catch (error: any) {
      showToast('error', 'Erreur', error.message || 'Impossible de modifier le statut');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      categorie: 'Électronique',
      type: 'physical',
      couleur_accent: '#FF6A00',
      status: 'active'
    });
    setSelectedShop(null);
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Boutiques</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => loadBoutiques(pagination.current_page)}
            variant="outline"
            className="flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nouvelle boutique</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher par nom, propriétaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <Table columns={columns} data={shops} loading={loading} />

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur{' '}
              {pagination.total} boutiques
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => loadBoutiques(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
              >
                Précédent
              </Button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {pagination.current_page} sur {pagination.last_page}
              </span>
              <Button
                variant="outline"
                onClick={() => loadBoutiques(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de modification/création */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedShop ? `Modifier ${selectedShop.nom}` : 'Nouvelle boutique'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de la boutique"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
              required
              placeholder="Description de la boutique..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={formData.categorie}
              onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white"
              required
            >
              <option value="Électronique">Électronique</option>
              <option value="Mode">Mode</option>
              <option value="Alimentation">Alimentation</option>
              <option value="Maison">Maison & Jardin</option>
              <option value="Sport">Sport & Loisirs</option>
              <option value="Beauté">Beauté & Santé</option>
              <option value="Autres">Autres</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de boutique
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white"
            >
              <option value="physical">Boutique physique</option>
              <option value="digital">Boutique numérique</option>
              <option value="service">Prestation de service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur d'accent
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.couleur_accent}
                onChange={(e) => setFormData({ ...formData, couleur_accent: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              />
              <Input
                value={formData.couleur_accent}
                onChange={(e) => setFormData({ ...formData, couleur_accent: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedShop ? 'Modifier' : 'Créer'}
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

      {/* Actions rapides pour boutique sélectionnée */}
      {selectedShop && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-medium mb-3">Actions rapides pour {selectedShop.nom}</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => toggleShopStatus(selectedShop)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>{selectedShop.is_active ? 'Désactiver' : 'Activer'}</span>
            </Button>
            <Button
              onClick={() => viewShop(selectedShop)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>Voir statistiques</span>
            </Button>
            <Button
              onClick={() => editShop(selectedShop)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Modifier</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};