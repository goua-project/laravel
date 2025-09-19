import ApiService from './apiService';

class SubscriptionService {
  constructor() {
    this.apiService = ApiService;
  }

  /**
   * Récupérer l'abonnement actuel de l'utilisateur
   */
  async getCurrentSubscription() {
    try {
      return await this.apiService.request('/user/subscription/current', {
        method: 'GET',
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'abonnement actuel:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des abonnements
   */
  async getSubscriptionHistory() {
    try {
      return await this.apiService.request('/user/subscription', {
        method: 'GET',
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des abonnements:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les plans disponibles (ADMIN)
   */
 async getAvailablePlans() {
  try {
    return await this.apiService.request('/admin/plans', {
      method: 'GET',
      includeAuth: false, // ← Désactivé temporairement
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des plans:', error);
    throw error;
  }
}

  /**
   * Créer un nouveau plan (ADMIN)
   */
  async createPlan(planData) {
    try {
      return await this.apiService.request('/admin/plans', {
        method: 'POST',
        data: planData,
        includeAuth: true,
      });
    } catch (error) {
      console.error('Erreur lors de la création du plan:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un plan (ADMIN)
   */
  async updatePlan(planId, planData) {
    try {
      return await this.apiService.request(`/admin/plans/${planId}`, {
        method: 'PUT',
        data: planData,
        includeAuth: true,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan:', error);
      throw error;
    }
  }

  /**
   * Supprimer un plan (ADMIN)
   */
  async deletePlan(planId) {
    try {
      return await this.apiService.request(`/admin/plans/${planId}`, {
        method: 'DELETE',
        includeAuth: true,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du plan:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les abonnements utilisateurs (ADMIN)
   */
  async getAllUserSubscriptions() {
    try {
      return await this.apiService.request('/admin/subscriptions', {
        method: 'GET',
        includeAuth: true,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Récupérer un plan spécifique par ID (PUBLIC)
   */
  async getPlanById(planId) {
    try {
      return await this.apiService.request(`/plans/${planId}`, {
        method: 'GET',
        includeAuth: false, // Route publique
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du plan:', error);
      throw error;
    }
  }

  /**
   * Récupérer un plan par slug (PUBLIC)
   */
  async getPlanBySlug(slug) {
    try {
      return await this.apiService.request(`/plans/slug/${slug}`, {
        method: 'GET',
        includeAuth: false, // Route publique
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du plan:', error);
      throw error;
    }
  }

  /**
   * Récupérer les plans publics (pour les utilisateurs non connectés)
   */
  async getPublicPlans() {
    try {
      return await this.apiService.request('/plans/public', {
        method: 'GET',
        includeAuth: false,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des plans publics:', error);
      throw error;
    }
  }

  /**
   * Comparer plusieurs plans
   */
  async comparePlans(planIds) {
    try {
      return await this.apiService.request('/plans/compare', {
        method: 'POST',
        data: { plan_ids: planIds },
        includeAuth: false, // Peut être public
      });
    } catch (error) {
      console.error('Erreur lors de la comparaison des plans:', error);
      throw error;
    }
  }

  /**
   * Calculer le prix pour une durée donnée
   */
  async calculatePrice(planId, dureeMois) {
    try {
      return await this.apiService.request(`/plans/${planId}/calculate-price`, {
        method: 'POST',
        data: { duree_mois: dureeMois },
        includeAuth: false,
      });
    } catch (error) {
      console.error('Erreur lors du calcul du prix:', error);
      throw error;
    }
  }

  /**
   * Obtenir les recommandations de plans
   */
  async getRecommendations() {
    try {
      return await this.apiService.request('/plans/recommendations', {
        method: 'GET',
        includeAuth: true, // Requiert une authentification pour personnaliser
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      throw error;
    }
  }

  /**
   * Méthodes utilitaires pour formater les données d'abonnement
   */
  static formatSubscriptionData(subscription) {
    if (!subscription) return null;

    return {
      id: subscription.id,
      plan: subscription.plan,
      date_debut: subscription.date_debut,
      date_fin: subscription.date_fin,
      statut: subscription.statut,
      is_active: subscription.is_active,
      reference_paiement: subscription.reference_paiement,
      days_remaining: subscription.days_remaining
    };
  }

  /**
   * Calculer les jours restants
   */
  static calculateDaysRemaining(endDate) {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Vérifier si l'abonnement expire bientôt
   */
  static isExpiringSoon(subscription, daysThreshold = 7) {
    if (!subscription || !subscription.date_fin) return false;
    
    const daysRemaining = this.calculateDaysRemaining(subscription.date_fin);
    return daysRemaining !== null && daysRemaining <= daysThreshold;
  }

  /**
   * Vérifier si l'utilisateur a un plan premium
   */
  static isPremiumPlan(subscription) {
    return subscription && subscription.plan && !subscription.plan.is_free;
  }

  /**
   * Obtenir le niveau de criticité de l'expiration
   */
  static getExpirationLevel(subscription) {
    if (!subscription || !subscription.date_fin) return 'none';
    
    const daysRemaining = this.calculateDaysRemaining(subscription.date_fin);
    
    if (daysRemaining === null) return 'none';
    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= 3) return 'critical';
    if (daysRemaining <= 7) return 'warning';
    if (daysRemaining <= 14) return 'notice';
    
    return 'normal';
  }
}

export default new SubscriptionService();