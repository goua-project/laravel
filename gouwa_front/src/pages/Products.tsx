import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import ProduitService from '../services/produitService';

interface Product {
  id: string;
  name: string;
  shop: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image: string;
  boutique?: {
    id: string;
    nom: string;
  };
}

interface ProductStats {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const { showToast } = useToast();

  // Charger tous les produits
  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('auth_token') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('access_token');
      
      if (!token) {
        showToast('error', 'Erreur', 'Token d\'authentification manquant');
        setLoading(false);
        return;
      }

      // Appel API pour récupérer tous les produits (endpoint admin)
      const response = await fetch('http://localhost:8000/api/admin/produits', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const produitsData = data.data || data.produits || [];
        
        // Transformer les données pour correspondre à l'interface
        const transformedProducts = produitsData.map((produit: any) => {
          // Déterminer le statut basé sur le stock et la visibilité
          let status: 'active' | 'inactive' | 'out_of_stock' = 'active';
          
          if (produit.stock === 0 && produit.type === 'physique') {
            status = 'out_of_stock';
          } else if (!produit.visible) {
            status = 'inactive';
          }

          // Récupérer la première image ou une image par défaut
          let imageUrl = 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop';
          
          if (produit.images && produit.images.length > 0) {
            const firstImage = produit.images[0];
            if (typeof firstImage === 'string') {
              imageUrl = ProduitService.getImageUrl(firstImage) || imageUrl;
            } else if (firstImage.url) {
              imageUrl = ProduitService.getImageUrl(firstImage.url) || imageUrl;
            }
          }

          return {
            id: produit.id.toString(),
            name: produit.nom,
            shop: produit.boutique?.nom || 'Boutique inconnue',
            category: produit.categorie || 'Non catégorisé',
            price: parseFloat(produit.prix),
            stock: parseInt(produit.stock) || 0,
            status: status,
            image: imageUrl,
            boutique: produit.boutique
          };
        });
        
        setProducts(transformedProducts);
      } else {
        showToast('error', 'Erreur', data.message || 'Impossible de charger les produits');
        setProducts([]);
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      showToast('error', 'Erreur', 'Une erreur inattendue s\'est produite');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = () => {
    const newStats = products.reduce((acc, product) => {
      acc.total++;
      
      if (product.status === 'active') {
        acc.active++;
      } else if (product.status === 'out_of_stock') {
        acc.outOfStock++;
      }
      
      if (product.stock < 10 && product.stock > 0) {
        acc.lowStock++;
      }
      
      return acc;
    }, {
      total: 0,
      active: 0,
      lowStock: 0,
      outOfStock: 0
    });
    
    setStats(newStats);
  };

  // Filtrer les produits
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.shop.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Colonnes du tableau
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
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop';
            }}
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

  // Effects
  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gestion de tous les produits du marketplace
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
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
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher un produit, boutique ou catégorie..."
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin mr-2" size={24} />
            <span>Chargement des produits...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Aucun produit ne correspond à vos critères de recherche.' 
                : 'Aucun produit n\'a été trouvé dans le système.'}
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-4">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} sur {products.length}
            </div>
            <Table columns={columns} data={filteredProducts} />
          </>
        )}
      </div>
    </div>
  );
};               