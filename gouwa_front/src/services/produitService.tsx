import ApiService from './apiService';

const API_BASE_URL = 'http://localhost:8000';

class ProduitService {
  constructor() {
    this.apiService = ApiService;
  }

  async createProduit(boutiqueId, produitData) {
    try {
      const formData = this.createFormData(produitData);
      
      const response = await fetch(`${API_BASE_URL}/api/boutiques/${boutiqueId}/produits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiService.getToken()}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.message.includes('limite de produits')) {
          // Gérer spécifiquement l'erreur de limite d'abonnement
          return {
            success: false,
            requiresUpgrade: true,
            message: data.message,
            limit: data.limit || 3 // Valeur par défaut
          };
        }
        
        if (response.status === 422) {
          const message = data.message || 'Erreur de validation';
          throw new Error(message);
        }
        throw new Error(data.message || 'Erreur serveur');
      }

      return {
        success: true,
        data,
        message: 'Produit créé avec succès'
      };
    } catch (error) {
      console.error('Erreur détaillée:', error);
      throw error;
    }
  }

  async checkProductLimit(boutiqueId) {
    try {
      const response = await this.apiService.request(`/boutiques/${boutiqueId}/product-limits`, {
        method: 'GET'
      });
      
      return {
        currentCount: response.current_count,
        limit: response.limit,
        canAddMore: response.can_add_more
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error);
      return {
        currentCount: 0,
        limit: 3, // Valeur par défaut pour le plan gratuit
        canAddMore: true
      };
    }
  }


  async getAllProduits(boutiqueId) {
    return this.apiService.request(`/boutiques/${boutiqueId}/produits`, {
      method: 'GET',
      includeAuth: false,
    });
  }

  async getProduitById(boutiqueId, produitId) {
    return this.apiService.request(`/boutiques/${boutiqueId}/produits/${produitId}`, {
      method: 'GET',
      includeAuth: false,
    });
  }

  async updateProduit(boutiqueId, produitId, produitData) {
    try {
      const formData = this.createFormData(produitData);
      
      // Ajouter _method pour Laravel
      formData.append('_method', 'PUT');

      const response = await fetch(`${API_BASE_URL}/api/boutiques/${boutiqueId}/produits/${produitId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiService.getToken()}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la mise à jour du produit');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  }

  async deleteProduit(boutiqueId, produitId) {
    return this.apiService.request(`/boutiques/${boutiqueId}/produits/${produitId}`, {
      method: 'DELETE',
    });
  }

  createFormData(data) {
    const formData = new FormData();

    // Vérification et ajout des champs obligatoires
    if (data.nom && data.nom.trim()) {
      formData.append('nom', data.nom.trim());
    }
    
    if (data.description && data.description.trim()) {
      formData.append('description', data.description.trim());
    }
    
    if (data.prix !== undefined && data.prix !== null && data.prix !== '') {
      formData.append('prix', data.prix.toString());
    }
    
    if (data.type && data.type.trim()) {
      formData.append('type', data.type.trim());
    }

    // Champs optionnels
    if (data.stock !== undefined && data.stock !== null) {
      formData.append('stock', data.stock.toString());
    }
    
    if (data.categorie && data.categorie.trim()) {
      formData.append('categorie', data.categorie.trim());
    }
    
    if (data.tags && data.tags.trim()) {
      formData.append('tags', data.tags.trim());
    }
    
    if (data.visible !== undefined) {
      // Envoyer comme boolean, pas comme string
      formData.append('visible', data.visible ? 'true' : 'false');
    }

    // Champs pour produits digitaux
    if (data.lien_telechargement && data.lien_telechargement.trim()) {
      formData.append('lien_telechargement', data.lien_telechargement.trim());
    }
    
    if (data.type_produit_digital && data.type_produit_digital.trim()) {
      formData.append('type_produit_digital', data.type_produit_digital.trim());
    }
    
    if (data.taille_fichier && data.taille_fichier.trim()) {
      formData.append('taille_fichier', data.taille_fichier.trim());
    }
    
    if (data.duree && data.duree.trim()) {
      formData.append('duree', data.duree.trim());
    }
    
    if (data.format && data.format.trim()) {
      formData.append('format', data.format.trim());
    }

    // Champs pour produits physiques
    if (data.lieu_expedition && data.lieu_expedition.trim()) {
      formData.append('lieu_expedition', data.lieu_expedition.trim());
    }
    
    if (data.delai_livraison && data.delai_livraison.trim()) {
      formData.append('delai_livraison', data.delai_livraison.trim());
    }

    // Gestion des images - CORRIGÉE
    if (data.images && Array.isArray(data.images)) {
      let imageIndex = 0;
      let urlIndex = 0;
      
      data.images.forEach((image) => {
        if (image instanceof File) {
          // Fichier uploadé
          formData.append(`images[${imageIndex}]`, image);
          imageIndex++;
        } else if (typeof image === 'string' && image.trim()) {
          // URL d'image
          formData.append(`image_urls[${urlIndex}]`, image.trim());
          urlIndex++;
        }
      });
    }

    return formData;
  }

  validateProduitData(data) {
    const errors = [];

    if (!data.nom || data.nom.trim().length === 0) {
      errors.push('Le nom du produit est obligatoire');
    }

    if (data.nom && data.nom.length > 255) {
      errors.push('Le nom ne doit pas dépasser 255 caractères');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('La description est obligatoire');
    }

    if (!data.prix || parseFloat(data.prix) < 0) {
      errors.push('Le prix est obligatoire et doit être positif');
    }

    if (!data.type) {
      errors.push('Le type de produit est obligatoire');
    }

    if (!['physique', 'digital', 'service'].includes(data.type)) {
      errors.push('Le type doit être "physique", "digital" ou "service"');
    }

    if (data.type === 'physique' && (!data.stock || parseInt(data.stock) < 0)) {
      errors.push('Le stock est obligatoire pour les produits physiques');
    }

    if (data.type === 'digital' && (!data.lien_telechargement || !data.lien_telechargement.trim())) {
      errors.push('Le lien de téléchargement est obligatoire pour les produits digitaux');
    }

    // Validation des URLs
    if (data.lien_telechargement && !this.isValidUrl(data.lien_telechargement)) {
      errors.push('Le lien de téléchargement doit être une URL valide');
    }

    return errors;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  convertToLaravelFormat(reactData) {
    console.log('Converting React data to Laravel format:', reactData);
    
    const laravelData = {
      nom: reactData.name || '',
      description: reactData.description || '',
      prix: parseFloat(reactData.price) || 0,
      type: reactData.isDigital ? 'digital' : 'physique',
      stock: reactData.isDigital ? 0 : parseInt(reactData.inStock) || 0,
      categorie: reactData.category || '',
      tags: reactData.tags || '',
      visible: reactData.isVisible !== undefined ? reactData.isVisible : true,
      lien_telechargement: reactData.downloadLink || '',
      type_produit_digital: reactData.digitalProductType || '',
      taille_fichier: reactData.fileSize || '',
      duree: reactData.duration || '',
      format: reactData.format || '',
      lieu_expedition: reactData.shippingFrom || '',
      delai_livraison: reactData.deliveryTime || '',
      images: reactData.images || [],
    };
    
    console.log('Converted to Laravel format:', laravelData);
    return laravelData;
  }

  convertToReactFormat(laravelData) {
    const images = laravelData.images;
    let parsedImages = [];
    
    if (typeof images === 'string') {
      try {
        parsedImages = JSON.parse(images);
      } catch (e) {
        parsedImages = [images];
      }
    } else if (Array.isArray(images)) {
      parsedImages = images;
    }
    
    // S'assurer qu'il y a au moins un élément vide pour l'interface
    if (parsedImages.length === 0) {
      parsedImages = [''];
    }

    return {
      id: laravelData.id,
      name: laravelData.nom,
      description: laravelData.description,
      price: laravelData.prix,
      isDigital: laravelData.type === 'digital',
      inStock: laravelData.stock || 0,
      category: laravelData.categorie,
      tags: laravelData.tags ? laravelData.tags.split(',').map(tag => tag.trim()) : [],
      isVisible: Boolean(laravelData.visible),
      downloadLink: laravelData.lien_telechargement || '',
      digitalProductType: laravelData.type_produit_digital || 'pdf',
      fileSize: laravelData.taille_fichier || '',
      duration: laravelData.duree || '',
      format: laravelData.format || '',
      shippingFrom: laravelData.lieu_expedition || '',
      deliveryTime: laravelData.delai_livraison || '',
      images: parsedImages,
      createdAt: laravelData.created_at,
      updatedAt: laravelData.updated_at,
    };
  }

  // MÉTHODE CORRIGÉE pour gérer les images
  getImageUrl(imagePath) {
    if (!imagePath) return null;
    
    // Si c'est déjà une URL complète (commence par http ou https), la retourner
    if (imagePath.startsWith('http')) return imagePath;
    
    // Pour les fichiers uploadés dans Laravel storage
    // Laravel stocke dans storage/app/public/products/ et crée un lien symbolique vers public/storage/
    if (imagePath.startsWith('products/')) {
      // Si le chemin contient déjà 'products/', utiliser directement
      return `${API_BASE_URL}/storage/${imagePath}`;
    }
    
    // Si le chemin ne contient pas 'products/', l'ajouter
    return `${API_BASE_URL}/storage/products/${imagePath}`;
  }

  // NOUVELLE MÉTHODE pour obtenir l'URL complète avec domaine (pour partage externe)
  getFullImageUrl(imagePath) {
    if (!imagePath) return null;
    
    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http')) return imagePath;
    
    // Construire l'URL complète
    const relativePath = this.getImageUrl(imagePath);
    return relativePath;
  }

  generateSlug(nom) {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export default new ProduitService();