// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fonction pour traiter les éléments en attente dans le panier
  const handlePendingCartItems = async () => {
    const pendingCartItem = sessionStorage.getItem('pendingCartItem');
    if (pendingCartItem) {
      try {
        const { product, quantity, storeInfo } = JSON.parse(pendingCartItem);
        
        // Dynamically import the CartContext to avoid circular dependencies
        const { useCart } = await import('./CartContext');
        
        // Note: We can't use useCart hook here as we're not in a component
        // Instead, we'll dispatch a custom event that components can listen to
        const event = new CustomEvent('addPendingCartItem', {
          detail: { product, quantity, storeInfo }
        });
        window.dispatchEvent(event);
        
        sessionStorage.removeItem('pendingCartItem');
        console.log('Produit ajouté au panier après connexion');
        
      } catch (error) {
        console.error('Erreur lors de l\'ajout du produit en attente:', error);
        sessionStorage.removeItem('pendingCartItem');
      }
    }
  };

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const response = await apiService.getCurrentUser();
          setUser(response.user);
          setIsAuthenticated(true);
          
          // Traiter les éléments en attente après vérification de l'auth
          await handlePendingCartItems();
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        // Token invalide, le supprimer
        apiService.removeToken();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Traiter les éléments en attente après connexion réussie
      await handlePendingCartItems();
      
      return response;
    } catch (error) {
      // Propager l'erreur telle quelle pour préserver les détails de validation
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Traiter les éléments en attente après inscription réussie
      await handlePendingCartItems();
      
      return response;
    } catch (error) {
      // Propager l'erreur telle quelle pour préserver les détails de validation
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer les éléments en attente lors de la déconnexion
      sessionStorage.removeItem('pendingCartItem');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Fonction pour vérifier si un élément est en attente
  const hasPendingCartItem = () => {
    return sessionStorage.getItem('pendingCartItem') !== null;
  };

  // Fonction pour obtenir l'élément en attente
  const getPendingCartItem = () => {
    const pendingItem = sessionStorage.getItem('pendingCartItem');
    return pendingItem ? JSON.parse(pendingItem) : null;
  };

  // Fonction pour supprimer l'élément en attente
  const clearPendingCartItem = () => {
    sessionStorage.removeItem('pendingCartItem');
  };

  // Fonction pour mettre à jour le profil utilisateur
  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    handlePendingCartItems,
    hasPendingCartItem,
    getPendingCartItem,
    clearPendingCartItem,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};