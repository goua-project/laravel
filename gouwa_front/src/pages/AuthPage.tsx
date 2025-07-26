import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/auth/AuthForm';
import Container from '../components/common/Container';

const AuthPage = () => {
  const { authType } = useParams<{ authType: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (authType !== 'login' && authType !== 'register') {
    return <Navigate to="/auth/login\" replace />;
  }
  
  return (
    <div className="min-h-screen py-16 flex items-center">
      <Container size="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block">
            <div className="text-4xl font-bold mb-4">
              {authType === 'login' ? 'Bienvenue à nouveau !' : 'Rejoignez boutikplace'}
            </div>
            <p className="text-gray-600 mb-6">
              {authType === 'login'
                ? 'Connectez-vous pour accéder à votre boutique et gérer vos produits et commandes.'
                : 'Créez votre compte pour lancer votre boutique en ligne en quelques minutes.'}
            </p>
            <div className="bg-orange-100 p-4 rounded-lg border-l-4 border-orange-500">
              <h3 className="font-medium text-orange-800 mb-1">Pourquoi choisir boutikplace ?</h3>
              <ul className="list-disc pl-5 text-sm text-orange-700 space-y-1">
                <li>Mise en place simple et rapide</li>
                <li>Paiements sécurisés via Mobile Money, Wave</li>
                <li>Optimisation pour les moteurs de recherche</li>
                <li>Interface mobile-first pour tous les appareils</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center">
            <AuthForm type={authType as 'login' | 'register'} />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AuthPage;