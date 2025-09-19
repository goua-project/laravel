import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CreateStorePage from './pages/CreateStorePage';
import DashboardPage from './pages/DashboardPage';
import StorePage from './pages/StorePage';
import AddProductPage from './pages/AddProductPage';
import CheckoutPage from './components/checkout/CheckoutPage';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import { CartProvider } from './contexts/CartContext';
import ProductsList from './components/dashboard/ProductsList';
import FeaturedStores from './components/landing/FeaturedStores';
import CartPage from './pages/CartPage';
import { AuthProvider as AuthProviderAdmin } from './contexts/AuthContextAdmin';
import { Login as AdminLogin } from './pages/Loginadmin';
import { Layout as AdminLayout } from './components/layout/Layout';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedAdminRoute from './components/common/ProtectedAdminRoute';
import { ToastProvider } from './components/ui/Toast';

// Import des pages d'administration
import { Shops } from './pages/Shops';
import { UsersPage } from './pages/UsersPage';
import { TrendingShops as TrendingShopsPage } from './pages/TrendingShops';  
import { Products } from './pages/Products';
import { EnhancedAnalytics as ReportsPage } from './pages/EnhancedAnalytics';

// Import du composant AdminOrders mis à jour
import { AdminOrders } from './pages/Orders';
import { Transactions } from './pages/Transactions';
// Import du composant Subscriptions
import { Subscriptions } from './pages/Subscriptions';

function App() {
  return (
    <BrowserRouter>
      {/* Englobe toute l'application avec ToastProvider */}
      <ToastProvider>
        <Routes>
          {/* Routes publiques principales */}
          <Route path="/*" element={
            <AuthProvider>
              <StoreProvider>
                <CartProvider>
                  <div className="flex flex-col min-h-screen bg-gray-50">
                    <Navbar />
                    <main className="flex-grow">
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/auth/:authType" element={<AuthPage />} />
                        <Route path="/create-store" element={<CreateStorePage />} />
                        <Route path="/dashboard/*" element={<DashboardPage />} />
                        <Route path="/store/:storeId" element={<StorePage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/add-product" element={<AddProductPage />} />
                        <Route path="/checkout/:storeId" element={<CheckoutPage />} />
                        <Route path="/dashboard/products" element={<ProductsList />} />
                        <Route path="/featured-stores" element={<FeaturedStores />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </CartProvider>
              </StoreProvider>
            </AuthProvider>
          } />
          
          {/* Routes d'administration */}
          <Route path="/admin/*" element={
            <AuthProviderAdmin>
              <Routes>
                <Route path="login" element={<AdminLogin />} />
                <Route path="*" element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <Routes>
                        {/* Dashboard principal */}
                        <Route path="/" element={<AdminDashboard />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        
                        {/* Gestion des utilisateurs */}
                        <Route path="users" element={<UsersPage />} />
                        
                        {/* Gestion des boutiques */}
                        <Route path="shops" element={<Shops />} />
                        
                        {/* Gestion des produits */}
                        <Route path="products" element={<Products />} />
                        
                        {/* Gestion des commandes - Utilise le nouveau composant AdminOrders */}
                        <Route path="orders" element={<AdminOrders />} />
                        
                        {/* Rapports et statistiques */}
                        <Route path="reports" element={<ReportsPage />} />
                        
                        {/* Boutiques tendance */}
                        <Route path="trending-shops" element={<TrendingShopsPage />} />
                        
                        {/* Gestion des abonnements */}
                        <Route path="subscriptions" element={<Subscriptions />} />
                        
                        {/* Commandes invitées */}
                        
                        
                        {/* Modération des avis */}
                        
                        
                        {/* Gestion des transactions */}
                        <Route path="transactions" element={<Transactions />} />
                        
                        
                        {/* Paramètres système */}
                        
                        
                        {/* Logs système */}
                        
                        
                        {/* Route par défaut - redirige vers dashboard */}
                        <Route path="*" element={<AdminDashboard />} />
                      </Routes>
                    </AdminLayout>
                  </ProtectedAdminRoute>
                } />
              </Routes>
            </AuthProviderAdmin>
          } />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;