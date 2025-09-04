import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  action: string;
  user: string;
  details: string;
  ip: string;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-25 14:30:22',
    level: 'info',
    action: 'Connexion utilisateur',
    user: 'admin@gouwadan.bj',
    details: 'Connexion réussie depuis l\'interface d\'administration',
    ip: '192.168.1.100'
  },
  {
    id: '2',
    timestamp: '2024-01-25 14:25:15',
    level: 'success',
    action: 'Création boutique',
    user: 'admin@gouwadan.bj',
    details: 'Nouvelle boutique "Électro Bénin" créée avec succès',
    ip: '192.168.1.100'
  },
  {
    id: '3',
    timestamp: '2024-01-25 14:20:08',
    level: 'warning',
    action: 'Stock faible',
    user: 'system',
    details: 'Stock critique détecté pour le produit "iPhone 15 Pro"',
    ip: 'system'
  },
  {
    id: '4',
    timestamp: '2024-01-25 14:15:45',
    level: 'error',
    action: 'Tentative connexion',
    user: 'unknown@test.com',
    details: 'Tentative de connexion avec des identifiants incorrects',
    ip: '10.0.0.45'
  },
  {
    id: '5',
    timestamp: '2024-01-25 14:10:33',
    level: 'info',
    action: 'Modification utilisateur',
    user: 'admin@gouwadan.bj',
    details: 'Mise à jour du profil utilisateur "Jean Dupont"',
    ip: '192.168.1.100'
  }
];

export const Logs: React.FC = () => {
  const [logs] = useState<LogEntry[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const columns = [
    {
      key: 'timestamp',
      title: 'Horodatage',
      render: (value: string) => (
        <div className="text-sm">
          <p className="font-medium">{value.split(' ')[1]}</p>
          <p className="text-gray-500">{value.split(' ')[0]}</p>
        </div>
      )
    },
    {
      key: 'level',
      title: 'Niveau',
      render: (value: string) => {
        const levelConfig = {
          info: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Info' },
          success: { bg: 'bg-green-100', text: 'text-green-800', label: 'Succès' },
          warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Attention' },
          error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Erreur' }
        };
        const config = levelConfig[value as keyof typeof levelConfig];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'action',
      title: 'Action',
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'user',
      title: 'Utilisateur',
      render: (value: string) => (
        <span className={`text-sm ${value === 'system' ? 'text-gray-500 italic' : 'text-gray-900'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'details',
      title: 'Détails',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'ip',
      title: 'Adresse IP',
      render: (value: string) => (
        <span className={`text-sm font-mono ${value === 'system' ? 'text-gray-500' : 'text-gray-700'}`}>
          {value}
        </span>
      )
    }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getLogStats = () => {
    return {
      total: logs.length,
      info: logs.filter(log => log.level === 'info').length,
      success: logs.filter(log => log.level === 'success').length,
      warning: logs.filter(log => log.level === 'warning').length,
      error: logs.filter(log => log.level === 'error').length
    };
  };

  const stats = getLogStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Journaux d'Activité</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
          <Button variant="outline">
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Total Logs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Info</p>
          <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Succès</p>
          <p className="text-2xl font-bold text-green-600">{stats.success}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Attention</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Erreurs</p>
          <p className="text-2xl font-bold text-red-600">{stats.error}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher dans les logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            >
              <option value="all">Tous les niveaux</option>
              <option value="info">Info</option>
              <option value="success">Succès</option>
              <option value="warning">Attention</option>
              <option value="error">Erreur</option>
            </select>
          </div>
        </div>

        <Table columns={columns} data={filteredLogs} loading={isRefreshing} />
      </div>
    </div>
  );
};