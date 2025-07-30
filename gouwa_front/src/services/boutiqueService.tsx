import ApiService from './apiService';

const API_BASE_URL = 'http://localhost:8000'; // Définir l'URL directement comme dans apiService.js

class BoutiqueService {
  constructor() {
    this.apiService = ApiService;
  }

  async createBoutique(boutiqueData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/boutiques`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiService.getToken()}`,
          'Accept': 'application/json',
        },
        body: boutiqueData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création de la boutique');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la boutique:', error);
      throw error;
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

  createFormData(data) {
    const formData = new FormData();
    
    if (data.nom) formData.append('nom', data.nom);
    if (data.slogan) formData.append('slogan', data.slogan);
    if (data.description) formData.append('description', data.description);
    if (data.categorie) formData.append('categorie', data.categorie);
    if (data.couleur_accent) formData.append('couleur_accent', data.couleur_accent);
    if (data.mots_cles) formData.append('mots_cles', data.mots_cles);
    
    if (data.logo && data.logo instanceof File) {
      formData.append('logo', data.logo);
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
    
    return `${API_BASE_URL}/storage/${logoPath}`;
  }

   // Nouvelles méthodes pour les statistiques
  async getBoutiqueStats(boutiqueId, period = 'month') {
    try {
      const response = await this.get(`/boutiques/${boutiqueId}/stats`, {
        params: { period }
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDashboardStats(boutiqueId, period = 'month') {
    try {
      const response = await this.get(`/boutiques/${boutiqueId}/dashboard-stats`, {
        params: { period }
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAllBoutiquesStats(period = 'month') {
    try {
      const response = await this.get('/boutiques/stats', {
        params: { period }
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Enregistrer une vue de boutique (appelé depuis la page publique de la boutique)
  async recordView(boutiqueSlug) {
    try {
      const response = await this.post(`/public/boutiques/${boutiqueSlug}/view`, {}, {
        skipAuth: true // Cette route est publique
      });
      return this.handleResponse(response);
    } catch (error) {
      // Ne pas lever d'erreur pour ne pas casser l'affichage de la boutique
      console.warn('Erreur lors de l\'enregistrement de la vue:', error);
      return { success: false };
    }
  }

  // Méthodes utilitaires pour les statistiques
  static formatStatsData(stats) {
    return {
      totalViews: stats.views?.total_views || 0,
      uniqueViews: stats.views?.unique_views || 0,
      viewsGrowth: stats.views?.growth || 0,
      chartData: stats.chart_data || [],
      deviceStats: stats.devices || {},
      browserStats: stats.browsers || [],
      referrerStats: stats.referrers || []
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

  // Générer un slug à partir du nom
  static generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Obtenir l'URL du logo
  static getLogoUrl(logoPath) {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${process.env.REACT_APP_API_URL || ''}/storage/${logoPath}`;
  }
}




export default new BoutiqueService();