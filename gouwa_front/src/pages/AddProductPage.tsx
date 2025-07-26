import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Container from '../components/common/Container';
import ProductForm from '../components/store/ProductForm';

const AddProductPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login?redirect=add-product" replace />;
  }
  
  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <Container size="md">
        <ProductForm />
      </Container>
    </div>
  );
};

export default AddProductPage;