import api from './apiService';

class StatsService {
  
  /**
   * Récupérer les statistiques du dashboard avec gestion d'erreur améliorée
   */
  static async getDashboardStats(boutiqueId, period = 'month') {
    try {
      console.log(`📊 Récupération des stats dashboard pour boutique ${boutiqueId}, période: ${period}`);
      
      if (!api || typeof api.get !== 'function') {
        console.warn('API service non disponible pour les statistiques dashboard');
        return this.getEmptyDashboardStats();
      }

      // Vérifier l'authentification avant la requête
      if (!api.isAuthenticated()) {
        console.warn('🚨 Utilisateur non authentifié pour les statistiques');
        return {
          success: false,
          error: 'Authentification requise',
          data: this.getEmptyDashboardStats().data
        };
      }

      const response = await api.get(`/boutiques/stats/${boutiqueId}/dashboard`, {
        params: { period },
        includeAuth: true
      });
      
      console.log('✅ Réponse dashboard stats:', response);
      
      if (response && response.success && response.data) {
        return {
          success: true,
          data: {
            total_views: response.data.total_views || 0,
            unique_views: response.data.unique_views || 0,
            previous_views: response.data.previous_views || 0,
            growth_rate: response.data.growth_rate || 0
          }
        };
      }
      
      return response || this.getEmptyDashboardStats();
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques du dashboard:', error);
      
      // Gestion spécifique des erreurs
      if (error.status === 401) {
        return {
          success: false,
          error: 'Session expirée, veuillez vous reconnecter',
          data: this.getEmptyDashboardStats().data,
          requireAuth: true
        };
      }
      
      if (error.status === 404) {
        return {
          success: false,
          error: 'Boutique non trouvée ou accès non autorisé',
          data: this.getEmptyDashboardStats().data
        };
      }
      
      if (error.status === 500) {
        return {
          success: false,
          error: 'Erreur serveur temporaire, veuillez réessayer',
          data: this.getEmptyDashboardStats().data
        };
      }
      
      return {
        success: false,
        error: error.message || 'Erreur inconnue',
        data: this.getEmptyDashboardStats().data
      };
    }
  }

  /**
   * Récupérer les statistiques complètes avec retry automatique
   */
  static async getBoutiqueStats(boutiqueId, period = 'month', retryCount = 0) {
    try {
      console.log(`📊 Récupération des stats complètes pour boutique ${boutiqueId}, période: ${period}`);
      
      if (!api || typeof api.get !== 'function') {
        console.warn('API service non disponible pour les statistiques');
        return this.getEmptyStats();
      }

      // Vérifier l'authentification
      if (!api.isAuthenticated()) {
        console.warn('🚨 Utilisateur non authentifié');
        return {
          success: false,
          error: 'Authentification requise',
          data: this.getEmptyStats().data
        };
      }

      const cacheKey = `boutique_stats_${boutiqueId}_${period}`;
      const cachedStats = this.getCachedStats(cacheKey);
      if (cachedStats && retryCount === 0) {
        console.log('📦 Statistiques récupérées du cache:', cacheKey);
        return cachedStats;
      }

      const response = await api.get(`/boutiques/stats/${boutiqueId}`, {
        params: { period },
        includeAuth: true
      });
      
      if (response && response.success && response.data) {
        this.cacheStats(cacheKey, response, 5);
        return response;
      }
      
      return response || this.getEmptyStats();
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques complètes:', error);
      
      // Retry une fois en cas d'erreur 401 après refresh du token
      if (error.status === 401 && retryCount === 0) {
        console.log('🔄 Tentative de retry après erreur 401...');
        await api.refreshTokenIfNeeded();
        return this.getBoutiqueStats(boutiqueId, period, 1);
      }
      
      return {
        success: false,
        error: error.message || 'Erreur inconnue',
        data: this.getEmptyStats().data
      };
    }
  }

