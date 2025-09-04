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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('gouwadan_token');
    const userData = localStorage.getItem('gouwadan_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Vérifier si l'utilisateur est un admin avant de le connecter automatiquement
        if (parsedUser.role === 'Administrateur') {
          setUser(parsedUser);
        } else {
          // Si ce n'est pas un admin, supprimer les données de connexion
          localStorage.removeItem('gouwadan_token');
          localStorage.removeItem('gouwadan_user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('gouwadan_token');
        localStorage.removeItem('gouwadan_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulation d'appel API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Vérification des identifiants administrateur
    if (email === 'admin@gouwadan.bj' && password === 'admin123') {
      const mockUser: User = {
        id: '1',
        name: 'Admin Gouwadan',
        email: 'admin@gouwadan.bj',
        role: 'Administrateur',
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
      };
      
      setUser(mockUser);
      localStorage.setItem('gouwadan_token', 'mock-jwt-token');
      localStorage.setItem('gouwadan_user', JSON.stringify(mockUser));
      setIsLoading(false);
      return true;
    }
    
    // Autres utilisateurs (non administrateurs) ne peuvent pas se connecter
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gouwadan_token');
    localStorage.removeItem('gouwadan_user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Administrateur',
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