import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Plus, Search, Edit, Trash2, Eye, AlertTriangle, Store, CreditCard, UserPlus } from 'lucide-react';
import { userService, User, UpdateUserData } from '../services/userService';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    localite: '',
    pays: '',
    email: '',
    password: '',
    role: 'client' as 'admin' | 'vendeur' | 'client',
    is_active: true
  });

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data.users);
    } catch (error: any) {
      showToast('error', 'Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater les dates correctement
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Utilisateur',
      width: '25%',
      render: (value: string, record: User) => {
        const fullName = `${record.prenom || ''} ${record.nom || ''}`.trim();
        const initial = record.prenom ? record.prenom.charAt(0).toUpperCase() : 'U';
        
        return (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 text-sm">
              {initial}
            </div>
            <div className="ml-2 min-w-0">
              <p className="font-medium truncate text-sm">{fullName || 'Nom non renseigné'}</p>
              <p className="text-gray-500 text-xs truncate">{record.email || 'Aucun email'}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'localite',
      title: 'Localisation',
      width: '15%',
      render: (value: string, record: User) => (
        <div className="min-w-0">
          <p className="text-xs truncate">{value || 'Non renseigné'}</p>
          <p className="text-gray-500 text-xs truncate">{record.pays || 'Non renseigné'}</p>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Rôle',
      width: '12%',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'admin' ? 'bg-red-100 text-red-800' :
          value === 'vendeur' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value === 'admin' ? 'Admin' : 
           value === 'vendeur' ? 'Vendeur' : 'Client'}
        </span>
      )
    },
    {
      key: 'boutique',
      title: 'Boutique',
      width: '15%',
      render: (_: any, record: User) => (
        <div className="flex items-center min-w-0">
          {record.boutique ? (
            <div className="flex items-center min-w-0">
              <Store size={12} className="text-[#FF6A00] mr-1 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{record.boutique.nom}</p>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">Aucune</span>
          )}
        </div>
      )
    },
    {
      key: 'abonnement',
      title: 'Abonnement',
      width: '15%',
      render: (_: any, record: User) => (
        <div className="flex items-center min-w-0">
          {record.abonnement && record.plan ? (
            <div className="flex items-center min-w-0">
              <CreditCard size={12} className="text-green-600 mr-1 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{record.plan.nom}</p>
                <span className={`inline-block px-1 py-0.5 rounded text-xs ${
                  record.abonnement.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {record.abonnement.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">Aucun</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      width: '12%',
      render: (value: string, record: User) => (
        <div className="min-w-0">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            record.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {record.is_active ? 'Actif' : 'Inactif'}
          </span>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {formatDate(record.created_at)}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '6%',
      render: (_: any, record: User) => (
        <div className="flex space-x-1">
          <button
            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
            onClick={() => viewUser(record)}
            title="Voir détails"
          >
            <Eye size={14} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-[#FF6A00] transition-colors"
            onClick={() => editUser(record)}
            title="Modifier"
            disabled={isEditing}
          >
            <Edit size={14} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
            onClick={() => deleteUser(record)}
            title="Supprimer"
            disabled={isDeleting}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  const filteredUsers = users.filter(user => {
    const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) ||
           user.email?.toLowerCase().includes(searchLower) ||
           user.telephone?.includes(searchTerm) ||
           user.localite?.toLowerCase().includes(searchLower);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        // Créer un nouvel utilisateur
        const createData = {
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          localite: formData.localite,
          pays: formData.pays,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          is_active: formData.is_active
        };

        const newUser = await userService.createUser(createData);
        setUsers([newUser, ...users]);
        showToast('success', 'Utilisateur créé', 'Le nouvel utilisateur a été créé avec succès');
      } else {
        // Modifier un utilisateur existant
        if (!selectedUser) {
          showToast('error', 'Erreur', 'Aucun utilisateur sélectionné');
          return;
        }

        setIsEditing(true);
        const updateData: UpdateUserData = {
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          localite: formData.localite,
          pays: formData.pays,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active
        };

        const updatedUser = await userService.updateUser(selectedUser.id, updateData);
        
        setUsers(users.map(user => 
          user.id === selectedUser.id ? updatedUser : user
        ));
        
        showToast('success', 'Utilisateur modifié', 'Les informations ont été mises à jour avec succès');
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      showToast('error', 'Erreur', error.message);
    } finally {
      setIsEditing(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    resetForm();
    setIsModalOpen(true);
  };

  const viewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const editUser = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      telephone: user.telephone || '',
      localite: user.localite || '',
      pays: user.pays || '',
      email: user.email || '',
      password: '', // On ne modifie pas le mot de passe lors de l'édition
      role: user.role || 'client',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setIsModalOpen(true);
  };

  const deleteUser = async (user: User) => {
    const hasShop = user.boutique !== null;
    
    let confirmMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.prenom} ${user.nom}" ?`;
    
    if (hasShop) {
      confirmMessage += '\n\nATTENTION: Cet utilisateur possède une boutique. La suppression nécessitera une suppression forcée qui supprimera également la boutique.';
    }

    if (window.confirm(confirmMessage)) {
      try {
        setIsDeleting(true);
        
        if (hasShop) {
          await userService.forceDeleteUser(user.id);
          showToast('success', 'Utilisateur supprimé', 'L\'utilisateur et sa boutique ont été supprimés');
        } else {
          await userService.deleteUser(user.id);
          showToast('success', 'Utilisateur supprimé', 'L\'utilisateur a été supprimé');
        }
        
        setUsers(users.filter(u => u.id !== user.id));
      } catch (error: any) {
        showToast('error', 'Erreur', error.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const updatedUser = await userService.toggleUserStatus(user.id);
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: updatedUser.is_active } : u));
      showToast('success', 'Statut modifié', 
        `L'utilisateur est maintenant ${updatedUser.is_active ? 'actif' : 'inactif'}`);
    } catch (error: any) {
      showToast('error', 'Erreur', error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      localite: '',
      pays: '',
      email: '',
      password: '',
      role: 'client',
      is_active: true
    });
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-1">Total: {users.length} utilisateurs</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => loadUsers()}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <span>Actualiser</span>
          </Button>
          <Button
            onClick={openCreateModal}
            className="flex items-center space-x-2 bg-[#FF6A00] hover:bg-[#E55A00]"
          >
            <UserPlus size={16} />
            <span>Ajouter un utilisateur</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher par nom, email, téléphone ou localité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredUsers.length} utilisateur(s) trouvé(s)
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table columns={columns} data={filteredUsers} />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* Modal d'ajout/édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={modalMode === 'create' ? 'Ajouter un utilisateur' : 'Modifier l\'utilisateur'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              required
            />
            
            <Input
              label="Nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
            />
          </div>
          
          <Input
            label="Adresse email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          {modalMode === 'create' && (
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Minimum 8 caractères"
            />
          )}

          <Input
            label="Téléphone"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Localité"
              value={formData.localite}
              onChange={(e) => setFormData({ ...formData, localite: e.target.value })}
              required
            />
            
            <Input
              label="Pays"
              value={formData.pays}
              onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                required
              >
                <option value="client">Client</option>
                <option value="vendeur">Vendeur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-[#FF6A00] hover:bg-[#E55A00]"
              disabled={isEditing}
            >
              {isEditing ? 'Modification...' : 
               modalMode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1"
              disabled={isEditing}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de visualisation */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
        title="Détails de l'utilisateur"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations personnelles</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Nom complet:</span>
                  <p className="text-gray-900">{selectedUser.prenom || 'Non renseigné'} {selectedUser.nom || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{selectedUser.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Téléphone:</span>
                  <p className="text-gray-900">{selectedUser.telephone || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Localisation:</span>
                  <p className="text-gray-900">{selectedUser.localite || 'Non renseigné'}, {selectedUser.pays || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Rôle:</span>
                  <p className="text-gray-900">
                    {selectedUser.role === 'admin' ? 'Administrateur' : 
                     selectedUser.role === 'vendeur' ? 'Vendeur' : 'Client'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Inscription:</span>
                  <p className="text-gray-900">
                    {formatDate(selectedUser.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations boutique */}
            {selectedUser.boutique && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Boutique</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Nom:</span>
                      <p className="text-gray-900">{selectedUser.boutique.nom}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Catégorie:</span>
                      <p className="text-gray-900">{selectedUser.boutique.categorie || 'Sans catégorie'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Statut boutique:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                        selectedUser.boutique.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.boutique.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    {selectedUser.abonnement && (
                      <div>
                        <span className="font-medium text-gray-700">Fin d'abonnement:</span>
                        <p className="text-gray-900">
                          {formatDate(selectedUser.abonnement.date_fin)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                onClick={() => toggleUserStatus(selectedUser)}
                variant="outline"
                className="flex-1"
              >
                {selectedUser.is_active ? 'Désactiver' : 'Activer'}
              </Button>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  editUser(selectedUser);
                }}
                className="flex-1 bg-[#FF6A00] hover:bg-[#E55A00]"
              >
                Modifier
              </Button>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  deleteUser(selectedUser);
                }}
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};