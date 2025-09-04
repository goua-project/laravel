import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  registeredAt: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean@example.com',
    role: 'Utilisateur',
    status: 'active',
    registeredAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Marie Kouassi',
    email: 'marie@example.com',
    role: 'Vendeur',
    status: 'active',
    registeredAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Paul Martin',
    email: 'paul@example.com',
    role: 'Utilisateur',
    status: 'inactive',
    registeredAt: '2024-01-05'
  }
];

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Utilisateur',
    status: 'active' as const
  });

  const columns = [
    {
      key: 'name',
      title: 'Nom',
      render: (value: string, record: User) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-medium">
            {value.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="font-medium">{value}</p>
            <p className="text-gray-500 text-sm">{record.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Rôle',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Administrateur' ? 'bg-red-100 text-red-800' :
          value === 'Vendeur' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
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
      key: 'registeredAt',
      title: 'Inscription',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: User) => (
        <div className="flex space-x-2">
          <button
            className="p-1 text-gray-600 hover:text-blue-600"
            onClick={() => viewUser(record)}
            title="Voir"
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-[#FF6A00]"
            onClick={() => editUser(record)}
            title="Modifier"
          >
            <Edit size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-red-600"
            onClick={() => deleteUser(record.id)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUser) {
      // Update user
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...formData }
          : user
      ));
      showToast('success', 'Utilisateur modifié', 'Les informations ont été mises à jour');
    } else {
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        registeredAt: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
      showToast('success', 'Utilisateur créé', 'Le nouvel utilisateur a été ajouté');
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const viewUser = (user: User) => {
    showToast('success', 'Consultation utilisateur', `Affichage du profil de ${user.name}`);
  };

  const editUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsModalOpen(true);
  };

  const deleteUser = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(user => user.id !== id));
      showToast('success', 'Utilisateur supprimé', 'L\'utilisateur a été retiré du système');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Utilisateur',
      status: 'active'
    });
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nouvel utilisateur</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredUsers} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom complet"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="Adresse email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              required
            >
              <option value="Utilisateur">Utilisateur</option>
              <option value="Vendeur">Vendeur</option>
              <option value="Administrateur">Administrateur</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedUser ? 'Modifier' : 'Créer'}
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