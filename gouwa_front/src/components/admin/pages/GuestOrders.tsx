import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { guestOrdersAPI, GuestOrder } from '../services/api';
import { Search, UserX, Package, MapPin, Phone, Mail } from 'lucide-react';

export const GuestOrders: React.FC = () => {
  const [orders, setOrders] = useState<GuestOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadGuestOrders();
  }, []);

  const loadGuestOrders = async () => {
    try {
      setLoading(true);
      const data = await guestOrdersAPI.getGuestOrders();
      setOrders(data);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de charger les commandes invitées');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await guestOrdersAPI.updateGuestOrderStatus(orderId, newStatus);
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as GuestOrder['status'] }
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
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const columns = [
    {
      key: 'id',
      title: 'Commande',
      render: (value: string, record: GuestOrder) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-gray-500 text-sm">{new Date(record.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
      )
    },
    {
      key: 'guest_name',
      title: 'Client Invité',
      render: (value: string, record: GuestOrder) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
            <UserX size={16} />
          </div>
          <div className="ml-3">
            <p className="font-medium">{value}</p>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Mail size={12} className="mr-1" />
              {record.guest_email}
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Phone size={12} className="mr-1" />
              {record.guest_phone}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'shop_name',
      title: 'Boutique',
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'items_count',
      title: 'Articles',
      render: (value: number) => (
        <span>{value} article{value > 1 ? 's' : ''}</span>
      )
    },
    {
      key: 'total_amount',
      title: 'Montant',
      render: (value: number) => (
        <span className="font-medium">₣ {value.toLocaleString()}</span>
      )
    },
    {
      key: 'delivery_address',
      title: 'Adresse',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={14} className="mr-1 flex-shrink-0" />
          <span className="truncate max-w-32" title={value}>{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string, record: GuestOrder) => {
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
            {value === 'confirmed' && (
              <button
                onClick={() => updateOrderStatus(record.id, 'shipped')}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                title="Expédier"
              >
                <Package size={12} />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shop_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0)
    };
  };

  const stats = getOrderStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commandes Invitées</h1>
        <Button variant="outline" onClick={loadGuestOrders}>
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Confirmées</p>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
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
          <p className="text-sm font-medium text-gray-600">Revenus</p>
          <p className="text-2xl font-bold text-[#FF6A00]">₣ {stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher une commande invitée..."
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

        <Table columns={columns} data={filteredOrders} loading={loading} />
      </div>
    </div>
  );
};