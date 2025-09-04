import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { Search, Filter } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  shop: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image: string;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    shop: 'Électro Bénin',
    category: 'Électronique',
    price: 750000,
    stock: 15,
    status: 'active',
    image: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  {
    id: '2',
    name: 'Robe Traditionnelle',
    shop: 'Mode Africaine',
    category: 'Mode',
    price: 25000,
    stock: 8,
    status: 'active',
    image: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  {
    id: '3',
    name: 'Riz Local 25kg',
    shop: 'Épicerie du Marché',
    category: 'Alimentation',
    price: 15000,
    stock: 0,
    status: 'out_of_stock',
    image: 'https://images.pexels.com/photos/33406/pexels-photo-33406.jpg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  }
];

export const Products: React.FC = () => {
  const [products] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { showToast } = useToast();

  const columns = [
    {
      key: 'name',
      title: 'Produit',
      render: (value: string, record: Product) => (
        <div className="flex items-center">
          <img
            src={record.image}
            alt={value}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="ml-3">
            <p className="font-medium">{value}</p>
            <p className="text-gray-500 text-sm">{record.shop}</p>
          </div>
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
      key: 'price',
      title: 'Prix',
      render: (value: number) => (
        <span className="font-medium">₣ {value.toLocaleString()}</span>
      )
    },
    {
      key: 'stock',
      title: 'Stock',
      render: (value: number, record: Product) => (
        <div className="flex items-center">
          <span className={`font-medium ${value === 0 ? 'text-red-600' : value < 10 ? 'text-orange-600' : 'text-green-600'}`}>
            {value}
          </span>
          {value < 10 && value > 0 && (
            <span className="ml-2 text-xs text-orange-600">(Stock faible)</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string) => {
        const statusConfig = {
          active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Actif' },
          inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactif' },
          out_of_stock: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rupture de stock' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      }
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.shop.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleApprove = (productId: string) => {
    showToast('success', 'Produit approuvé', 'Le produit a été activé avec succès');
  };

  const handleReject = (productId: string) => {
    showToast('warning', 'Produit rejeté', 'Le produit a été désactivé');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => showToast('success', 'Export', 'Export des données en cours...')}>
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">T</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Produits</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">S</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Stock Faible</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.stock < 10 && p.stock > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-semibold text-sm">R</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Rupture Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.status === 'out_of_stock').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <Table columns={columns} data={filteredProducts} />
      </div>
    </div>
  );
};