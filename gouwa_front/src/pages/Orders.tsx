import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { Search, Eye, Package } from 'lucide-react';

interface Order {
  id: string;
  customer: string;
  shop: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
  date: string;
}

const mockOrders: Order[] = [
  {
    id: 'CMD-001',
    customer: 'Jean Dupont',
    shop: 'Électro Bénin',
    total: 750000,
    status: 'pending',
    items: 1,
    date: '2024-01-25'
  },
  {
    id: 'CMD-002',
    customer: 'Marie Kouassi',
    shop: 'Mode Africaine',
    total: 50000,
    status: 'shipped',
    items: 2,
    date: '2024-01-24'
  },
  {
    id: 'CMD-003',
    customer: 'Paul Dossou',
    shop: 'Épicerie du Marché',
    total: 30000,
    status: 'delivered',
    items: 3,
    date: '2024-01-23'
  }
];

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { showToast } = useToast();

  const columns = [
    {
      key: 'id',
      title: 'Commande',
      render: (value: string, record: Order) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-gray-500 text-sm">{new Date(record.date).toLocaleDateString('fr-FR')}</p>
        </div>
      )
    },
    {
      key: 'customer',
      title: 'Client',
      render: (value: string) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-medium text-sm">
            {value.charAt(0).toUpperCase()}
          </div>
          <span className="ml-3 font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'shop',
      title: 'Boutique',
    },
    {
      key: 'items',
      title: 'Articles',
      render: (value: number) => (
        <span>{value} article{value > 1 ? 's' : ''}</span>
      )
    },
    {
      key: 'total',
      title: 'Montant',
      render: (value: number) => (
        <span className="font-medium">₣ {value.toLocaleString()}</span>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string, record: Order) => {
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
          confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmée' },
          shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Expédiée' },
          delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livrée' },
          cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            {value === 'pending' && (
              <div className="flex space-x-1">
                <button
                  onClick={() => updateOrderStatus(record.id, 'confirmed')}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  title="Confirmer"
                >
                  ✓
                </button>
                <button
                  onClick={() => updateOrderStatus(record.id, 'cancelled')}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  title="Annuler"
                >
                  ✗
                </button>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: Order) => (
        <div className="flex space-x-2">
          <button
            className="p-1 text-gray-600 hover:text-blue-600"
            onClick={() => viewOrder(record)}
            title="Voir détails"
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-[#FF6A00]"
            onClick={() => trackOrder(record)}
            title="Suivi livraison"
          >
            <Package size={16} />
          </button>
        </div>
      )
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shop.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus as Order['status'] }
        : order
    ));
    
    const statusLabels = {
      confirmed: 'confirmée',
      cancelled: 'annulée',
      shipped: 'expédiée',
      delivered: 'livrée'
    };
    
    showToast('success', 'Statut mis à jour', 
      `La commande ${orderId} a été ${statusLabels[newStatus as keyof typeof statusLabels]}`);
  };

  const viewOrder = (order: Order) => {
    showToast('success', 'Détails commande', `Affichage des détails de ${order.id}`);
  };

  const trackOrder = (order: Order) => {
    showToast('success', 'Suivi livraison', `Ouverture du suivi pour ${order.id}`);
  };

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0)
    };
  };

  const stats = getOrderStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
        <Button variant="outline" onClick={() => showToast('success', 'Export', 'Export des commandes en cours...')}>
          Exporter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Total Commandes</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Expédiées</p>
          <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Livrées</p>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
          <p className="text-2xl font-bold text-[#FF6A00]">₣ {stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher une commande..."
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
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmées</option>
            <option value="shipped">Expédiées</option>
            <option value="delivered">Livrées</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>

        <Table columns={columns} data={filteredOrders} />
      </div>
    </div>
  );
};