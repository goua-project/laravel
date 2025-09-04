import api from './apiService';

class StatsService {
  
  /**
   * Récupérer les statistiques du dashboard (PUBLIQUE - sans authentification)
   */
  static async getDashboardStats(boutiqueId, period = 'month') {
    try {
      console.log(`Début getDashboardStats - Boutique: ${boutiqueId}`);
      
      if (!api || typeof api.get !== 'function') {
        console.error('API service non disponible');
        return this.getEmptyDashboardStats();
      }

      if (!boutiqueId || boutiqueId <= 0) {
        console.error('ID de boutique invalide');
        return {
          success: false,
          error: 'ID de boutique invalide',
          data: this.getEmptyDashboardStats().data
        };
      }

      const response = await api.get(`/boutiques/stats/${boutiqueId}/dashboard`, {
        params: { period },
        includeAuth: false,
        skipAuthToken: true
      });
      
      if (response && response.success && response.data) {
        const formattedData = {
          success: true,
          data: {
            total_views: parseInt(response.data.total_views) || 0,
            unique_views: parseInt(response.data.unique_views) || 0,
            previous_views: parseInt(response.data.previous_views) || 0,
            growth_rate: parseFloat(response.data.growth_rate) || 0
          }
        };
        
        console.log('Données reçues avec succès');
        return formattedData;
      }
      
      return response || this.getEmptyDashboardStats();
      
    } catch (error) {
      console.error('ERREUR getDashboardStats:', error.message);
      
      return {
        success: false,
        error: error.message || 'Erreur inconnue',
        data: this.getEmptyDashboardStats().data
      };
    }
  }

