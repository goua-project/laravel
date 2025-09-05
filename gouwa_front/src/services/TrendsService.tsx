import ApiService from './apiService';

class TrendsService {
  // Récupérer toutes les boutiques avec leurs statistiques
  async getAllBoutiquesWithStats() {
    try {
      console.log('Tentative de récupération des boutiques avec stats...');
      
      // Essayer l'endpoint principal
      const response = await ApiService.get('all-with-stats');

      console.log('Réponse API reçue:', response);
      
      if (response && response.data) {
        console.log('Données récupérées avec succès:', response.data.length, 'boutiques');
        return response.data;
      }
      
      console.warn('Réponse vide ou invalide de l\'API');
      return [];
      
    } catch (error) {
      console.error('Erreur lors de la récupération des boutiques avec stats:', error);
      
      // Si l'endpoint principal échoue, essayer le fallback
      try {
        console.log('Tentative de fallback vers /boutiques...');
        const fallbackResponse = await ApiService.get('/boutiques');
        
        if (fallbackResponse && fallbackResponse.data) {
          const boutiques = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
          console.log('Fallback réussi:', boutiques.length, 'boutiques');
          
          // Enrichir avec des stats par défaut
          const enrichedBoutiques = boutiques.map(boutique => ({
            ...boutique,
            total_views: 0,
            unique_views: 0,
            views_growth: 0,
            total_orders: 0,
            total_sales: 0,
            orders_growth: 0,
            is_trending: false
          }));
          
          return enrichedBoutiques;
        }
        
        console.error('Fallback a échoué - réponse vide');
        return [];
        
      } catch (fallbackError) {
        console.error('Fallback a échoué:', fallbackError);
        
        // Dernier recours - retourner des données de test si en mode dev
        if (process.env.NODE_ENV === 'development') {
          console.warn('Mode développement - retour de données de test');
          return this.getMockData();
        }
        
        throw new Error('Impossible de récupérer les boutiques. Vérifiez votre connexion et les routes API.');
      }
    }
  }

  // Données de test pour le développement
  private getMockData() {
    return [
      {
        id: 1,
        nom: 'Boutique Test',
        type: 'physical',
        categorie: 'Mode',
        logo: null,
        slug: 'boutique-test',
        description: 'Boutique de test pour le développement',
        created_at: new Date().toISOString(),
        is_active: 1,
        status: 'active',
        user: {
          nom: 'Utilisateur',
          prenom: 'Test',
          email: 'test@example.com'
        },
        total_views: 150,
        unique_views: 120,
        views_growth: 25,
        total_orders: 10,
        total_sales: 50000,
        orders_growth: 15,
        is_trending: true
      }
    ];
  }

  // Test de connectivité API
  async testApiConnection() {
    try {
      const response = await ApiService.get('/boutiques');
      return {
        success: true,
        status: response.status || 200,
        message: 'API accessible'
      };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status || 0,
        message: error.message || 'Erreur de connexion',
        details: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      };
    }
  }

  // Récupérer les statistiques de vues d'une boutique avec fallback
  async getBoutiqueViewsStats(boutiqueId: number) {
    try {
      const response = await ApiService.get(`/boutiques/${boutiqueId}/views-stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching views stats for boutique ${boutiqueId}:`, error);
      return {
        total_views: 0,
        unique_views: 0,
        views_growth_rate: 0,
        recent_views: 0
      };
    }
  }

  // Récupérer les statistiques de commandes d'une boutique avec fallback
  async getBoutiqueOrdersStats(boutiqueId: number) {
    try {
      const response = await ApiService.get(`/boutiques/${boutiqueId}/orders-stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching orders stats for boutique ${boutiqueId}:`, error);
      return {
        total_orders: 0,
        total_sales: 0,
        completed_orders: 0,
        avg_order_value: 0,
        orders_growth_rate: 0
      };
    }
  }

  // Récupérer les vues détaillées avec gestion d'erreur améliorée
  async getDetailedViews(boutiqueId: number) {
    try {
      const response = await ApiService.get(`/boutiques/${boutiqueId}/detailed-views`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching detailed views for boutique ${boutiqueId}:`, error);
      return {
        total_views: 0,
        unique_views: 0,
        growth_rate: 0,
        top_countries: [],
        top_cities: [],
        top_browsers: [],
        top_devices: [],
        daily_views: []
      };
    }
  }

  // Récupérer les commandes détaillées avec gestion d'erreur améliorée
  async getDetailedOrders(boutiqueId: number) {
    try {
      const response = await ApiService.get(`/boutiques/${boutiqueId}/detailed-orders`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching detailed orders for boutique ${boutiqueId}:`, error);
      return {
        total_orders: 0,
        total_sales: 0,
        completed_orders: 0,
        pending_orders: 0,
        avg_order_value: 0,
        growth_rate: 0,
        daily_orders: []
      };
    }
  }

  // Récupérer les top produits avec gestion d'erreur améliorée
  async getTopProducts(boutiqueId: number) {
    try {
      const response = await ApiService.get(`/boutiques/${boutiqueId}/top-products`);
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching top products for boutique ${boutiqueId}:`, error);
      return [];
    }
  }

  // Récupérer les statistiques de paiement avec gestion d'erreur améliorée
  async getPaymentsStats(boutiqueId: number) {
    try {
      const response = await ApiService.get(`/boutiques/${boutiqueId}/payments-stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payments stats for boutique ${boutiqueId}:`, error);
      return {
        total_payments: 0,
        successful_payments: 0,
        failed_payments: 0,
        success_rate: 0
      };
    }
  }

  // Récupérer les produits d'une boutique avec meilleure gestion d'erreurs
  async getBoutiqueProducts(boutiqueId: number) {
    try {
      const response = await ApiService.get(`/boutiques/${boutiqueId}/products`);
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching products for boutique ${boutiqueId}:`, error);
      
      // Si c'est une erreur 404, essayer l'endpoint de fallback
      if (error.response?.status === 404) {
        try {
          const fallbackResponse = await ApiService.get(`/boutiques/${boutiqueId}`);
          return fallbackResponse.data?.products || [];
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      
      return [];
    }
  }

  // Récupérer toutes les boutiques (fallback)
  async getAllBoutiques() {
    try {
      const response = await ApiService.get('/boutiques');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching boutiques:', error);
      throw new Error('Impossible de récupérer les boutiques');
    }
  }

  // Récupérer les informations de base d'une boutique
  async getBoutiqueBasicInfo(boutiqueId: number) {
    try {
      const response = await ApiService.get(`/boutiques/${boutiqueId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching boutique ${boutiqueId} basic info:`, error);
      return null;
    }
  }

  // Méthode pour vérifier si les routes sont disponibles
  async checkApiHealth() {
    try {
      const response = await ApiService.get('/boutiques');
      return { 
        status: 'ok', 
        message: 'API accessible',
        statusCode: response.status 
      };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: 'API non accessible',
        error: error.message,
        statusCode: error.response?.status || 0
      };
    }
  }
}

export default new TrendsService();