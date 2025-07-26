import { useState, useEffect } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import ProduitService from '../../services/produitService';
import Button from '../common/Button';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle
} from 'lucide-react';

const ProductsList = () => {
  const { currentStore } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Charger les produits depuis l'API
  useEffect(() => {
    const loadProducts = async () => {
      if (!currentStore) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await ProduitService.getAllProduits(currentStore.id);
        
        if (response.success) {
          // Convertir les données Laravel vers le format React
          const convertedProducts = response.data.map(product => 
            ProduitService.convertToReactFormat(product)
          );
          setProducts(convertedProducts);
        } else {
          setError(response.message || 'Erreur lors du chargement des produits');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des produits:', err);
        setError('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentStore]);

  // Filtrer et trier les produits
  const filteredAndSortedProducts = useMemo(() => {
  let filtered = [...products];
  
  // Filtrer par mot-clé
  if (searchTerm) {
    filtered = filtered.filter(
      (product) =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(product.tags) 
          ? product.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          : product.tags?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
    
    // Apply visibility filter
    if (filterVisible !== null) {
      filtered = filtered.filter((product) => product.isVisible === filterVisible);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      // Handle different field mappings
      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'price':
          aValue = parseFloat(a.price) || 0;
          bValue = parseFloat(b.price) || 0;
          break;
        case 'isVisible':
          aValue = a.isVisible ? 1 : 0;
          bValue = b.isVisible ? 1 : 0;
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }
      
      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle date values
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime();
      }
      
      // Handle string values
      const aString = String(aValue);
      const bString = String(bValue);
      
      return sortDirection === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
    
    return filtered;
  }, [products, searchTerm, filterVisible, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    if (!currentStore) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        const response = await ProduitService.deleteProduit(currentStore.id, productId);
        
        if (response.success) {
          // Retirer le produit de la liste locale
          setProducts(products.filter(p => p.id !== productId));
          setSelectedProduct(null);
        } else {
          alert('Erreur lors de la suppression: ' + response.message);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du produit');
      }
    }
  };
  
  const toggleDropdown = (productId) => {
    setSelectedProduct(selectedProduct === productId ? null : productId);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (imagePath.startsWith('http')) return imagePath;
    // Sinon, utiliser le service pour construire l'URL
    return ProduitService.getImageUrl(imagePath);
  };

  const formatTags = (tags) => {
    if (Array.isArray(tags)) {
      return tags.join(', ');
    }
    return tags || '';
  };
  
  if (!currentStore) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune boutique</h3>
        <p className="text-gray-500 mb-6">Vous n'avez pas encore créé de boutique.</p>
        <Link to="/create-store">
          <Button variant="primary">Créer ma boutique</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 text-center">
          <XCircle size={40} className="mx-auto text-red-300 mb-2" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Erreur</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const displayedProducts = filteredAndSortedProducts;
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-lg font-medium text-gray-900">Produits ({displayedProducts.length})</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setFilterVisible(filterVisible === null ? true : filterVisible ? false : null)}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 text-gray-500" />
                <span>{filterVisible === null ? 'Tous' : filterVisible ? 'Publiés' : 'Non publiés'}</span>
              </button>
            </div>
            
            <Link to="/add-product">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                iconPosition="left"
              >
                Ajouter
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {displayedProducts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Produit
                    {sortField === 'name' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Prix
                    {sortField === 'price' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('isVisible')}
                >
                  <div className="flex items-center">
                    Statut
                    {sortField === 'isVisible' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Ajouté le
                    {sortField === 'created_at' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center" style={{display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex'}}>
                          <Package size={16} className="text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category || 'Non catégorisé'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{parseFloat(product.price).toLocaleString()} FCFA</div>
                    <div className="text-xs text-gray-500">
                      {product.isDigital ? 'Produit digital' : `Stock: ${product.inStock}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.isVisible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.isVisible ? 'Publié' : 'Non publié'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(product.id)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {selectedProduct === product.id && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <Link
                              to={`/edit-product/${product.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setSelectedProduct(null)}
                            >
                              <Edit size={16} className="mr-2 text-gray-400" />
                              Modifier
                            </Link>
                            <a
                              href={`/store/${currentStore.slug}?product=${product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setSelectedProduct(null)}
                            >
                              <Eye size={16} className="mr-2 text-gray-400" />
                              Voir
                            </a>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash2 size={16} className="mr-2 text-red-400" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center">
          <Package size={40} className="mx-auto text-gray-300 mb-2" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun produit trouvé</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterVisible !== null
              ? 'Essayez de modifier vos filtres de recherche.'
              : 'Vous n\'avez pas encore ajouté de produits.'}
          </p>
          <Link to="/add-product">
            <Button variant="primary" icon={<Plus size={16} />} iconPosition="left">
              Ajouter un produit
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductsList;   