  /**
   * Obtenir le nombre de vues (PUBLIC - sans authentification)
   */
  static async getViewCount(boutiqueId) {
    try {
      console.log(`getViewCount pour boutique ${boutiqueId}`);
      
      if (!api || typeof api.get !== 'function') {
        console.error('API service non disponible');
        return { success: false, count: 0, error: 'Service non disponible' };
      }

      if (!boutiqueId || boutiqueId <= 0) {
        console.error('ID de boutique invalide');
        return { success: false, count: 0, error: 'ID de boutique invalide' };
      }

      const cacheKey = `view_count_${boutiqueId}`;
      const cached = this.getCachedStats(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await api.get(`/boutiques/stats/${boutiqueId}/public/view-count`, {
        includeAuth: false,
        skipAuthToken: true
      });

      let viewCount = 0;
      if (response && response.success && response.data) {
        viewCount = response.data.total_views || response.data.count || 0;
        
        const result = { success: true, count: viewCount };
        this.cacheStats(cacheKey, result, 2);
        return result;
      }

      return { success: true, count: viewCount };

    } catch (error) {
      console.error('Erreur getViewCount:', error);
      return { 
        success: false, 
        count: 0, 
        error: error.message
      };
    }
  }

  /**
   * SEULE MÉTHODE D'ENREGISTREMENT - Format compatible MySQL
   */
  static async recordView(boutiqueSlug, additionalData = {}) {
    try {
      if (!api || typeof api.post !== 'function') {
        console.error('Service API non disponible');
        return { 
          success: false, 
          message: 'Service non disponible',
          view_recorded: false
        };
      }

      if (!boutiqueSlug) {
        return { 
          success: false, 
          message: 'Slug de boutique manquant',
          view_recorded: false
        };
      }

      // Créer des données VALIDES pour MySQL
      const viewData = this.createMySQLCompatibleViewData(additionalData);

      console.log(`[RECORD VIEW] Enregistrement pour: ${boutiqueSlug}`);

      const response = await api.post(`/boutiques/views/record/${boutiqueSlug}`, viewData, {
        skipAuthToken: true,
        includeAuth: false
      });
      
      if (response && response.success) {
        const viewRecorded = response.data?.view_recorded === true;
        
        if (viewRecorded) {
          console.log(`[RECORD VIEW] ✅ Vue ENREGISTRÉE pour: ${boutiqueSlug}`);
        } else {
          console.log(`[RECORD VIEW] ⚠️ Vue NON enregistrée (déjà récente) pour: ${boutiqueSlug}`);
        }
        
        return { 
          success: true, 
          message: response.message, 
          view_recorded: viewRecorded,
          data: response.data 
        };
      }
      
      return { 
        success: false, 
        message: 'Erreur lors de l\'enregistrement',
        view_recorded: false
      };
      
    } catch (error) {
      console.error('Erreur enregistrement vue:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur inconnue',
        view_recorded: false
      };
    }
  }

  /**
   * Créer des données compatibles MySQL pour boutique_views
   */
  static createMySQLCompatibleViewData(additionalData = {}) {
    const now = new Date();
    
    // Format MySQL datetime: 'YYYY-MM-DD HH:MM:SS'
    const mysqlDateTime = now.toISOString().replace('T', ' ').substring(0, 19);
    
    const baseData = {
      // Champs REQUIS par la table boutique_views
      user_agent: (navigator.userAgent || '').substring(0, 500),
      referrer: (document.referrer || '').substring(0, 500) || null,
      
      // Champs OPTIONNELS avec valeurs par défaut
      country: additionalData.country || null,
      city: additionalData.city || null,
      device_type: this.detectDeviceType(),
      browser: this.detectBrowser(),
      os: this.detectOS(),
      
      // Format correct pour MySQL timestamp
      viewed_at: mysqlDateTime,
      
      // Flags de contrôle
      force_record: additionalData.force_record === true,
      bypass_dedup: additionalData.bypass_dedup === true
    };

    // Fusionner avec les données additionnelles
    const mergedData = { ...baseData, ...additionalData };
    
    // Nettoyer et valider les données pour MySQL
    return this.sanitizeForMySQL(mergedData);
  }

  /**
   * Nettoyer les données pour la compatibilité MySQL
   */
  static sanitizeForMySQL(data) {
    const sanitized = {};
    
    // Mapping des champs et leurs limites selon la table
    const fieldSpecs = {
      user_agent: { type: 'string', maxLength: 500 },
      referrer: { type: 'string', maxLength: 500 },
      country: { type: 'string', maxLength: 100 },
      city: { type: 'string', maxLength: 100 },
      device_type: { type: 'string', maxLength: 50 },
      browser: { type: 'string', maxLength: 100 },
      os: { type: 'string', maxLength: 100 },
      viewed_at: { type: 'datetime' },
      force_record: { type: 'boolean' },
      bypass_dedup: { type: 'boolean' }
    };

    Object.keys(fieldSpecs).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        const spec = fieldSpecs[key];
        
        switch (spec.type) {
          case 'string':
            sanitized[key] = String(data[key]).substring(0, spec.maxLength);
            break;
            
          case 'datetime':
            // S'assurer que c'est un format datetime MySQL valide
            const dateValue = new Date(data[key]);
            if (!isNaN(dateValue.getTime())) {
              sanitized[key] = dateValue.toISOString().replace('T', ' ').substring(0, 19);
            } else {
              sanitized[key] = new Date().toISOString().replace('T', ' ').substring(0, 19);
            }
            break;
            
          case 'boolean':
            sanitized[key] = Boolean(data[key]);
            break;
            
          default:
            sanitized[key] = data[key];
        }
      }
    });

    return sanitized;
  }

  /**
   * Enregistrement asynchrone (pour ne pas bloquer l'UI)
   */
  static recordViewAsync(boutiqueSlug, context = {}) {
    // Utiliser setTimeout pour éviter de bloquer l'UI
    setTimeout(async () => {
      try {
        console.log(`[ASYNC RECORD] Début enregistrement asynchrone pour: ${boutiqueSlug}`);
        
        const result = await this.recordView(boutiqueSlug, {
          async_mode: true,
          ...context
        });
        
        if (result && result.success && result.view_recorded) {
          console.log(`[ASYNC RECORD] ✅ Succès pour: ${boutiqueSlug}`);
        } else {
          console.log(`[ASYNC RECORD] ⚠️ Non enregistré pour: ${boutiqueSlug}`);
        }
        
      } catch (error) {
        console.warn(`[ASYNC RECORD] Erreur pour ${boutiqueSlug}:`, error.message);
      }
    }, 100);
  }

  /**
   * Détecter le type d'appareil
   */
  static detectDeviceType() {
    const userAgent = navigator.userAgent || '';
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop|windows phone|nokia/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Détecter le navigateur
   */
  static detectBrowser() {
    const userAgent = navigator.userAgent || '';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Détecter le système d'exploitation
   */
  static detectOS() {
    const userAgent = navigator.userAgent || '';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Formater le nombre de vues pour l'affichage
   */
  static formatViewCount(count) {
    if (!count || count === 0) return '0';
    
    const num = parseInt(count);
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    
    return num.toString();
  }

  // Méthodes utilitaires
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

  static cacheStats(key, data, duration = 5) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      duration: duration * 60 * 1000
    };
    
    try {
      localStorage.setItem(`stats_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Impossible de mettre en cache:', error);
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
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      return null;
    }
  }

  static clearStatsCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('stats_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Erreur lors du nettoyage du cache:', error);
    }
  }

  /**
   * Debug des données avant envoi
   */
  static debugViewData(boutiqueSlug, additionalData = {}) {
    const validData = this.createMySQLCompatibleViewData(additionalData);

    console.group(`Debug VIEW DATA pour ${boutiqueSlug}`);
    console.log('Données valides:', validData);
    console.log('Nombre de champs:', Object.keys(validData).length);
    console.log('Champs inclus:', Object.keys(validData));
    
    // Vérifier les limites de taille
    Object.keys(validData).forEach(key => {
      const value = validData[key];
      if (typeof value === 'string') {
        console.log(`${key}: ${value.length} caractères`);
      }
    });
    
    console.groupEnd();

    return { validData };
  }
}

export default StatsService;