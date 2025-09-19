// Importez votre instance API configurée ici
// import api from './api'; // Remplacez par le chemin correct vers votre instance API

const API_BASE_URL = 'http://localhost:8000/api';

class AdminSubscriptionService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ==================== GESTION DES PLANS D'ABONNEMENT ====================

  /**
   * Obtenir tous les plans d'abonnement
   */
  async getAllPlans() {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data || data, 
        data.message || 'Plans récupérés avec succès');
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Obtenir un plan d'abonnement spécifique
   */
  async getPlan(planId) {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-plans/${planId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Plan récupéré avec succès');
    } catch (error) {
      console.error('Erreur lors de la récupération du plan:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Créer un nouveau plan d'abonnement
   */
  async createPlan(planData) {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Plan créé avec succès');
    } catch (error) {
      console.error('Erreur lors de la création du plan:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Mettre à jour un plan d'abonnement
   */
  async updatePlan(planId, planData) {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Plan mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Supprimer un plan d'abonnement
   */
  async deletePlan(planId) {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, null, 
        data.message || 'Plan supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du plan:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Activer/Désactiver un plan d'abonnement
   */
  async togglePlanStatus(planId, isActive) {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-plans/${planId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || `Plan ${isActive ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error('Erreur lors du changement de statut du plan:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  // ==================== GESTION DES ABONNEMENTS UTILISATEURS ====================

  /**
   * Obtenir tous les abonnements utilisateurs
   */
  async getAllUserSubscriptions(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data || data, 
        data.message || 'Abonnements récupérés avec succès');
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Obtenir les détails d'un abonnement spécifique
   */
  async getSubscriptionDetails(subscriptionId) {
    try {
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Détails de l\'abonnement récupérés');
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Obtenir les abonnements d'un utilisateur spécifique
   */
  async getUserSubscriptions(userId) {
    try {
      const response = await fetch(`${this.baseURL}/admin/users/${userId}/subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data || data, 
        data.message || 'Abonnements utilisateur récupérés');
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements utilisateur:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Créer un abonnement manuel pour un utilisateur
   */
  async createManualSubscription(subscriptionData) {
    try {
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Abonnement manuel créé avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de l\'abonnement manuel:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(subscriptionId, reason = '') {
    try {
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Abonnement annulé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Réactiver un abonnement
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/${subscriptionId}/reactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Abonnement réactivé avec succès');
    } catch (error) {
      console.error('Erreur lors de la réactivation de l\'abonnement:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Prolonger un abonnement
   */
  async extendSubscription(subscriptionId, extensionData) {
    try {
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/${subscriptionId}/extend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(extensionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Abonnement prolongé avec succès');
    } catch (error) {
      console.error('Erreur lors de la prolongation de l\'abonnement:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Modifier le plan d'un abonnement existant
   */
  async changeSubscriptionPlan(subscriptionId, planId, effectiveDate = null) {
    try {
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/${subscriptionId}/change-plan`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          effective_date: effectiveDate
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Plan d\'abonnement modifié avec succès');
    } catch (error) {
      console.error('Erreur lors du changement de plan:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  // ==================== STATISTIQUES ET ANALYTICS ====================

  /**
   * Obtenir les statistiques des abonnements
   */
  async getSubscriptionStats(period = '30d') {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-stats?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Statistiques récupérées');
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Obtenir les revenus des abonnements
   */
  async getSubscriptionRevenue(period = 'month', startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await fetch(`${this.baseURL}/admin/subscription-revenue?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Revenus récupérés');
    } catch (error) {
      console.error('Erreur lors de la récupération des revenus:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Obtenir les métriques de performance des plans
   */
  async getPlanMetrics() {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-plans/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Métriques récupérées');
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  // ==================== RECHERCHE ET FILTRES ====================

  /**
   * Rechercher des abonnements
   */
  async searchSubscriptions(query, filters = {}, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data || data, 
        data.message || 'Recherche effectuée');
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Obtenir les abonnements expirants
   */
  async getExpiringSubscriptions(days = 7) {
    try {
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/expiring?days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data || data, 
        data.message || 'Abonnements expirants récupérés');
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements expirants:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  // ==================== EXPORT ET RAPPORTS ====================

  /**
   * Exporter les données d'abonnements
   */
  async exportSubscriptions(format = 'csv', filters = {}) {
    try {
      const params = new URLSearchParams({
        format: format,
        ...filters
      });
      
      const response = await fetch(`${this.baseURL}/admin/subscription-export?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return this.formatResponse(true, blob, 'Export généré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Générer un rapport d'abonnements
   */
  async generateSubscriptionReport(reportType = 'monthly', filters = {}) {
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...filters
      });
      
      const response = await fetch(`${this.baseURL}/admin/subscription-reports?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Rapport généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  // ==================== NOTIFICATIONS ET COMMUNICATIONS ====================

  /**
   * Envoyer une notification à tous les abonnés d'un plan
   */
  async notifyPlanSubscribers(planId, notificationData) {
    try {
      const response = await fetch(`${this.baseURL}/admin/subscription-plans/${planId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Notifications envoyées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  /**
   * Envoyer un rappel d'expiration
   */
  async sendExpirationReminders() {
    try {
      const response = await fetch(`${this.baseURL}/admin/user-subscriptions/send-expiration-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResponse(true, data.data, 
        data.message || 'Rappels d\'expiration envoyés');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des rappels:', error);
      return this.formatResponse(false, null, this.getErrorMessage(error));
    }
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Obtenir le token d'authentification
   */
  getToken() {
    // Remplacez par votre méthode de récupération du token
    return localStorage.getItem('auth_token') || '';
  }

  /**
   * Formater la réponse de manière consistante
   */
  formatResponse(success, data, message) {
    return {
      success,
      data,
      message
    };
  }

  /**
   * Gérer les erreurs de réponse API
   */
  handleError(error) {
    if (error.response?.status === 403) {
      // Redirection optionnelle vers la page de connexion
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Accès non autorisé. Veuillez vous connecter en tant qu\'administrateur.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    
    throw error;
  }

  /**
   * Obtenir le message d'erreur approprié
   */
  getErrorMessage(error) {
    // Messages d'erreur basés sur le code de statut HTTP pour fetch
    if (error.message.includes('HTTP error! status:')) {
      const status = parseInt(error.message.split('status: ')[1]);
      
      const statusMessages = {
        400: 'Données invalides. Veuillez vérifier votre saisie.',
        401: 'Session expirée. Veuillez vous reconnecter.',
        403: 'Accès non autorisé. Droits administrateur requis.',
        404: 'Ressource non trouvée.',
        409: 'Conflit détecté. La ressource existe déjà.',
        422: 'Données non valides. Veuillez corriger les erreurs.',
        429: 'Trop de requêtes. Veuillez patienter.',
        500: 'Erreur serveur interne. Veuillez réessayer plus tard.',
        502: 'Service temporairement indisponible.',
        503: 'Service en maintenance. Veuillez réessayer plus tard.'
      };
      
      if (statusMessages[status]) {
        return statusMessages[status];
      }
    }
    
    // Messages d'erreur réseau
    if (error.message.includes('Failed to fetch') || error.name === 'NetworkError') {
      return 'Erreur de connexion. Veuillez vérifier votre connexion internet.';
    }
    
    if (error.name === 'TimeoutError') {
      return 'Délai d\'attente dépassé. Veuillez réessayer.';
    }
    
    // Message d'erreur générique
    return error.message || 'Une erreur inattendue s\'est produite.';
  }

  /**
   * Valider les données avant envoi
   */
  validatePlanData(planData) {
    const errors = [];
    
    if (!planData.nom || planData.nom.trim() === '') {
      errors.push('Le nom du plan est requis');
    }
    
    if (!planData.prix || planData.prix < 0) {
      errors.push('Le prix doit être supérieur ou égal à 0');
    }
    
    if (!planData.duration || planData.duration <= 0) {
      errors.push('La durée doit être supérieure à 0');
    }
    
    return errors;
  }

  /**
   * Valider les données d'abonnement
   */
  validateSubscriptionData(subscriptionData) {
    const errors = [];
    
    if (!subscriptionData.user_id) {
      errors.push('L\'ID utilisateur est requis');
    }
    
    if (!subscriptionData.plan_id) {
      errors.push('L\'ID du plan est requis');
    }
    
    if (subscriptionData.start_date && new Date(subscriptionData.start_date) < new Date()) {
      errors.push('La date de début ne peut pas être antérieure à aujourd\'hui');
    }
    
    return errors;
  }
}

// Export d'une instance unique (Singleton)
export default new AdminSubscriptionService();