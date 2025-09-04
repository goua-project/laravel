// services/userService.ts
import axios from 'axios';

// Configuration de l'API - compatible avec tous les environnements
const API_BASE_URL = (() => {
  // Détection automatique de l'environnement
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // Pour la production, utiliser l'URL actuelle
  return `${window.location.origin}/api`;
})();

// Interface pour l'utilisateur tel que retourné par l'API
interface ApiUser {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  localite: string;
  pays: string;
  email: string;
  role: string;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  boutique: {
    id: number;
    nom: string;
    slug: string;
    categorie: string;
    status: string;
    is_active: boolean;
  } | null;
  abonnement: {
    id: number;
    date_debut: string;
    date_fin: string;
    statut: string;
    actif: boolean;
  } | null;
  plan: {
    id: number;
    nom: string;
    slug: string;
    prix: number;
    duree_mois: number;
    commission: number;
    limite_produits: number;
  } | null;
}

// Interface User corrigée pour être cohérente
export interface User {
  id: string;
  nom: string;
  prenom: string;
  name: string;
  email: string;
  telephone: string;
  localite: string;
  pays: string;
  role: string;
  is_active: boolean;
  registeredAt: string;
  created_at: string;
  boutique?: {
    id: number;
    nom: string;
    categorie: string;
    status: string;
    is_active: boolean;
  } | null;
  abonnement?: {
    statut: string;
    actif: boolean;
    date_fin: string;
  } | null;
  plan?: {
    nom: string;
    prix: number;
  } | null;
}

// Interface pour la création d'utilisateur (ajout du password)
export interface CreateUserData {
  nom: string;
  prenom: string;
  telephone: string;
  localite: string;
  pays: string;
  email: string;
  password: string;
  role: 'admin' | 'vendeur' | 'client';
  is_active: boolean;
}

// Fonction transformApiUser corrigée
const transformApiUser = (apiUser: ApiUser): User => ({
  id: apiUser.id.toString(),
  nom: apiUser.nom,
  prenom: apiUser.prenom,
  name: `${apiUser.prenom} ${apiUser.nom}`,
  email: apiUser.email,
  telephone: apiUser.telephone,
  localite: apiUser.localite,
  pays: apiUser.pays,
  role: apiUser.role,
  is_active: apiUser.is_active,
  registeredAt: apiUser.created_at,
  created_at: apiUser.created_at,
  boutique: apiUser.boutique ? {
    id: apiUser.boutique.id,
    nom: apiUser.boutique.nom,
    categorie: apiUser.boutique.categorie,
    status: apiUser.boutique.status,
    is_active: apiUser.boutique.is_active,
  } : null,
  abonnement: apiUser.abonnement ? {
    statut: apiUser.abonnement.statut,
    actif: apiUser.abonnement.actif,
    date_fin: apiUser.abonnement.date_fin,
  } : null,
  plan: apiUser.plan ? {
    nom: apiUser.plan.nom,
    prix: apiUser.plan.prix,
  } : null,
});

export interface UpdateUserData extends Partial<CreateUserData> {}

