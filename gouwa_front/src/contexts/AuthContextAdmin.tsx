import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// CONFIGURATION DE L'API - POINT IMPORTANT !
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://votre-domaine.com/api' 
  : 'http://localhost:8000/api'; // URL de Laravel, PAS de Vite !

console.log('🔧 Configuration API_BASE_URL:', API_BASE_URL);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 Initialisation du AuthProvider...');
    
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const token = localStorage.getItem('gouwadan_token');
    const userData = localStorage.getItem('gouwadan_user');
    
    console.log('🔍 Vérification de l\'état d\'authentification au démarrage:');
    console.log('  - Token présent:', !!token);
    console.log('  - User data présent:', !!userData);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('👤 Données utilisateur récupérées:', parsedUser);
        
        // Vérifier si le token est encore valide en faisant une requête à l'API admin
        verifyToken(token).then(isValid => {
          console.log('✅ Vérification du token:', isValid ? 'VALIDE' : 'INVALIDE');
          
          if (isValid && parsedUser.role === 'admin') {
            console.log('🎉 Utilisateur admin authentifié automatiquement');
            setUser(parsedUser);
          } else {
            console.log('❌ Token invalide ou utilisateur non admin - Nettoyage du localStorage');
            localStorage.removeItem('gouwadan_token');
            localStorage.removeItem('gouwadan_user');
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error('❌ Erreur lors du parsing des données utilisateur:', error);
        localStorage.removeItem('gouwadan_token');
        localStorage.removeItem('gouwadan_user');
        setIsLoading(false);
      }
    } else {
      console.log('ℹ️ Aucune session précédente trouvée');
      setIsLoading(false);
    }
  }, []);

  // Fonction pour vérifier la validité du token admin
  const verifyToken = async (token: string): Promise<boolean> => {
    console.log('🔐 Vérification du token admin...');
    
    try {
      const url = `${API_BASE_URL}/admin/auth/verify`;
      console.log('📡 URL de vérification:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('📨 Réponse de vérification:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.status === 403) {
        console.log('🚫 Accès non autorisé (utilisateur n\'est pas admin)');
        return false;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token valide, données reçues:', data);
        return true;
      } else {
        console.log('❌ Token invalide');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du token:', error);
      console.error('  - Type d\'erreur:', error instanceof TypeError ? 'TypeError (problème réseau)' : typeof error);
      console.error('  - Message:', error.message);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🚀 === DÉBUT DE LA TENTATIVE DE CONNEXION ADMIN ===');
    console.log('📧 Email:', email);
    console.log('🔒 Mot de passe:', password ? `[FOURNI - ${password.length} caractères]` : '[MANQUANT]');
    console.log('🌐 Environnement:', process.env.NODE_ENV);
    console.log('🔗 API Base URL:', API_BASE_URL);
    
    setIsLoading(true);
    
    try {
      const url = `${API_BASE_URL}/admin/auth/login`;
      console.log('📡 URL complète de connexion:', url);
      
      const requestBody = { email, password };
      console.log('📤 Corps de la requête:', requestBody);
      
      console.log('⏳ Envoi de la requête fetch...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📨 === RÉPONSE DU SERVEUR ===');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - OK:', response.ok);
      console.log('  - URL finale:', response.url);
      console.log('  - Type:', response.type);
      console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        console.log('✅ Réponse OK - Parsing des données...');
        const data = await response.json();
        console.log('📊 Données admin reçues:', data);
        
        const userData = {
          id: data.user.id.toString(),
          name: `${data.user.firstName} ${data.user.lastName}`,
          email: data.user.email,
          role: data.user.role,
          avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
        };
        
        console.log('👤 Données utilisateur formatées:', userData);
        console.log('🔑 Token reçu:', data.token ? '[TOKEN PRÉSENT]' : '[AUCUN TOKEN]');
        
        setUser(userData);
        localStorage.setItem('gouwadan_token', data.token);
        localStorage.setItem('gouwadan_user', JSON.stringify(userData));
        setIsLoading(false);
        
        console.log('🎉 === CONNEXION ADMIN RÉUSSIE ===');
        return true;
      } else {
        console.log('❌ === ERREUR DE CONNEXION ===');
        console.log('Status:', response.status);
        
        // Erreur de connexion - Logs détaillés
        let errorData;
        try {
          errorData = await response.json();
          console.log('📋 Données d\'erreur parsées:', errorData);
        } catch (parseError) {
          console.error('❌ Impossible de parser la réponse d\'erreur:', parseError);
          errorData = {};
        }
        
        // Messages d'erreur détaillés
        let errorMessage = 'Erreur inconnue';
        let errorTitle = 'Erreur de connexion';
        
        switch (response.status) {
          case 401:
            errorTitle = 'Identifiants incorrects';
            errorMessage = errorData.message || 'Email ou mot de passe incorrect';
            console.log('🔐 === ERREUR 401: IDENTIFIANTS INCORRECTS ===');
            console.log('  - Message serveur:', errorData.message);
            break;
            
          case 403:
            errorTitle = 'Accès refusé';
            errorMessage = errorData.message || 'Accès réservé aux administrateurs';
            console.log('🚫 === ERREUR 403: ACCÈS REFUSÉ ===');
            console.log('  - Raison: Utilisateur pas admin ou compte désactivé');
            console.log('  - Message serveur:', errorData.message);
            break;
            
          case 404:
            errorTitle = 'Service non trouvé';
            errorMessage = 'L\'API d\'authentification n\'est pas accessible. Vérifiez que le serveur Laravel est démarré sur le port 8000.';
            console.log('🔍 === ERREUR 404: API NON TROUVÉE ===');
            console.log('  - URL appelée:', url);
            console.log('  - Vérifiez que Laravel fonctionne sur http://localhost:8000');
            console.log('  - Commande: php artisan serve');
            break;
            
          case 422:
            errorTitle = 'Données invalides';
            errorMessage = 'Les données saisies ne sont pas valides';
            console.log('📝 === ERREUR 422: VALIDATION ÉCHOUÉE ===');
            if (errorData.errors) {
              console.log('  - Erreurs de validation:', errorData.errors);
            }
            break;
            
          case 500:
            errorTitle = 'Erreur serveur';
            errorMessage = 'Une erreur est survenue sur le serveur Laravel';
            console.log('💥 === ERREUR 500: ERREUR SERVEUR ===');
            console.log('  - Vérifiez les logs Laravel');
            console.log('  - Message:', errorData.message);
            break;
            
          default:
            errorMessage = errorData.message || `Erreur HTTP ${response.status}`;
            console.log(`❓ === ERREUR ${response.status}: ${response.statusText} ===`);
            console.log('  - Message:', errorMessage);
        }
        
        console.log('🚨 Affichage de l\'erreur à l\'utilisateur:', errorTitle, '-', errorMessage);
        showError(errorTitle, errorMessage);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.log('💥 === ERREUR CATCH ===');
      console.error('Type d\'erreur:', error.constructor.name);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('🌐 === ERREUR RÉSEAU ===');
        console.log('  - Le serveur Laravel n\'est probablement pas accessible');
        console.log('  - Vérifiez que Laravel fonctionne: php artisan serve');
        console.log('  - URL tentée:', `${API_BASE_URL}/admin/auth/login`);
        
        showError(
          'Erreur de connexion', 
          'Impossible de se connecter au serveur. Vérifiez que le serveur Laravel est démarré sur le port 8000.'
        );
      } else {
        console.log('❓ === ERREUR INCONNUE ===');
        showError('Erreur', 'Une erreur inattendue s\'est produite');
      }
      
      setIsLoading(false);
      return false;
    }
  };

  const showError = (title: string, message: string) => {
    console.error(`🚨 ${title}: ${message}`);
    // Vous pouvez utiliser un système de notification ici
    // Pour l'instant, utilisation d'une alerte simple
    alert(`${title}\n\n${message}`);
  };

  const logout = () => {
    console.log('🚪 === DÉCONNEXION ADMIN ===');
    
    const token = localStorage.getItem('gouwadan_token');
    console.log('Token pour déconnexion:', token ? '[PRÉSENT]' : '[ABSENT]');
    
    // Appeler l'API de déconnexion admin
    if (token) {
      console.log('📡 Appel de l\'API de déconnexion...');
      
      fetch(`${API_BASE_URL}/admin/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      .then(response => {
        console.log('📨 Réponse de déconnexion:', response.status);
      })
      .catch(error => {
        console.error('❌ Erreur lors de l\'appel de déconnexion:', error);
      });
    }
    
    console.log('🧹 Nettoyage des données locales...');
    setUser(null);
    localStorage.removeItem('gouwadan_token');
    localStorage.removeItem('gouwadan_user');
    console.log('✅ Déconnexion terminée');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};