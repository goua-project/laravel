import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User, ShoppingCart } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import BoutiqueService from '../../services/BoutiqueService';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasBoutique, setHasBoutique] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount } = useCart(); // Changé de getTotalItems à getCartItemCount
  const navigate = useNavigate();

  const totalCartItems = getCartItemCount(); // Changé de getTotalItems à getCartItemCount

  useEffect(() => {
    const checkUserBoutique = async () => {
      if (isAuthenticated) {
        try {
          const boutiques = await BoutiqueService.getMyBoutiques();
          setHasBoutique(boutiques.length > 0);
        } catch (error) {
          console.error('Error fetching user boutiques:', error);
          setHasBoutique(false);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkUserBoutique();
  }, [isAuthenticated]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-orange-500" />
              <span className="ml-2 text-xl font-bold">Gouwadan</span>
            </Link>
          </div>

          {/* Desktop search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une boutique ou un produit..."
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </form>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/featured-stores" className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium">
              Explorer
            </Link>
            
            {isAuthenticated && !hasBoutique && (
              <Link to="/create-store" className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium">
                Créer une boutique
              </Link>
            )}

            {/* Cart Icon */}
            <Link 
              to="/cart" 
              className="relative p-2 text-gray-700 hover:text-orange-500 transition-colors duration-200"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <div className="relative ml-3 flex items-center">
                <Link to="/dashboard" className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium">
                  Tableau de bord
                </Link>
                <div className="border-l border-gray-300 h-6 mx-2"></div>
                <div className="flex items-center">
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user?.avatar || "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"}
                    alt={user?.name}
                  />
                  <button
                    onClick={handleLogout}
                    className="ml-2 text-sm text-gray-700 hover:text-orange-500"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth/login">
                  <Button variant="outline" size="sm">
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button variant="primary" size="sm">
                    S'inscrire
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button and cart */}
          <div className="flex items-center md:hidden space-x-2">
            {/* Mobile Cart Icon */}
            <Link 
              to="/cart" 
              className="relative p-2 text-gray-700 hover:text-orange-500 transition-colors duration-200"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </Link>

            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-orange-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </form>

          <Link
            to="/featured-stores"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
            onClick={() => setIsMenuOpen(false)}
          >
            Explorer
          </Link>

          {/* Mobile Cart Link */}
          <Link
            to="/cart"
            className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
            onClick={() => setIsMenuOpen(false)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Panier
            {totalCartItems > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                {totalCartItems}
              </span>
            )}
          </Link>
          
          {isAuthenticated && !hasBoutique && (
            <Link
              to="/create-store"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Créer une boutique
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Tableau de bord
              </Link>
              <div className="px-3 py-2 flex items-center">
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={user?.avatar || "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"}
                  alt={user?.name}
                />
                <span className="ml-3 text-base font-medium text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className="mt-4 px-3 space-y-2">
              <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" fullWidth>
                  Connexion
                </Button>
              </Link>
              <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                <Button variant="primary" fullWidth>
                  S'inscrire
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;