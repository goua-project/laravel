
// src/services/apiService.js
// src/services/apiService.js

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // Configuration des headers par défaut
  getHeaders(includeAuth = true, skipAuthToken = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (includeAuth && !skipAuthToken && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = options.method || 'GET';
    const isViewRecording = endpoint.includes('record') || endpoint.includes('views');
    
    const config = {
      mode: 'cors',
      credentials: 'omit',
      method,
      headers: {
        ...this.getHeaders(
          options.includeAuth !== false, 
          options.skipAuthToken === true
        ),
        ...options.headers
      }
    };

    // Ajouter le body pour les requêtes POST/PUT
    if (options.body && (method === 'POST' || method === 'PUT')) {
      config.body = options.body;
    }

    let finalUrl = url;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.keys(options.params).forEach(key => {
        if (options.params[key] !== null && options.params[key] !== undefined) {
          searchParams.append(key, options.params[key]);
        }
      });
      if (searchParams.toString()) {
        finalUrl += `?${searchParams.toString()}`;
      }
    }

    if (isViewRecording) {
      console.log('REQUEST VIEW - Configuration:', {
        url: finalUrl,
        method,
        hasBody: !!config.body,
        bodySize: config.body ? config.body.length : 0,
        headers: config.headers,
        timestamp: new Date().toISOString()
      });
    }

    try {
      const startTime = performance.now();
      const response = await fetch(finalUrl, config);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.warn('Réponse non-JSON reçue:', contentType, textResponse.substring(0, 200));
        data = { 
          success: false, 
          error: 'Réponse non-JSON du serveur',
          content_type: contentType,
          raw_response: textResponse.substring(0, 500)
        };
      }

      if (isViewRecording) {
        if (response.ok) {
          const viewRecorded = data.data && data.data.view_recorded === true;
          
          if (viewRecorded) {
            console.log('VIEW RECORD SUCCESS:', {
              boutique: this.extractBoutiqueSlug(endpoint),
              status: response.status,
              view_recorded: data.data.view_recorded,
              message: data.message,
              duration: `${duration}ms`
            });
          } else {
            console.warn('VIEW RECORD NOT NEEDED:', {
              boutique: this.extractBoutiqueSlug(endpoint),
              status: response.status,
              view_recorded: data.data ? data.data.view_recorded : 'unknown',
              message: data.message,
              duration: `${duration}ms`
            });
          }
        } else {
          console.error('VIEW RECORD FAILED:', {
            boutique: this.extractBoutiqueSlug(endpoint),
            status: response.status,
            error: data.message || data.error || 'Erreur inconnue',
            errors: data.errors,
            duration: `${duration}ms`
          });
        }
      }

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        error.response = { status: response.status, data };
        
        throw error;
      }

      return data;

    } catch (error) {
      if (isViewRecording) {
        console.error('VIEW RECORD CRITICAL ERROR:', {
          boutique: this.extractBoutiqueSlug(endpoint),
          url: finalUrl,
          message: error.message,
          status: error.status,
          data: error.data,
          network: !error.status ? 'Network Error' : 'HTTP Error'
        });
      }
      
      throw error;
    }
  }

  // Extraire le slug de boutique depuis l'endpoint
  extractBoutiqueSlug(endpoint) {
    const matches = endpoint.match(/\/([^\/]+)(?:\?|$)/);
    return matches ? matches[1] : 'unknown';
  }

  // Méthodes d'authentification
  async register(userData) {
    console.log('Tentative d\'inscription avec:', { ...userData, password: '***' });
    
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
    console.log('Tentative de connexion pour:', email);
    
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
    console.log('Déconnexion en cours...');
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
      console.log('Déconnexion réussie côté serveur');
    } catch (error) {
      console.warn('Erreur lors de la déconnexion côté serveur:', error.message);
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser() {
    console.log('Récupération de l\'utilisateur actuel...');
    return this.request('/auth/me');
  }

  // Méthodes HTTP principales
  async post(endpoint, data, options = {}) {
    const isValidData = this.validateViewData(endpoint, data);
    
    if (!isValidData.valid) {
      console.error('Données invalides détectées:', isValidData.errors);
      throw new Error(`Données invalides: ${isValidData.errors.join(', ')}`);
    }

    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
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

  // Validation des données avant envoi
  validateViewData(endpoint, data) {
    const isViewEndpoint = endpoint.includes('record') || endpoint.includes('views');
    
    if (!isViewEndpoint) {
      return { valid: true, errors: [] };
    }

    const errors = [];
    const allowedFields = [
      'user_agent', 'referrer', 'country', 'city', 
      'device_type', 'browser', 'os', 'viewed_at',
      'force_record', 'bypass_dedup'
    ];

    const fieldLimits = {
      user_agent: 500,
      referrer: 500,
      country: 100,
      city: 100,
      device_type: 50,
      browser: 100,
      os: 100
    };

    // Vérifier les champs non autorisés
    Object.keys(data).forEach(field => {
      if (!allowedFields.includes(field)) {
        errors.push(`Champ non autorisé: ${field}`);
      }
    });

    // Vérifier les limites de taille pour les chaînes
    Object.keys(data).forEach(field => {
      const value = data[field];
      if (typeof value === 'string' && fieldLimits[field]) {
        if (value.length > fieldLimits[field]) {
          errors.push(`${field} dépasse la limite de ${fieldLimits[field]} caractères (${value.length})`);
        }
      }
    });

    // Vérifier les types de données
    if (data.force_record !== undefined && typeof data.force_record !== 'boolean') {
      errors.push('force_record doit être un booléen');
    }

    if (data.bypass_dedup !== undefined && typeof data.bypass_dedup !== 'boolean') {
      errors.push('bypass_dedup doit être un booléen');
    }

    if (data.viewed_at !== undefined && !this.isValidDate(data.viewed_at)) {
      errors.push('viewed_at doit être une date valide');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Valider une date
  isValidDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // Gestion du token
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    console.log('Token sauvegardé avec succès');
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    console.log('Token supprimé avec succès');
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  // Méthodes de test et debug
  async testConnection() {
    console.log('Test de connexion API...');
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      console.log('Status de santé API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return response.ok;
    } catch (error) {
      console.error('Test de connexion échoué:', error);
      return false;
    }
  }

  // Test spécifique pour l'enregistrement des vues
  async testViewRecording(testSlug = 'test-boutique') {
    console.log('Test d\'enregistrement de vue...');
    
    try {
      const testData = {
        user_agent: 'Test User Agent',
        referrer: 'http://test.com',
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        country: 'France',
        city: 'Paris',
        force_record: true,
        bypass_dedup: true,
        viewed_at: new Date().toISOString()
      };

      const response = await this.post(
        `/boutiques/views/record/${testSlug}`, 
        testData, 
        { 
          skipAuthToken: true,
          includeAuth: false
        }
      );

      console.log('Test d\'enregistrement réussi:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('Test d\'enregistrement échoué:', error);
      return { success: false, error: error.message, data: error.data };
    }
  }

  // Test avec des données forcées
  async testViewRecordingForced(testSlug = 'test-boutique') {
    console.log('Test d\'enregistrement de vue FORCÉ...');
    
    try {
      const testData = {
        user_agent: 'Test User Agent - Forced',
        referrer: null,
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        force_record: true,
        bypass_dedup: true,
        viewed_at: new Date().toISOString()
      };

      const response = await this.post(
        `/boutiques/views/force-record/${testSlug}`, 
        testData, 
        { 
          skipAuthToken: true,
          includeAuth: false,
          params: {
            force: 'true',
            bypass_dedup: 'true'
          }
        }
      );

      console.log('Test d\'enregistrement forcé réussi:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('Test d\'enregistrement forcé échoué:', error);
      return { success: false, error: error.message, data: error.data };
    }
  }

  // Debug complet des problèmes d'enregistrement
  async debugViewRecording(boutiqueSlug) {
    console.log('DEBUG - Analyse des problèmes d\'enregistrement pour:', boutiqueSlug);
    
    const debugResults = {
      slug: boutiqueSlug,
      timestamp: new Date().toISOString(),
      tests: {},
      validations: {},
      connectivity: {}
    };

    // Test 1: Validation des données
    try {
      const sampleData = {
        user_agent: navigator.userAgent.substring(0, 500),
        referrer: document.referrer.substring(0, 500) || null,
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        force_record: true,
        bypass_dedup: true
      };

      const validation = this.validateViewData(`/boutiques/views/record/${boutiqueSlug}`, sampleData);
      debugResults.validations.sample_data = validation;
      
    } catch (error) {
      debugResults.validations.sample_data = { 
        valid: false, 
        error: error.message 
      };
    }

    // Test 2: Connectivité
    try {
      const connectionOk = await this.testConnection();
      debugResults.connectivity.api_health = connectionOk;
    } catch (error) {
      debugResults.connectivity.api_health = false;
      debugResults.connectivity.error = error.message;
    }

    // Test 3: Enregistrement normal
    try {
      const normalResult = await this.testViewRecording(boutiqueSlug);
      debugResults.tests.normal = normalResult;
    } catch (error) {
      debugResults.tests.normal = { success: false, error: error.message };
    }

    // Test 4: Enregistrement forcé
    try {
      const forcedResult = await this.testViewRecordingForced(boutiqueSlug);
      debugResults.tests.forced = forcedResult;
    } catch (error) {
      debugResults.tests.forced = { success: false, error: error.message };
    }

    // Test 5: Debug de validation côté serveur
    try {
      const debugValidation = await this.get(`/boutiques/views/debug-validation/${boutiqueSlug}`, {
        skipAuthToken: true,
        includeAuth: false
      });
      debugResults.server_debug = debugValidation;
    } catch (error) {
      debugResults.server_debug = { error: error.message };
    }

    console.log('DEBUG - Résultats complets:', debugResults);
    return debugResults;
  }

  // Nettoyage des données avant envoi
  cleanDataForSending(data) {
    const cleaned = {};
    
    // Champs autorisés uniquement
    const allowedFields = [
      'user_agent', 'referrer', 'country', 'city', 
      'device_type', 'browser', 'os', 'viewed_at',
      'force_record', 'bypass_dedup'
    ];

    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        let value = data[field];
        
        // Nettoyer les chaînes
        if (typeof value === 'string') {
          value = value.trim();
          
          // Appliquer les limites de longueur
          const limits = {
            user_agent: 500,
            referrer: 500,
            country: 100,
            city: 100,
            device_type: 50,
            browser: 100,
            os: 100
          };
          
          if (limits[field] && value.length > limits[field]) {
            value = value.substring(0, limits[field]);
          }
        }
        
        // Nettoyer les valeurs null/undefined pour referrer
        if (field === 'referrer' && (!value || value === '')) {
          value = null;
        }
        
        cleaned[field] = value;
      }
    });

    return cleaned;
  }

  // Méthode POST améliorée avec nettoyage automatique
  async postClean(endpoint, data, options = {}) {
    const cleanedData = this.cleanDataForSending(data);
    
    console.log('Données nettoyées pour envoi:', {
      original_fields: Object.keys(data).length,
      cleaned_fields: Object.keys(cleanedData).length,
      endpoint
    });

    return this.post(endpoint, cleanedData, options);
  }
}

export default new ApiService();