  /**
   * Enregistrer une vue avec retry et gestion d'erreur améliorée
   */
  static async recordView(boutiqueSlug) {
    try {
      if (!api || typeof api.post !== 'function') {
        console.warn('API service non disponible pour l\'enregistrement de visite');
        return { success: false, message: 'Service non disponible' };
      }

      if (!boutiqueSlug) {
        console.warn('⚠️ Slug de boutique manquant pour l\'enregistrement de vue');
        return { success: false, message: 'Slug de boutique manquant' };
      }

      const viewData = {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        platform: navigator.platform,
        cookies_enabled: navigator.cookieEnabled,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        url: window.location.href,
        page_title: document.title
      };

      console.log('👁️ Enregistrement de la vue pour:', boutiqueSlug);

      const response = await api.post(`/boutiques/views/record/${boutiqueSlug}`, viewData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        skipAuthToken: true
      });
      
      console.log('✅ Réponse enregistrement vue:', response);
      
      if (response && response.success) {
        return response;
      }
      
      return { success: false, message: 'Erreur lors de l\'enregistrement' };
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la visite:', error);
      
      return { 
        success: false, 
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  // Méthodes utilitaires pour les statistiques vides
  static getEmptyDashboardStats() {
    return {
      success: true,
      data: {
        total_views: 0,
        unique_views: 0,
        previous_views: 0,
        growth_rate: 0
      }
    };
  }

  static getEmptyStats() {
    return {
      success: true,
      data: {
        total_views: 0,
        unique_views: 0,
        previous_views: 0,
        growth_rate: 0,
        chart_data: []
      }
    };
  }

  // Méthodes existantes conservées...
  static async getAllBoutiquesStats(period = 'month') {
    try {
      if (!api || typeof api.get !== 'function') {
        console.warn('API service non disponible pour toutes les statistiques');
        return { success: false, data: [] };
      }

      if (!api.isAuthenticated()) {
        return {
          success: false,
          error: 'Authentification requise',
          data: []
        };
      }

      const response = await api.get('/boutiques/stats', {
        params: { period },
        includeAuth: true
      });
      
      return response || { success: false, data: [] };
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de toutes les statistiques:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message 
      };
    }
  }

  static async getViewsStats(boutiqueId, period = 'month') {
    try {
      if (!api.isAuthenticated()) {
        return {
          success: false,
          error: 'Authentification requise',
          data: {
            total_views: 0,
            unique_views: 0,
            previous_views: 0,
            growth_rate: 0,
            views_by_period: []
          }
        };
      }

      const cacheKey = `views_stats_${boutiqueId}_${period}`;
      const cachedStats = this.getCachedStats(cacheKey);
      if (cachedStats) {
        console.log('📦 Statistiques de vues récupérées du cache:', cacheKey);
        return cachedStats;
      }

      const response = await api.get(`/boutiques/stats/${boutiqueId}/views`, {
        params: { period },
        includeAuth: true
      });

      if (response && response.success && response.data) {
        this.cacheStats(cacheKey, response, 2); // Cache plus court pour les vues
        return response;
      }

      return response || {
        success: false,
        data: {
          total_views: 0,
          unique_views: 0,
          previous_views: 0,
          growth_rate: 0,
          views_by_period: []
        }
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques de vues:', error);
      
      return {
        success: false,
        error: error.message || 'Erreur inconnue',
        data: {
          total_views: 0,
          unique_views: 0,
          previous_views: 0,
          growth_rate: 0,
          views_by_period: []
        }
      };
    }
  }

  // Méthodes utilitaires et de cache
  static handleApiError(error) {
    console.log('🔧 Gestion d\'erreur API:', error);
    
    if (error && error.response && error.response.status) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.warn('🚨 Token expiré - authentification requise');
          api.removeToken();
          break;
        case 403:
          console.error('❌ Accès refusé:', data?.message || 'Accès refusé');
          break;
        case 404:
          console.error('❌ Ressource non trouvée:', data?.message || 'Ressource non trouvée');
          break;
        case 422:
          console.error('❌ Données invalides:', data?.errors || data?.message || 'Données invalides');
          break;
        case 429:
          console.error('❌ Trop de requêtes:', data?.message || 'Trop de requêtes');
          break;
        case 500:
          console.error('❌ Erreur serveur:', data?.message || 'Erreur serveur');
          break;
        default:
          console.error('❌ Erreur inconnue:', data?.message || error.message || 'Erreur inconnue');
      }
    } else {
      console.error('❌ Erreur:', error?.message || 'Erreur inconnue');
    }
  }

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