// Configuration axios
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Ajouter le token d'authentification à chaque requête
apiClient.interceptors.request.use((config) => {
  console.log('🔐 Recherche du token d\'authentification...');
  
  const token = localStorage.getItem('gouwadan_token') || 
                sessionStorage.getItem('gouwadan_token');
  
  console.log('Token trouvé:', token ? '[TOKEN PRÉSENT]' : '[AUCUN TOKEN]');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token ajouté aux headers');
  } else {
    console.warn('⚠️ Aucun token trouvé - La requête risque d\'échouer');
  }
  
  console.log('📡 Requête vers:', config.baseURL + config.url);
  return config;
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse API reçue:', response.status, response.data?.message || 'OK');
    return response;
  },
  (error) => {
    console.error('❌ Erreur API:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      console.log('🚨 Token invalide ou expiré - Nettoyage et redirection');
      
      localStorage.removeItem('gouwadan_token');
      localStorage.removeItem('gouwadan_user');
      sessionStorage.removeItem('gouwadan_token');
      sessionStorage.removeItem('gouwadan_user');
      
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

class UserService {
  // Récupérer tous les utilisateurs
  async getAllUsers(): Promise<{ users: User[]; total: number }> {
    console.log('📊 Récupération de tous les utilisateurs...');
    
    try {
      const response = await apiClient.get('/users');
      
      if (response.data.success) {
        const users = response.data.users.map(transformApiUser);
        console.log(`✅ ${users.length} utilisateurs récupérés sur ${response.data.total} total`);
        
        return {
          users,
          total: response.data.total
        };
      }
      
      throw new Error(response.data.message || 'Erreur lors de la récupération des utilisateurs');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la récupération des utilisateurs'
      );
    }
  }

  // Récupérer un utilisateur spécifique
  async getUserById(id: string): Promise<User> {
    console.log(`👤 Récupération de l'utilisateur ID: ${id}`);
    
    try {
      const response = await apiClient.get(`/users/${id}`);
      
      if (response.data.success) {
        const user = transformApiUser(response.data.user);
        console.log('✅ Utilisateur récupéré:', user.name);
        return user;
      }
      
      throw new Error(response.data.message || 'Utilisateur non trouvé');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la récupération de l\'utilisateur'
      );
    }
  }

  // Créer un nouvel utilisateur
  async createUser(userData: CreateUserData): Promise<User> {
    console.log('➕ Création d\'un nouvel utilisateur...', userData);
    
    try {
      const response = await apiClient.post('/users', userData);
      
      if (response.data.success) {
        const user = transformApiUser(response.data.user);
        console.log('✅ Utilisateur créé avec succès:', user.name);
        return user;
      }
      
      throw new Error(response.data.message || 'Erreur lors de la création');
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
        console.error('📝 Erreurs de validation:', validationErrors);
        throw new Error(validationErrors);
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la création de l\'utilisateur'
      );
    }
  }

  // Mettre à jour un utilisateur
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    console.log(`✏️ Mise à jour de l'utilisateur ID: ${id}`, userData);
    
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      
      if (response.data.success) {
        console.log('✅ Utilisateur mis à jour avec succès');
        return await this.getUserById(id);
      }
      
      throw new Error(response.data.message || 'Erreur lors de la mise à jour');
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour de l\'utilisateur:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
        console.error('📝 Erreurs de validation:', validationErrors);
        throw new Error(validationErrors);
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la mise à jour de l\'utilisateur'
      );
    }
  }

  // Supprimer un utilisateur
  async deleteUser(id: string): Promise<void> {
    console.log(`🗑️ Suppression de l'utilisateur ID: ${id}`);
    
    try {
      const response = await apiClient.delete(`/users/${id}`);
      
      if (response.data.success) {
        console.log('✅ Utilisateur supprimé avec succès');
      } else {
        throw new Error(response.data.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression de l\'utilisateur:', error);
      
      if (error.response?.status === 422) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la suppression de l\'utilisateur'
      );
    }
  }

  // Forcer la suppression d'un utilisateur (avec ses boutiques)
  async forceDeleteUser(id: string): Promise<void> {
    console.log(`💥 Suppression forcée de l'utilisateur ID: ${id}`);
    
    try {
      const response = await apiClient.delete(`/users/${id}/force`);
      
      if (response.data.success) {
        console.log('✅ Utilisateur supprimé avec force');
      } else {
        throw new Error(response.data.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression forcée:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la suppression de l\'utilisateur'
      );
    }
  }

  // Changer le statut d'un utilisateur
  async toggleUserStatus(id: string): Promise<User> {
    console.log(`🔄 Changement de statut pour l'utilisateur ID: ${id}`);
    
    try {
      const response = await apiClient.patch(`/users/${id}/toggle-status`);
      
      if (response.data.success) {
        console.log('✅ Statut utilisateur modifié avec succès');
        return await this.getUserById(id);
      }
      
      throw new Error(response.data.message || 'Erreur lors du changement de statut');
    } catch (error: any) {
      console.error('❌ Erreur lors du changement de statut:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors du changement de statut'
      );
    }
  }

  // Méthode pour vérifier si l'utilisateur admin est connecté
  isAuthenticated(): boolean {
    const token = localStorage.getItem('gouwadan_token');
    const user = localStorage.getItem('gouwadan_user');
    
    console.log('🔍 Vérification de l\'authentification:', {
      hasToken: !!token,
      hasUser: !!user
    });
    
    return !!(token && user);
  }

  // Méthode pour obtenir les informations de l'utilisateur connecté
  getCurrentUser(): any {
    try {
      const userData = localStorage.getItem('gouwadan_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  }
}

export const userService = new UserService();