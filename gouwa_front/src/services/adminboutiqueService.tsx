// services/boutiqueService.ts
// services/boutiqueService.ts
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

// Interface pour les filtres de boutiques
interface BoutiqueFilters {
  status?: 'active' | 'inactive';
  categorie?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Interface pour les données de boutique
interface BoutiqueData {
  nom: string;
  slogan?: string;
  description: string;
  categorie: string;
  type: 'physical' | 'digital' | 'service';
  couleur_accent: string;
  mots_cles?: string;
  is_active?: boolean;
  status?: 'active' | 'inactive';
}

// Interface pour les données d'abonnement
interface SubscriptionData {
  plan_id: string;
  date_debut: string;
  date_fin: string;
  statut: 'actif' | 'expire' | 'annule';
  actif?: boolean;
}

// Interface pour les statistiques
interface BoutiqueStatistics {
  total_produits: number;
  produits_actifs: number;
  chiffre_affaires_total: number;
  commandes_total: number;
  commandes_livrees: number;
  taux_conversion: number;
  produits_par_categorie: Array<{
    categorie: string;
    total: number;
  }>;
  evolution_ventes: Array<{
    date: string;
    total: number;
  }>;
}

// Interface Boutique pour le frontend
export interface Boutique {
  id: string;
  nom: string;
  slogan?: string;
  description: string;
  categorie: string;
  type: 'physical' | 'digital' | 'service';
  couleur_accent: string;
  mots_cles?: string;
  is_active: boolean;
  status: 'active' | 'inactive';
  logo?: string;
  slug: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  abonnements?: Array<{
    id: number;
    date_debut: string;
    date_fin: string;
    statut: string;
    actif: boolean;
    plan: {
      nom: string;
      prix: number;
    };
  }>;
  total_produits?: number;
  produits_actifs?: number;
}

// Interface pour la boutique telle que retournée par l'API
interface ApiBoutique {
  id: number;
  nom: string;
  slogan?: string;
  description: string;
  categorie: string;
  type: 'physical' | 'digital' | 'service';
  couleur_accent: string;
  mots_cles?: string;
  is_active: boolean;
  status: 'active' | 'inactive';
  logo?: string;
  slug: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  abonnements?: Array<{
    id: number;
    date_debut: string;
    date_fin: string;
    statut: string;
    actif: boolean;
    plan: {
      nom: string;
      prix: number;
    };
  }>;
  total_produits?: number;
  produits_actifs?: number;
}

// Fonction pour transformer les données API
const transformApiBoutique = (apiBoutique: ApiBoutique): Boutique => ({
  id: apiBoutique.id.toString(),
  nom: apiBoutique.nom,
  slogan: apiBoutique.slogan,
  description: apiBoutique.description,
  categorie: apiBoutique.categorie,
  type: apiBoutique.type,
  couleur_accent: apiBoutique.couleur_accent,
  mots_cles: apiBoutique.mots_cles,
  is_active: apiBoutique.is_active,
  status: apiBoutique.status,
  logo: apiBoutique.logo,
  slug: apiBoutique.slug,
  created_at: apiBoutique.created_at,
  updated_at: apiBoutique.updated_at,
  user: apiBoutique.user,
  abonnements: apiBoutique.abonnements,
  total_produits: apiBoutique.total_produits,
  produits_actifs: apiBoutique.produits_actifs,
});

export interface UpdateBoutiqueData extends Partial<BoutiqueData> {}

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

class BoutiqueService {
  // Récupérer toutes les boutiques avec filtres
  async getBoutiques(filters: BoutiqueFilters = {}): Promise<{ boutiques: Boutique[]; total: number; categories: string[] }> {
    console.log('🏪 Récupération des boutiques avec filtres:', filters);
    
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/boutiques?${params}`);
      
      if (response.data.success) {
        const boutiques = response.data.boutiques.data.map(transformApiBoutique);
        console.log(`✅ ${boutiques.length} boutiques récupérées sur ${response.data.total} total`);
        
        return {
          boutiques,
          total: response.data.total,
          categories: response.data.categories || []
        };
      }
      
      throw new Error(response.data.message || 'Erreur lors de la récupération des boutiques');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des boutiques:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la récupération des boutiques'
      );
    }
  }

  // Récupérer une boutique spécifique
  async getBoutique(id: string): Promise<{ boutique: Boutique; statistiques: BoutiqueStatistics }> {
    console.log(`🏪 Récupération de la boutique ID: ${id}`);
    
    try {
      const response = await apiClient.get(`/boutiques/${id}`);
      
      if (response.data.success) {
        const boutique = transformApiBoutique(response.data.boutique);
        console.log('✅ Boutique récupérée:', boutique.nom);
        
        return {
          boutique,
          statistiques: response.data.statistiques
        };
      }
      
      throw new Error(response.data.message || 'Boutique non trouvée');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération de la boutique:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la récupération de la boutique'
      );
    }
  }

  // Mettre à jour une boutique
  async updateBoutique(id: string, data: UpdateBoutiqueData): Promise<Boutique> {
    console.log(`✏️ Mise à jour de la boutique ID: ${id}`, data);
    
    try {
      const response = await apiClient.put(`/boutiques/${id}`, data);
      
      if (response.data.success) {
        const boutique = transformApiBoutique(response.data.boutique);
        console.log('✅ Boutique mise à jour avec succès:', boutique.nom);
        return boutique;
      }
      
      throw new Error(response.data.message || 'Erreur lors de la mise à jour');
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour de la boutique:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
        console.error('📝 Erreurs de validation:', validationErrors);
        throw new Error(validationErrors);
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la mise à jour de la boutique'
      );
    }
  }

  // Basculer le statut d'une boutique
  async toggleStatus(id: string): Promise<Boutique> {
    console.log(`🔄 Changement de statut pour la boutique ID: ${id}`);
    
    try {
      const response = await apiClient.post(`/boutiques/${id}/toggle-status`);
      
      if (response.data.success) {
        const boutique = transformApiBoutique(response.data.boutique);
        console.log('✅ Statut boutique modifié avec succès');
        return boutique;
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

  // Mettre à jour le logo d'une boutique
  async updateLogo(id: string, logoFile: File): Promise<{ logo_url: string }> {
    console.log(`🖼️ Mise à jour du logo pour la boutique ID: ${id}`);
    
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await apiClient.post(`/boutiques/${id}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        console.log('✅ Logo mis à jour avec succès');
        return { logo_url: response.data.logo_url };
      }
      
