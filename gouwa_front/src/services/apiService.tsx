// src/services/apiService.tsx

const API_BASE_URL = 'http://localhost:8000/api'; // URL de votre backend Laravel

class ApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // Configuration des headers par défaut
  getHeaders(includeAuth = true) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Méthode générique pour les requêtes
  async request(endpoint: string, options: any = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      mode: 'cors' as RequestMode,
      credentials: 'omit' as RequestCredentials,
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    // Log de débogage
    console.log('🚀 API Request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body
    });

    try {
      const response = await fetch(url, config);
      
      // Log de la réponse
      console.log('📡 API Response Status:', response.status, response.statusText);
      
      const data = await response.json();
      
      console.log('📄 API Response Data:', data);

      if (!response.ok) {
        // Créer un objet d'erreur avec plus de détails
        const error = new Error(data.message || 'Une erreur est survenue') as any;
        
        // Ajouter les erreurs de validation si elles existent
        if (data.errors) {
          error.errors = data.errors;
          console.log('❌ Erreurs de validation:', data.errors);
        }
        
        // Ajouter le code de statut
        error.status = response.status;
        error.data = data;
        
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('💥 API Error:', {
        message: error.message,
        status: error.status,
        errors: error.errors,
        data: error.data
      });
      throw error;
    }
  }

  // Méthodes d'authentification
  async register(userData: any) {
    console.log('📝 Tentative d\'inscription avec:', userData);
    
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      includeAuth: false,
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(email: string, password: string) {
    console.log('🔐 Tentative de connexion pour:', email);
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Gestion du token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    console.log('🔑 Token sauvegardé');
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    console.log('🗑️ Token supprimé');
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export default new ApiService();