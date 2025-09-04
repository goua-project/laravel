import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Plus, Search, Edit, Trash2, Eye, MapPin } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  owner: string;
  category: string;
  location: string;
  status: 'active' | 'pending' | 'suspended';
  productsCount: number;
  createdAt: string;
}

const mockShops: Shop[] = [
  {
    id: '1',
    name: 'Électro Bénin',
    owner: 'Jean Kouassi',
    category: 'Électronique',
    location: 'Cotonou, Bénin',
    status: 'active',
    productsCount: 45,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Mode Africaine',
    owner: 'Marie Adjou',
    category: 'Mode',
    location: 'Porto-Novo, Bénin',
    status: 'active',
    productsCount: 78,
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Épicerie du Marché',
    owner: 'Paul Dossou',
    category: 'Alimentation',
    location: 'Parakou, Bénin',
    status: 'pending',
    productsCount: 23,
    createdAt: '2024-01-20'
  }
];

export const Shops: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>(mockShops);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    category: 'Électronique',
    location: '',
    status: 'pending' as const
  });

  const columns = [
    {
      key: 'name',
      title: 'Boutique',
      render: (value: string, record: Shop) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-gray-500 text-sm">{record.owner}</p>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Catégorie',
      render: (value: string) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
        </span>
      )
    },
    {
      key: 'location',
      title: 'Localisation',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={14} className="mr-1" />
          {value}
        </div>
      )
    },
    {
      key: 'productsCount',
      title: 'Produits',
      render: (value: number) => (
        <span className="font-medium">{value} produits</span>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string) => {
        const statusConfig = {
          active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Actif' },
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
          suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspendu' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: Shop) => (
        <div className="flex space-x-2">
          <button
            className="p-1 text-gray-600 hover:text-blue-600"
            onClick={() => viewShop(record)}
            title="Voir"
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-[#FF6A00]"
            onClick={() => editShop(record)}
            title="Modifier"
          >
            <Edit size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-red-600"
            onClick={() => deleteShop(record.id)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedShop) {
      setShops(shops.map(shop => 
        shop.id === selectedShop.id 
          ? { ...shop, ...formData }
          : shop
      ));
      showToast('success', 'Boutique modifiée', 'Les informations ont été mises à jour');
    } else {
      const newShop: Shop = {
        id: Date.now().toString(),
        ...formData,
        productsCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setShops([...shops, newShop]);
      showToast('success', 'Boutique créée', 'La nouvelle boutique a été ajoutée');
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const viewShop = (shop: Shop) => {
    showToast('success', 'Consultation boutique', `Affichage des détails de ${shop.name}`);
  };

  const editShop = (shop: Shop) => {
    setSelectedShop(shop);
    setFormData({
      name: shop.name,
      owner: shop.owner,
      shop_type: shop.shop_type,
      category: shop.category,
      location: shop.location,
      status: shop.status
    });
    setIsModalOpen(true);
  };

  const deleteShop = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      setShops(shops.filter(shop => shop.id !== id));
      showToast('success', 'Boutique supprimée', 'La boutique a été retirée du système');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      owner: '',
      category: 'Électronique',
      location: '',
      status: 'pending'
    });
    setSelectedShop(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Boutiques</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nouvelle boutique</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher une boutique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table columns={columns} data={filteredShops} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedShop ? 'Modifier la boutique' : 'Nouvelle boutique'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de la boutique"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="Propriétaire"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              required
            >
              <option value="Électronique">Électronique</option>
              <option value="Mode">Mode</option>
              <option value="Alimentation">Alimentation</option>
              <option value="Maison">Maison & Jardin</option>
              <option value="Sport">Sport & Loisirs</option>
              <option value="Beauté">Beauté & Santé</option>
            </select>
          </div>

          <Input
            label="Localisation"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="ex: Cotonou, Bénin"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            >
              <option value="pending">En attente</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
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
    </div>
  );
};