      throw new Error(response.data.message || 'Erreur lors de la mise à jour du logo');
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour du logo:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
        console.error('📝 Erreurs de validation:', validationErrors);
        throw new Error(validationErrors);
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la mise à jour du logo'
      );
    }
  }

  // Récupérer les statistiques d'une boutique
  async getStatistics(id: string): Promise<BoutiqueStatistics> {
    console.log(`📊 Récupération des statistiques pour la boutique ID: ${id}`);
    
    try {
      const response = await apiClient.get(`/boutiques/${id}/statistics`);
      
      if (response.data.success) {
        console.log('✅ Statistiques récupérées avec succès');
        return response.data.statistiques;
      }
      
      throw new Error(response.data.message || 'Erreur lors de la récupération des statistiques');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la récupération des statistiques'
      );
    }
  }

  // Récupérer les abonnements d'une boutique
  async getSubscriptions(id: string): Promise<any[]> {
    console.log(`📋 Récupération des abonnements pour la boutique ID: ${id}`);
    
    try {
      const response = await apiClient.get(`/boutiques/${id}/subscriptions`);
      
      if (response.data.success) {
        console.log('✅ Abonnements récupérés avec succès');
        return response.data.abonnements;
      }
      
      throw new Error(response.data.message || 'Erreur lors de la récupération des abonnements');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des abonnements:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la récupération des abonnements'
      );
    }
  }

  // Mettre à jour un abonnement
  async updateSubscription(boutiqueId: string, abonnementId: string, data: Partial<SubscriptionData>): Promise<any> {
    console.log(`✏️ Mise à jour de l'abonnement ID: ${abonnementId} pour la boutique ID: ${boutiqueId}`, data);
    
    try {
      const response = await apiClient.put(`/boutiques/${boutiqueId}/subscriptions/${abonnementId}`, data);
      
      if (response.data.success) {
        console.log('✅ Abonnement mis à jour avec succès');
        return response.data.abonnement;
      }
      
      throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'abonnement');
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour de l\'abonnement:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
        console.error('📝 Erreurs de validation:', validationErrors);
        throw new Error(validationErrors);
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la mise à jour de l\'abonnement'
      );
    }
  }

  // Créer un nouvel abonnement
  async createSubscription(id: string, data: SubscriptionData): Promise<any> {
    console.log(`➕ Création d'un nouvel abonnement pour la boutique ID: ${id}`, data);
    
    try {
      const response = await apiClient.post(`/boutiques/${id}/subscriptions`, data);
      
      if (response.data.success) {
        console.log('✅ Abonnement créé avec succès');
        return response.data.abonnement;
      }
      
      throw new Error(response.data.message || 'Erreur lors de la création de l\'abonnement');
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de l\'abonnement:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
        console.error('📝 Erreurs de validation:', validationErrors);
        throw new Error(validationErrors);
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la création de l\'abonnement'
      );
    }
  }

  // Supprimer une boutique
  async deleteBoutique(id: string): Promise<void> {
    console.log(`🗑️ Suppression de la boutique ID: ${id}`);
    
    try {
      const response = await apiClient.delete(`/boutiques/${id}`);
      
      if (response.data.success) {
        console.log('✅ Boutique supprimée avec succès');
      } else {
        throw new Error(response.data.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression de la boutique:', error);
      
      if (error.response?.status === 422) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la suppression de la boutique'
      );
    }
  }

  // Forcer la suppression d'une boutique
  async forceDeleteBoutique(id: string): Promise<void> {
    console.log(`💥 Suppression forcée de la boutique ID: ${id}`);
    
    try {
      const response = await apiClient.delete(`/boutiques/${id}/force`);
      
      if (response.data.success) {
        console.log('✅ Boutique supprimée avec force');
      } else {
        throw new Error(response.data.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression forcée:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la suppression de la boutique'
      );
    }
  }

  // Récupérer les produits d'une boutique
  async getProducts(id: string, filters: { 
    status?: string; 
    categorie?: string; 
    per_page?: number;
    page?: number;
  } = {}): Promise<{ produits: any[]; total: number }> {
    console.log(`📦 Récupération des produits pour la boutique ID: ${id}`, filters);
    
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get(`/boutiques/${id}/products?${params}`);
      
      if (response.data.success) {
        console.log(`✅ ${response.data.produits.data.length} produits récupérés sur ${response.data.total} total`);
        
        return {
          produits: response.data.produits.data,
          total: response.data.total
        };
      }
      
      throw new Error(response.data.message || 'Erreur lors de la récupération des produits');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des produits:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erreur lors de la récupération des produits'
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

export const boutiqueService = new BoutiqueService();