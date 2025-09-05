// services/commandeApiService.js
// services/commandeApiService.js
import axios from 'axios';

// Configuration de base d'axios
const API_BASE_URL = 'http://localhost:8000/api';

// Instance axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response || error);
    
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      
      // Optionnel: rediriger vers login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
    
    return Promise.reject(error);
  }
);

// Service principal pour les commandes
class CommandeApiService {
  // ====== GESTION DES COMMANDES ======

  /**
   * Créer une nouvelle commande - URL corrigée pour Laravel
   */
  static async creerCommande(commandeData: any) {
    try {
      // Validation des données avant envoi
      const validation = this.validerDonneesCommande(commandeData);
      if (!validation.isValid) {
        return {
          success: false,
          message: "Données de commande invalides",
          errors: validation.errors,
        };
      }

      // Utiliser l'endpoint Laravel correct
      const response = await apiClient.post("/commandes", commandeData);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Obtenir l'instance de l'API client
   */
  static getApiClient() {
    return apiClient;
  }

  /**
   * Créer une commande avec paiement KaliaPay
   */
  static async creerCommandeKaliaPay({
    boutique_id,
    produits,
    type_paiement_kalia,
    provider_kalia = null,
    customer_phone = null,
    adresse_livraison = null,
    notes = null,
    custom_data = null
  }) {
    // Validation spécifique KaliaPay
    if (!type_paiement_kalia) {
      return {
        success: false,
        message: 'Type de paiement KaliaPay requis',
      };
    }

    if (type_paiement_kalia === 'flash' && (!provider_kalia || !customer_phone)) {
      return {
        success: false,
        message: 'Provider et numéro de téléphone requis pour Flash Pay',
      };
    }

    const commandeData = {
      boutique_id,
      produits,
      methode_paiement: 'kaliapay',
      type_paiement_kalia,
      adresse_livraison,
      notes,
      custom_data: custom_data || `commande_${Date.now()}`
    };

    // Ajouter les paramètres spécifiques au Flash Pay
    if (type_paiement_kalia === 'flash') {
      commandeData.provider_kalia = provider_kalia;
      commandeData.customer_phone = customer_phone;
    }

    return await this.creerCommande(commandeData);
  }

  /**
   * Créer une commande avec paiement à la livraison
   */
  static async creerCommandeLivraison({
    boutique_id,
    produits,
    adresse_livraison,
    notes = null
  }) {
    if (!adresse_livraison || !adresse_livraison.trim()) {
      return {
        success: false,
        message: 'Adresse de livraison requise',
      };
    }

    const commandeData = {
      boutique_id,
      produits,
      methode_paiement: 'a_la_livraison',
      adresse_livraison,
      notes,
    };

    return await this.creerCommande(commandeData);
  }

  /**
   * Créer une commande avec paiement en ligne standard
   */
  static async creerCommandeEnLigne({
    boutique_id,
    produits,
    adresse_livraison = null,
    notes = null
  }) {
    const commandeData = {
      boutique_id,
      produits,
      methode_paiement: 'en_ligne',
      adresse_livraison,
      notes,
    };

    return await this.creerCommande(commandeData);
  }

  /**
   * Lister les commandes de l'utilisateur
   */
  static async listerCommandes(page = 1) {
    try {
      const response = await apiClient.get(`/commandes?page=${page}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Afficher une commande spécifique
   */
  static async afficherCommande(commandeId) {
    try {
      const response = await apiClient.get(`/commandes/${commandeId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Annuler une commande
   */
  static async annulerCommande(commandeId) {
    try {
      const response = await apiClient.post(`/commandes/${commandeId}/annuler`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Obtenir les statistiques des commandes
   */
  static async obtenirStatistiques() {
    try {
      const response = await apiClient.get('/commandes/statistiques');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // ====== GESTION DES PAIEMENTS KALIAPAY ======

  /**
   * Vérifier le statut d'un paiement KaliaPay
   */
  static async verifierStatutPaiementKalia(commandeId) {
    try {
      const response = await apiClient.get(`/commandes/${commandeId}/kalia-status`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Relancer un paiement KaliaPay
   */
  static async relancerPaiementKalia(commandeId, {
    type_paiement_kalia,
    provider_kalia = null,
    customer_phone = null,
    custom_data = null
  }) {
    try {
      const requestData = {
        type_paiement_kalia,
        custom_data: custom_data || `relance_${commandeId}_${Date.now()}`,
      };

      if (type_paiement_kalia === 'flash') {
        if (!provider_kalia || !customer_phone) {
          return {
            success: false,
            message: 'Provider et numéro de téléphone requis pour Flash Pay',
          };
        }
        requestData.provider_kalia = provider_kalia;
        requestData.customer_phone = customer_phone;
      }

      const response = await apiClient.post(`/commandes/${commandeId}/relancer-kalia`, requestData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // ====== CALLBACKS ET WEBHOOKS ======

  /**
   * Traiter le callback de succès de paiement
   */
  static async traiterCallbackSuccess(reference, callbackData) {
    try {
      const response = await apiClient.post(`/paiements/${reference}/success`, callbackData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  /**
   * Traiter le callback d'échec de paiement
   */
  static async traiterCallbackEchec(reference, callbackData) {
    try {
      const response = await apiClient.post(`/paiements/${reference}/echec`, callbackData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  // ====== UTILITAIRES DE VALIDATION ======

  /**
   * Valider les données de commande avant envoi
   */
  static validerDonneesCommande(commandeData) {
    const errors = [];

    // Validation boutique
    if (!commandeData.boutique_id) {
      errors.push('La boutique est requise');
    }

    // Validation produits
    if (!commandeData.produits || !Array.isArray(commandeData.produits) || commandeData.produits.length === 0) {
      errors.push('Au moins un produit est requis');
    } else {
      commandeData.produits.forEach((produit, index) => {
        if (!produit.id) {
          errors.push(`ID du produit ${index + 1} requis`);
        }
        if (!produit.quantite || produit.quantite < 1) {
          errors.push(`Quantité valide requise pour le produit ${index + 1}`);
        }
      });
    }

    // Validation méthode de paiement
    if (!commandeData.methode_paiement) {
      errors.push('Méthode de paiement requise');
    }

    const methodesValides = ['kaliapay', 'en_ligne', 'a_la_livraison'];
    if (commandeData.methode_paiement && !methodesValides.includes(commandeData.methode_paiement)) {
      errors.push('Méthode de paiement invalide');
    }

    // Validation spécifique KaliaPay
    if (commandeData.methode_paiement === 'kaliapay') {
      if (!commandeData.type_paiement_kalia) {
        errors.push('Type de paiement KaliaPay requis');
      }

      const typesValides = ['webpay', 'flash', 'mobpay', 'eshoppay'];
      if (commandeData.type_paiement_kalia && !typesValides.includes(commandeData.type_paiement_kalia)) {
        errors.push('Type de paiement KaliaPay invalide');
      }

      if (commandeData.type_paiement_kalia === 'flash') {
        if (!commandeData.provider_kalia) {
          errors.push('Provider requis pour Flash Pay');
        }
        
        const providersValides = ['orangeci', 'waveci', 'mtnci', 'cards'];
        if (commandeData.provider_kalia && !providersValides.includes(commandeData.provider_kalia)) {
          errors.push('Provider invalide');
        }

        if (!commandeData.customer_phone) {
          errors.push('Numéro de téléphone requis pour Flash Pay');
        } else if (!/^\d{10}$/.test(commandeData.customer_phone.toString())) {
          errors.push('Numéro de téléphone invalide (10 chiffres requis)');
        }
      }
    }

    // Validation livraison
    if (commandeData.methode_paiement === 'a_la_livraison' && !commandeData.adresse_livraison?.trim()) {
      errors.push('Adresse de livraison requise pour le paiement à la livraison');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ====== UTILITAIRES D'AFFICHAGE ======

  /**
   * Formater le montant pour l'affichage
   */
  static formaterMontant(montant, devise = 'XOF') {
    if (!montant || isNaN(montant)) return '0 ' + devise;
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise,
      minimumFractionDigits: 0,
    }).format(montant);
  }

  /**
   * Obtenir le libellé du statut de commande
   */
  static getLibelleStatut(statut) {
    const statuts = {
      'en_attente': 'En attente de paiement',
      'confirmee': 'Confirmée',
      'payee': 'Payée',
      'en_cours': 'En cours de traitement',
      'expediee': 'Expédiée',
      'livree': 'Livrée',
      'annulee': 'Annulée',
      'rembourse': 'Remboursée',
    };
    return statuts[statut] || statut;
  }

  /**
   * Obtenir la couleur du statut pour l'UI
   */
  static getCouleurStatut(statut) {
    const couleurs = {
      'en_attente': 'orange',
      'confirmee': 'blue',
      'payee': 'green',
      'en_cours': 'blue',
      'expediee': 'purple',
      'livree': 'green',
      'annulee': 'red',
      'rembourse': 'gray',
    };
    return couleurs[statut] || 'gray';
  }

  /**
   * Obtenir le libellé de la méthode de paiement
   */
  static getLibelleMethodePaiement(methode) {
    const methodes = {
      'en_ligne': 'Paiement en ligne',
      'a_la_livraison': 'Paiement à la livraison',
      'kaliapay': 'KaliaPay',
      'kaliapay_webpay': 'KaliaPay WebPay',
      'kaliapay_flash': 'KaliaPay Flash',
      'kaliapay_mobpay': 'KaliaPay MobPay',
      'kaliapay_eshoppay': 'KaliaPay eShopPay',
      'carte_bancaire': 'Carte bancaire',
      'especes_livraison': 'Espèces à la livraison',
    };
    return methodes[methode] || methode;
  }

  /**
   * Calculer le total d'une commande
   */
  static calculerTotal(produits) {
    if (!Array.isArray(produits)) return 0;
    
    return produits.reduce((total, produit) => {
      const prix = parseFloat(produit.prix || produit.price || 0);
      const quantite = parseInt(produit.quantite || produit.quantity || 0);
      return total + (prix * quantite);
    }, 0);
  }

  /**
   * Vérifier si une commande peut être annulée
   */
  static peutAnnulerCommande(commande) {
    const statutsAnnulables = ['en_attente', 'confirmee'];
    return statutsAnnulables.includes(commande.statut);
  }

  /**
   * Vérifier si un paiement peut être relancé
   */
  static peutRelancerPaiement(commande) {
    const statutsRelancables = ['en_attente', 'annulee'];
    return statutsRelancables.includes(commande.statut) && 
           commande.methode_paiement === 'kaliapay';
  }

  /**
   * Générer les options de providers KaliaPay
   */
  static getProvidersKaliaPay() {
    return [
      { value: 'orangeci', label: 'Orange Money CI', icon: '🟠', description: 'Orange Money Côte d\'Ivoire' },
      { value: 'waveci', label: 'Wave CI', icon: '🌊', description: 'Wave Côte d\'Ivoire' },
      { value: 'mtnci', label: 'MTN Mobile Money CI', icon: '🟡', description: 'MTN Mobile Money Côte d\'Ivoire' },
      { value: 'cards', label: 'Cartes bancaires', icon: '💳', description: 'Visa, Mastercard' },
    ];
  }

  /**
   * Générer les options de types de paiement KaliaPay
   */
  static getTypesPaiementKaliaPay() {
    return [
      {
        value: 'webpay',
        label: 'WebPay (Redirection)',
        description: 'Redirection vers la page de paiement KaliaPay',
        icon: '🌐',
        requiresProvider: false,
        requiresPhone: false
      },
      {
        value: 'flash',
        label: 'Flash Pay (Direct)',
        description: 'Paiement direct avec votre provider',
        icon: '⚡',
        requiresProvider: true,
        requiresPhone: true
      },
      {
        value: 'mobpay',
        label: 'MobPay (QR Code)',
        description: 'Paiement par QR Code mobile',
        icon: '📱',
        requiresProvider: false,
        requiresPhone: false
      },
      {
        value: 'eshoppay',
        label: 'eShopPay (QR Code)',
        description: 'Paiement par QR Code e-commerce',
        icon: '🛒',
        requiresProvider: false,
        requiresPhone: false
      },
    ];
  }

  // ====== GESTION DES ERREURS ======

  /**
   * Gérer les erreurs d'API de manière centralisée
   */
  static handleApiError(error) {
    console.error('API Error Details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response) {
      // Erreur de réponse du serveur
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return {
            success: false,
            type: 'validation',
            message: data.message || 'Données invalides',
            errors: data.errors || {},
          };
        case 401:
          return {
            success: false,
            type: 'auth',
            message: 'Session expirée, veuillez vous reconnecter',
          };
        case 403:
          return {
            success: false,
            type: 'permission',
            message: 'Accès non autorisé',
          };
        case 404:
          return {
            success: false,
            type: 'notfound',
            message: 'Ressource non trouvée - Vérifiez l\'URL de l\'API',
          };
        case 422:
          return {
            success: false,
            type: 'validation',
            message: 'Erreur de validation',
            errors: data.errors || {},
          };
        case 500:
          return {
            success: false,
            type: 'server',
            message: 'Erreur interne du serveur',
          };
        default:
          return {
            success: false,
            type: 'unknown',
            message: data.message || `Erreur HTTP ${status}: Une erreur inattendue s'est produite`,
          };
      }
    } else if (error.request) {
      // Erreur de réseau
      return {
        success: false,
        type: 'network',
        message: 'Problème de connexion réseau - Vérifiez votre connexion internet',
      };
    } else {
      // Autre erreur
      return {
        success: false,
        type: 'unknown',
        message: error.message || 'Une erreur inattendue s\'est produite',
      };
    }
  }

  // ====== UTILITAIRES DE DEBUG ======

  /**
   * Logger les informations de debug
   */
  static logDebug(action, data) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 CommandeApiService - ${action}`);
      console.log('Données:', data);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }

  /**
   * Vérifier la configuration API
   */
  static verifierConfiguration() {
    const config = {
      baseURL: API_BASE_URL,
      hasToken: !!localStorage.getItem('auth_token'),
      environment: process.env.NODE_ENV,
    };
    
    console.log('🔧 Configuration API:', config);
    return config;
  }
}

// Export par défaut
export default CommandeApiService;

// Export nommé pour compatibilité
export { CommandeApiService };