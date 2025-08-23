// src/services/apiService.js

const API_BASE_URL = 'http://localhost:8000/api'; // URL de votre backend Laravel

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // Configuration des headers par défaut
  getHeaders(includeAuth = true, skipAuthToken = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Header important pour Laravel
    };

    // Si includeAuth est true et qu'on ne skip pas le token ET qu'on a un token
    if (includeAuth && !skipAuthToken && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Méthode générique pour les requêtes avec logs détaillés
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = options.method || 'GET';
    const isViewRecording = endpoint.includes('record-view');
    
    // Configuration de base
    const config = {
      mode: 'cors',
      credentials: 'omit',
      headers: this.getHeaders(
        options.includeAuth !== false, 
        options.skipAuthToken === true
      ),
      ...options,
    };

    // Log de débogage détaillé pour l'enregistrement des vues
    if (isViewRecording) {
      console.log('👁️ ENREGISTREMENT VUE - Request:', {
        url,
        method,
        headers: config.headers,
        bodySize: config.body ? config.body.length : 0,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('🚀 API Request:', {
        url,
        method,
        headers: config.headers,
        hasBody: !!config.body
      });
    }

    try {
      const startTime = performance.now();
      const response = await fetch(url, config);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Log détaillé de la réponse pour les vues
      if (isViewRecording) {
        console.log('👁️ ENREGISTREMENT VUE - Response:', {
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        });
      } else {
        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`
        });
      }
      
      // Tenter de parser le JSON
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('💥 Erreur de parsing JSON:', parseError);
          data = { 
            success: false, 
            error: 'Réponse non-JSON du serveur',
            raw_response: await response.text()
          };
        }
      } else {
        const textResponse = await response.text();
        console.warn('⚠️ Réponse non-JSON reçue:', contentType, textResponse);
        data = { 
          success: false, 
          error: 'Réponse non-JSON du serveur',
          content_type: contentType,
          raw_response: textResponse
        };
      }

      // Log spécialisé pour les vues
      if (isViewRecording) {
        if (response.ok) {
          console.log('✅ ENREGISTREMENT VUE RÉUSSI:', {
            boutique: endpoint.split('/').pop(),
            status: response.status,
            success: data.success,
            message: data.message,
            duration: `${duration}ms`
          });
        } else {
          console.error('❌ ENREGISTREMENT VUE ÉCHOUÉ:', {
            boutique: endpoint.split('/').pop(),
            status: response.status,
            error: data.message || data.error,
            details: data,
            duration: `${duration}ms`
          });
        }
      } else {
        console.log('📄 API Response Data:', data);
      }

      // Gestion des erreurs HTTP
      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
        
        // Ajouter les erreurs de validation si elles existent
        if (data.errors) {
          error.errors = data.errors;
          if (isViewRecording) {
            console.log('❌ Erreurs de validation pour vue:', data.errors);
          }
        }
        
        // Ajouter des détails sur l'erreur
        error.status = response.status;
        error.data = data;
        error.response = { status: response.status, data };
        
        // Log d'erreur spécialisé pour les vues
        if (isViewRecording) {
          console.error('❌ ERREUR DÉTAILLÉE ENREGISTREMENT VUE:', {
            url,
            status: response.status,
            message: error.message,
            data: data,
            headers: config.headers
          });
        }
        
        throw error;
      }

      return data;

    } catch (error) {
      // Log d'erreur détaillé
      if (isViewRecording) {
        console.error('💥 ERREUR CRITIQUE ENREGISTREMENT VUE:', {
          boutique: endpoint.split('/').pop(),
          url,
          message: error.message,
          status: error.status,
          network: !error.status ? 'Erreur réseau possible' : 'Erreur HTTP',
          stack: error.stack
        });
      } else {
        console.error('💥 API Error:', {
          url,
          message: error.message,
          status: error.status,
          errors: error.errors,
          data: error.data
        });
      }
      
      throw error;
    }
  }

  // Méthodes d'authentification améliorées
  async register(userData) {
    console.log('📝 Tentative d\'inscription avec:', { ...userData, password: '***' });
    
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      includeAuth: false,
    });

    if (response.token || response.access_token) {
      this.setToken(response.token || response.access_token);
    }

    return response;
  }

  async login(email, password) {
    console.log('🔐 Tentative de connexion pour:', email);
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    });

    if (response.token || response.access_token) {
      this.setToken(response.token || response.access_token);
    }

    return response;
  }

  async logout() {
    console.log('🔓 Déconnexion en cours...');
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
      console.log('✅ Déconnexion réussie côté serveur');
    } catch (error) {
      console.warn('⚠️ Erreur lors de la déconnexion côté serveur:', error.message);
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser() {
    console.log('👤 Récupération de l\'utilisateur actuel...');
    return this.request('/auth/me');
  }

  // Méthodes spécialisées pour les statistiques
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  async get(endpoint, options = {}) {
    let url = endpoint;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.keys(options.params).forEach(key => {
        if (options.params[key] !== null && options.params[key] !== undefined) {
          searchParams.append(key, options.params[key]);
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request(url, {
      method: 'GET',
      headers: options.headers || {},
      includeAuth: options.includeAuth !== false
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  // Gestion du token améliorée
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    console.log('🔑 Token sauvegardé avec succès');
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    console.log('🗑️ Token supprimé avec succès');
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  // Méthode de diagnostic pour déboguer les problèmes d'API
  async testConnection() {
    console.log('🔍 Test de connexion API...');
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      console.log('🏥 Status de santé API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ Test de connexion échoué:', error);
      return false;
    }
  }

  // Méthode pour tester spécifiquement l'enregistrement des vues
  async testViewRecording(testSlug = 'test-boutique') {
    console.log('🧪 Test d\'enregistrement de vue...');
    
    try {
      const testData = {
        timestamp: new Date().toISOString(),
        user_agent: 'Test User Agent',
        test: true
      };

      const response = await this.post(
        `/boutiques/stats/record-view/${testSlug}`, 
        testData, 
        { skipAuthToken: true }
      );

      console.log('✅ Test d\'enregistrement réussi:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Test d\'enregistrement échoué:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();