  static formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    } catch (error) {
      console.warn('⚠️ Erreur de formatage de date:', dateString);
      return dateString;
    }
  }

  static calculateGrowthRate(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  static formatViewCount(count) {
    const numCount = parseInt(count) || 0;
    
    if (numCount >= 1000000) {
      return (numCount / 1000000).toFixed(1) + 'M';
    } else if (numCount >= 1000) {
      return (numCount / 1000).toFixed(1) + 'K';
    }
    return numCount.toString();
  }

  static getPeriods() {
    return [
      { value: 'today', label: 'Aujourd\'hui' },
      { value: 'week', label: 'Cette semaine' },
      { value: 'month', label: 'Ce mois' },
      { value: 'year', label: 'Cette année' }
    ];
  }

  static hasValidStats(stats) {
    return stats && 
           typeof stats === 'object' && 
           stats.success === true &&
           stats.data &&
           'total_views' in stats.data && 
           typeof stats.data.total_views === 'number' &&
           stats.data.total_views >= 0;
  }

  static getGrowthColor(growth) {
    const numGrowth = parseFloat(growth) || 0;
    
    if (numGrowth > 0) return 'text-green-600';
    if (numGrowth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  static getGrowthIcon(growth) {
    const numGrowth = parseFloat(growth) || 0;
    
    if (numGrowth > 0) return 'arrow-up';
    if (numGrowth < 0) return 'arrow-down';
    return 'minus';
  }

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

  // Méthodes de cache améliorées
  static cacheStats(key, data, duration = 5) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      duration: duration * 60 * 1000
    };
    
    try {
      localStorage.setItem(`stats_cache_${key}`, JSON.stringify(cacheItem));
      console.log('📦 Stats mises en cache:', key);
    } catch (error) {
      console.warn('⚠️ Impossible de mettre en cache:', error);
    }
  }

  static getCachedStats(key) {
    try {
      const cached = localStorage.getItem(`stats_cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const now = Date.now();

      if (now - cacheItem.timestamp > cacheItem.duration) {
        localStorage.removeItem(`stats_cache_${key}`);
        console.log('🗑️ Cache expiré supprimé:', key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('⚠️ Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  static clearStatsCache() {
    try {
      const keys = Object.keys(localStorage);
      const deletedKeys = [];
      
      keys.forEach(key => {
        if (key.startsWith('stats_cache_')) {
          localStorage.removeItem(key);
          deletedKeys.push(key);
        }
      });
      
      console.log('🗑️ Cache des statistiques nettoyé:', deletedKeys.length, 'entrées supprimées');
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage du cache:', error);
    }
  }

  // Méthodes avancées avec retry
  static async recordViewWithRetry(boutiqueSlug, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`👁️ Tentative ${attempt}/${maxRetries} d'enregistrement de vue pour: ${boutiqueSlug}`);
        
        const result = await this.recordView(boutiqueSlug);
        
        if (result.success) {
          console.log('✅ Enregistrement de vue réussi à la tentative', attempt);
          return result;
        }
        
        // Ne pas retry pour les erreurs 404 ou 403
        if (result.status && [404, 403].includes(result.status)) {
          console.warn('⚠️ Arrêt des tentatives pour erreur définitive:', result.status);
          return result;
        }
        
        if (attempt === maxRetries) {
          console.warn('⚠️ Échec après toutes les tentatives');
          return result;
        }
        
        // Délai exponentiel entre les tentatives
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.error(`❌ Tentative ${attempt}/${maxRetries} échouée:`, error);
        
        if (attempt === maxRetries) {
          return { success: false, error: error.message };
        }
        
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  static async recordViewAsync(boutiqueSlug) {
    // Enregistrement asynchrone avec délai pour éviter de bloquer l'UI
    setTimeout(async () => {
      try {
        await this.recordViewWithRetry(boutiqueSlug, 2);
      } catch (error) {
        console.warn('⚠️ Échec silencieux de l\'enregistrement de vue:', error);
      }
    }, 100);
  }

  static async batchRecordViews(boutiquesSlugs) {
    if (!Array.isArray(boutiquesSlugs) || boutiquesSlugs.length === 0) {
      console.warn('⚠️ Aucun slug fourni pour l\'enregistrement batch');
      return [];
    }

    console.log('📊 Enregistrement batch pour', boutiquesSlugs.length, 'boutiques');
    
    const promises = boutiquesSlugs.map(slug => 
      this.recordView(slug).catch(error => ({ slug, error: error.message }))
    );
    
    try {
      const results = await Promise.allSettled(promises);
      console.log('✅ Résultats batch enregistrement:', results);
      return results;
    } catch (error) {
      console.error('❌ Erreur lors du batch d\'enregistrement:', error);
      return [];
    }
  }

  // Méthode de diagnostic
  static async testStatsConnection() {
    console.log('🔍 Test de connexion aux statistiques...');
    
    try {
      if (!api.isAuthenticated()) {
        return {
          success: false,
          message: 'Non authentifié',
          details: 'Token manquant ou invalide'
        };
      }

      // Test avec une boutique fictive
      const testResponse = await api.get('/boutiques/stats', {
        params: { period: 'today' },
        includeAuth: true
      });

      return {
        success: true,
        message: 'Connexion aux statistiques OK',
        details: testResponse
      };

    } catch (error) {
      return {
        success: false,
        message: 'Échec de connexion aux statistiques',
        details: error.message,
        status: error.status
      };
    }
  }
}

export default StatsService;