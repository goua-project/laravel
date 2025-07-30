import api from './apiService';

class StatsService {
  
  /**
   * Enregistrer une visite de boutique
   * @param {string} boutiqueSlug - Le slug de la boutique
   * @returns {Promise} - Response de l'API
   */
  static async recordView(boutiqueSlug) {
    try {
      const response = await api.post(`/api/boutiques/stats/record-view/${boutiqueSlug}`, {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la visite:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques complètes d'une boutique
   * @param {number} boutiqueId - L'ID de la boutique
   * @param {string} period - La période (today, week, month, year)
   * @returns {Promise} - Les statistiques complètes de la boutique
   */
  static async getBoutiqueStats(boutiqueId, period = 'month') {
    try {
      const response = await api.get(`/api/boutiques/stats/${boutiqueId}`, {
        params: { period },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques simples pour le dashboard
   * @param {number} boutiqueId - L'ID de la boutique
   * @param {string} period - La période
   * @returns {Promise} - Les statistiques simplifiées
   */
  static async getDashboardStats(boutiqueId, period = 'month') {
    try {
      const response = await api.get(`/api/boutiques/stats/dashboard/${boutiqueId}`, {
        params: { period },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques de toutes les boutiques de l'utilisateur
   * @param {string} period - La période
   * @returns {Promise} - Les statistiques de toutes les boutiques
   */
  static async getAllBoutiquesStats(period = 'month') {
    try {
      const response = await api.get('/api/boutiques/stats/all', {
        params: { period },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les statistiques:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Gérer les erreurs de l'API
   * @param {Error} error - L'erreur de l'API
   */
  static handleApiError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expiré ou invalide
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Accès refusé:', data.message);
          break;
        case 404:
          console.error('Ressource non trouvée:', data.message);
          break;
        case 422:
          console.error('Données invalides:', data.errors || data.message);
          break;
        case 500:
          console.error('Erreur serveur:', data.message);
          break;
        default:
          console.error('Erreur inconnue:', data.message || error.message);
      }
    } else if (error.request) {
      console.error('Erreur réseau:', error.message);
    } else {
      console.error('Erreur:', error.message);
    }
  }

  /**
   * Formater les données pour les graphiques
   * @param {Array} chartData - Les données brutes du graphique
   * @returns {Array} - Les données formatées
   */
  static formatChartData(chartData) {
    if (!Array.isArray(chartData)) {
      return [];
    }

    return chartData.map(item => ({
      date: item.date,
      views: parseInt(item.views) || 0,
      unique_views: parseInt(item.unique_views) || 0,
      formatted_date: item.formatted_date || this.formatDate(item.date),
    }));
  }

  /**
   * Formater une date pour l'affichage
   * @param {string} dateString - La date au format string
   * @returns {string} - La date formatée
   */
  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }

  /**
   * Calculer le taux de croissance
   * @param {number} current - Valeur actuelle
   * @param {number} previous - Valeur précédente
   * @returns {number} - Le taux de croissance en pourcentage
   */
  static calculateGrowthRate(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  /**
   * Formater le nombre de visites pour l'affichage
   * @param {number} count - Le nombre de visites
   * @returns {string} - Le nombre formaté
   */
  static formatViewCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  /**
   * Obtenir les périodes disponibles
   * @returns {Array} - Liste des périodes avec leurs labels
   */
  static getPeriods() {
    return [
      { value: 'today', label: 'Aujourd\'hui' },
      { value: 'week', label: 'Cette semaine' },
      { value: 'month', label: 'Ce mois' },
      { value: 'year', label: 'Cette année' }
    ];
  }

  /**
   * Vérifier si les statistiques sont disponibles
   * @param {Object} stats - L'objet des statistiques
   * @returns {boolean} - true si les stats sont valides
   */
  static hasValidStats(stats) {
    return stats && 
           typeof stats === 'object' && 
           stats.success === true &&
           stats.data &&
           'total_views' in stats.data && 
           typeof stats.data.total_views === 'number' &&
           stats.data.total_views >= 0;
  }

  /**
   * Obtenir la couleur pour le taux de croissance
   * @param {number} growth - Le taux de croissance
   * @returns {string} - La classe CSS pour la couleur
   */
  static getGrowthColor(growth) {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  /**
   * Obtenir l'icône pour le taux de croissance
   * @param {number} growth - Le taux de croissance
   * @returns {string} - Le nom de l'icône
   */
  static getGrowthIcon(growth) {
    if (growth > 0) return 'arrow-up';
    if (growth < 0) return 'arrow-down';
    return 'minus';
  }

  /**
   * Debounce une fonction (utile pour les recherches)
   * @param {Function} func - La fonction à debouncer
   * @param {number} wait - Le délai d'attente en ms
   * @returns {Function} - La fonction debouncée
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Mettre en cache les statistiques localement
   * @param {string} key - La clé de cache
   * @param {Object} data - Les données à mettre en cache
   * @param {number} duration - Durée du cache en minutes (défaut: 5)
   */
  static cacheStats(key, data, duration = 5) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      duration: duration * 60 * 1000 // Convertir en millisecondes
    };
    
    try {
      localStorage.setItem(`stats_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Impossible de mettre en cache:', error);
    }
  }

  /**
   * Récupérer les statistiques du cache
   * @param {string} key - La clé de cache
   * @returns {Object|null} - Les données du cache ou null si expiré/inexistant
   */
  static getCachedStats(key) {
    try {
      const cached = localStorage.getItem(`stats_cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const now = Date.now();

      // Vérifier si le cache a expiré
      if (now - cacheItem.timestamp > cacheItem.duration) {
        localStorage.removeItem(`stats_cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  /**
   * Vider le cache des statistiques
   */
  static clearStatsCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('stats_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export default StatsService;