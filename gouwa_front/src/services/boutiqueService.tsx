import ApiService from './apiService';

const API_BASE_URL = 'http://localhost:8000';

class BoutiqueService {
  constructor() {
    this.apiService = ApiService;
  }

  async createBoutique(boutiqueData) {
    try {
      const token = this.apiService.getToken();
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      console.log('Token utilisé:', token);
      console.log('URL de la requête:', `${API_BASE_URL}/api/boutiques`);

      const response = await fetch(`${API_BASE_URL}/api/boutiques`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: boutiqueData,
      });

      console.log('Statut de la réponse:', response.status);

      let data;
      const responseText = await response.text();
      console.log('Réponse brute du serveur:', responseText);

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw {
          response: {
            status: response.status,
            data: { message: `Erreur serveur ${response.status}: Réponse invalide` }
          }
        };
      }

      if (!response.ok) {
        console.error('Erreur HTTP:', response.status, data);
        const error = new Error(data.message || `Erreur ${response.status}`);
        error.response = {
          status: response.status,
          data: data
        };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la boutique:', error);
      
      if (error.response) {
        throw error;
      }
      
      throw {
        response: {
          status: 500,
          data: { message: error.message || 'Erreur de connexion' }
        },
        message: error.message || 'Erreur de connexion'
      };
    }
  }

  async getAllBoutiques() {
    try {
      return await this.apiService.request('/boutiques', {
        method: 'GET',
        includeAuth: false,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des boutiques:', error);
      throw error;
    }
  }

  async getMyBoutiques() {
    try {
      return await this.apiService.request('/my-boutiques', {
        method: 'GET',
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de mes boutiques:', error);
      throw error;
    }
  }

  async getBoutiqueById(id) {
    try {
      return await this.apiService.request(`/boutiques/${id}`, {
        method: 'GET',
        includeAuth: false,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la boutique:', error);
      throw error;
    }
  }

  async getBoutiqueBySlug(slug) {
    try {
      return await this.apiService.request(`/boutiques/slug/${slug}`, {
        method: 'GET',
        includeAuth: false,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la boutique:', error);
      throw error;
    }
  }

  async updateBoutique(id, boutiqueData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/boutiques/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiService.getToken()}`,
          'Accept': 'application/json',
        },
        body: boutiqueData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la mise à jour de la boutique');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la boutique:', error);
      throw error;
    }
  }

  async deleteBoutique(id) {
    try {
      return await this.apiService.request(`/boutiques/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la boutique:', error);
      throw error;
    }
  }

  // Méthodes pour les statistiques (corrigées selon le nouveau backend)
  async getBoutiqueStats(boutiqueId, period = 'month') {
    try {
      return await this.apiService.request(`/boutiques/${boutiqueId}/stats`, {
        method: 'GET',
        params: { period }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  async getDashboardStats(boutiqueId, period = 'month') {
    try {
      return await this.apiService.request(`/boutiques/${boutiqueId}/dashboard-stats`, {
        method: 'GET',
        params: { period }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du tableau de bord:', error);
      throw error;
    }
  }

  async getPublicViewCount(boutiqueId) {
    try {
      return await this.apiService.request(`/public/boutiques/${boutiqueId}/views`, {
        method: 'GET',
        includeAuth: false
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du compteur de vues public:', error);
      throw error;
    }
  }

  // ROUTE CORRIGÉE: Enregistrer une vue de boutique standard
  async recordView(boutiqueSlug, viewData = {}) {
    try {
      const payload = {
        ip_address: viewData.ip_address,
        user_agent: viewData.user_agent || navigator.userAgent,
        referrer: viewData.referrer || document.referrer,
        country: viewData.country,
        city: viewData.city,
        device_type: viewData.device_type,
        browser: viewData.browser,
        os: viewData.os,
        viewed_at: viewData.viewed_at || new Date().toISOString(),
        force_record: viewData.force_record || false,
        bypass_dedup: viewData.bypass_dedup || false
      };

      // NOUVELLE ROUTE CORRIGÉE
      return await this.apiService.request(`/boutiques/${boutiqueSlug}/view`, {
        method: 'POST',
        body: JSON.stringify(payload),
        includeAuth: false
      });
    } catch (error) {
      console.warn('Erreur lors de l\'enregistrement de la vue:', error);
      return { success: false, message: error.message };
    }
  }

  // ROUTE CORRIGÉE: Enregistrer une vue forcée
  async recordViewForced(boutiqueSlug, viewData = {}) {
    try {
      const payload = {
        ip_address: viewData.ip_address,
        user_agent: viewData.user_agent || navigator.userAgent,
        referrer: viewData.referrer || document.referrer,
        country: viewData.country,
        city: viewData.city,
        device_type: viewData.device_type,
        browser: viewData.browser,
        os: viewData.os,
        viewed_at: viewData.viewed_at || new Date().toISOString(),
        force_record: true,
        bypass_dedup: true
      };

      // NOUVELLE ROUTE CORRIGÉE
      return await this.apiService.request(`/boutiques/${boutiqueSlug}/view/forced`, {
        method: 'POST',
        body: JSON.stringify(payload),
        includeAuth: false
      });
    } catch (error) {
      console.warn('Erreur lors de l\'enregistrement de la vue forcée:', error);
      return { success: false, message: error.message };
    }
  }

  // ROUTE CORRIGÉE: Enregistrer une vue avec données étendues
  async recordViewExtended(boutiqueSlug, viewData = {}) {
    try {
      const payload = {
        ip_address: viewData.ip_address,
        user_agent: viewData.user_agent || navigator.userAgent,
        referrer: viewData.referrer || document.referrer,
        country: viewData.country,
        city: viewData.city,
        device_type: viewData.device_type,
        browser: viewData.browser,
        os: viewData.os,
        viewed_at: viewData.viewed_at || new Date().toISOString(),
        force_record: viewData.force_record || false,
        bypass_dedup: viewData.bypass_dedup || false
      };

      // NOUVELLE ROUTE CORRIGÉE
      return await this.apiService.request(`/boutiques/${boutiqueSlug}/view/extended`, {
        method: 'POST',
        body: JSON.stringify(payload),
        includeAuth: false
      });
    } catch (error) {
      console.warn('Erreur lors de l\'enregistrement de la vue étendue:', error);
      return { success: false, message: error.message };
    }
  }

  // Méthodes pour les abonnements
  async getSubscriptionStatus(id) {
    try {
      return await this.apiService.request(`/boutiques/${id}/subscription-status`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du statut d\'abonnement:', error);
      throw error;
    }
  }

  async upgradeSubscription(id, subscriptionData) {
    try {
      return await this.apiService.request(`/boutiques/${id}/upgrade-subscription`, {
        method: 'POST',
        data: subscriptionData,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à niveau de l\'abonnement:', error);
      throw error;
    }
  }

  createFormData(data) {
    const formData = new FormData();
    
    console.log('Création FormData avec:', data);
    
    // Ajouter tous les champs obligatoires
    if (data.nom) {
      formData.append('nom', data.nom);
    }
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.categorie) {
      formData.append('categorie', data.categorie);
    }
    
    // Ajouter les champs optionnels seulement s'ils ont une valeur
    if (data.slogan && data.slogan.trim()) {
      formData.append('slogan', data.slogan);
    }
    
    if (data.couleur_accent) {
      formData.append('couleur_accent', data.couleur_accent);
    }
    
    if (data.mots_cles && data.mots_cles.trim()) {
      formData.append('mots_cles', data.mots_cles);
    }
    
    if (data.logo && data.logo instanceof File) {
      formData.append('logo', data.logo);
    }

    console.log('FormData créé avec les entrées:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    return formData;
  }

  validateBoutiqueData(data) {
    const errors = [];

    if (!data.nom || data.nom.trim().length === 0) {
      errors.push('Le nom de la boutique est obligatoire');
    }

    if (data.nom && data.nom.length > 255) {
      errors.push('Le nom ne doit pas dépasser 255 caractères');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('La description est obligatoire');
    }

    if (!data.categorie) {
      errors.push('La catégorie est obligatoire');
    }

    if (data.categorie && !['physical', 'digital'].includes(data.categorie)) {
      errors.push('La catégorie doit être "physical" ou "digital"');
    }

    if (data.couleur_accent && !/^#[0-9A-Fa-f]{6}$/.test(data.couleur_accent)) {
      errors.push('La couleur d\'accent doit être au format hexadécimal (#RRGGBB)');
    }

    if (data.slogan && data.slogan.length > 255) {
      errors.push('Le slogan ne doit pas dépasser 255 caractères');
    }

    if (data.logo && data.logo instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(data.logo.type)) {
        errors.push('Le logo doit être au format JPEG, PNG, JPG ou GIF');
      }

      if (data.logo.size > 2 * 1024 * 1024) {
        errors.push('Le logo ne doit pas dépasser 2MB');
      }
    }

    return errors;
  }

  generateSlug(nom) {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getLogoUrl(logoPath) {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${API_BASE_URL}/storage/${logoPath}`;
  }

  // Méthodes utilitaires pour les statistiques
  static formatStatsData(stats) {
    if (!stats) return {
      totalViews: 0,
      uniqueViews: 0,
      viewsGrowth: 0,
      chartData: [],
      deviceStats: {},
      browserStats: [],
      referrerStats: []
    };

    return {
      totalViews: stats.total_views || 0,
      uniqueViews: stats.unique_views || 0,
      viewsGrowth: stats.growth_rate || stats.growth || 0,
      chartData: stats.chart_data || [],
      deviceStats: stats.device_stats || {},
      browserStats: stats.browser_stats || [],
      referrerStats: stats.referrer_stats || []
    };
  }

  static formatPeriodLabel(period) {
    const labels = {
      today: "Aujourd'hui",
      week: '7 derniers jours',
      month: '30 derniers jours',
      year: '12 derniers mois'
    };
    return labels[period] || labels.month;
  }

  // Méthodes utilitaires pour les abonnements
  static formatSubscriptionData(subscription) {
    return {
      hasActive: subscription.has_active || false,
      isExpired: subscription.is_expired || false,
      daysRemaining: subscription.days_remaining || 0,
      currentPlan: subscription.current_plan || null,
      details: subscription.details || null
    };
  }

  static isSubscriptionActive(boutique) {
    return boutique.subscription && boutique.subscription.has_active && !boutique.subscription.is_expired;
  }

  static canCreateProducts(boutique) {
    if (!this.isSubscriptionActive(boutique)) return false;
    
    const plan = boutique.subscription?.current_plan;
    if (!plan) return false;
    
    if (plan.limite_produits === null || plan.limite_produits === -1) return true;
    
    return true;
  }

  static getSubscriptionWarnings(boutique) {
    const warnings = [];
    const subscription = boutique.subscription;
    
    if (!subscription || !subscription.has_active) {
      warnings.push({
        type: 'error',
        message: 'Aucun abonnement actif. Votre boutique n\'est pas accessible au public.'
      });
    } else if (subscription.is_expired) {
      warnings.push({
        type: 'error',
        message: 'Votre abonnement a expiré. Renouvelez pour réactiver votre boutique.'
      });
    } else if (subscription.days_remaining <= 7) {
      warnings.push({
        type: 'warning',
        message: `Votre abonnement expire dans ${subscription.days_remaining} jour(s). Pensez à le renouveler.`
      });
    }
    
    return warnings;
  }

  // Détecter les informations du navigateur/device
  static detectDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    return {
      user_agent: userAgent,
      device_type: this.detectDeviceType(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent)
    };
  }

  static detectDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
      if (/ipad|tablet/i.test(ua)) {
        return 'tablet';
      }
      return 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  static detectBrowser(userAgent) {
    const browsers = [
      { name: 'Chrome', pattern: /chrome/i },
      { name: 'Firefox', pattern: /firefox/i },
      { name: 'Safari', pattern: /safari/i },
      { name: 'Edge', pattern: /edge/i },
      { name: 'Opera', pattern: /opera/i },
      { name: 'Internet Explorer', pattern: /msie|trident/i }
    ];

    for (const browser of browsers) {
      if (browser.pattern.test(userAgent)) {
        return browser.name;
      }
    }

    return 'Unknown';
  }

  static detectOS(userAgent) {
    const osList = [
      { name: 'Windows 11', pattern: /windows nt 10.0.*build 22/i },
      { name: 'Windows 10', pattern: /windows nt 10/i },
      { name: 'Windows 8.1', pattern: /windows nt 6.3/i },
      { name: 'Windows 8', pattern: /windows nt 6.2/i },
      { name: 'Windows 7', pattern: /windows nt 6.1/i },
      { name: 'Windows Vista', pattern: /windows nt 6.0/i },
      { name: 'Windows XP', pattern: /windows nt 5.1/i },
      { name: 'Mac OS X', pattern: /mac os x/i },
      { name: 'macOS', pattern: /macintosh|mac os x/i },
      { name: 'Linux', pattern: /linux/i },
      { name: 'Android', pattern: /android/i },
      { name: 'iOS', pattern: /iphone|ipad|ipod/i },
      { name: 'Ubuntu', pattern: /ubuntu/i }
    ];

    for (const os of osList) {
      if (os.pattern.test(userAgent)) {
        return os.name;
      }
    }

    return 'Unknown';
  }
}

export default new BoutiqueService();