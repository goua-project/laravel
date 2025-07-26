import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import ProductsList from '../components/dashboard/ProductsList';

const DashboardPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentStore } = useStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login?redirect=dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      
      <div className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/products" element={<ProductsList />} />
          <Route path="/orders" element={<ComingSoonPlaceholder title="Commandes" />} />
          <Route path="/payments" element={<ComingSoonPlaceholder title="Paiements" />} />
          <Route path="/stats" element={<ComingSoonPlaceholder title="Statistiques" />} />
          <Route path="/customers" element={<ComingSoonPlaceholder title="Clients" />} />
          <Route path="/settings" element={<ComingSoonPlaceholder title="Paramètres" />} />
          <Route path="*" element={<Navigate to="/dashboard\" replace />} />
        </Routes>
      </div>
    </div>
  );
};

// Placeholder component for sections not yet implemented
const ComingSoonPlaceholder = ({ title }: { title: string }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <div className="bg-orange-100 text-orange-800 inline-block px-3 py-1 rounded-full text-sm font-medium mb-4">
        Bientôt disponible
      </div>
      <p className="text-gray-600 max-w-md mx-auto">
        Cette fonctionnalité est en cours de développement et sera disponible prochainement. 
        Merci de votre patience !
      </p>
    </div>
  );
};

export default DashboardPage;