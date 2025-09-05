import axios from 'axios';

// Configuration de base d'axios
const API_BASE_URL = 'http://localhost:8000/api';

// Instance axios configurée
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class BoutiqueCommandeService {
  /**
   * Lister les commandes d'une boutique
   */
  static async listerCommandesBoutique(boutiqueId, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axiosInstance.get(`/boutiques/${boutiqueId}/commandes?${params.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des commandes',
        error: error.response?.data
      };
    }
  }

  /**
   * Obtenir les statistiques d'une boutique
   */
  static async obtenirStatistiquesBoutique(boutiqueId) {
    try {
      const response = await axiosInstance.get(`/boutiques/${boutiqueId}/statistiques`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des statistiques',
        error: error.response?.data
      };
    }
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  static async mettreAJourStatutCommande(boutiqueId, commandeId, statut) {
    try {
      const response = await axiosInstance.patch(`/boutiques/${boutiqueId}/commandes/${commandeId}/statut`, {
        statut: statut
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la mise à jour du statut',
        error: error.response?.data
      };
    }
  }

  /**
   * Exporter les commandes en CSV
   */
  static async exporterCommandesCSV(boutiqueId, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axiosInstance.get(`/boutiques/${boutiqueId}/commandes/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `commandes_boutique_${boutiqueId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Export CSV téléchargé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'export CSV',
        error: error.response?.data
      };
    }
  }

  /**
   * Obtenir les détails d'une commande
   */
  static async obtenirDetailsCommande(boutiqueId, commandeId) {
    try {
      const response = await axiosInstance.get(`/boutiques/${boutiqueId}/commandes/${commandeId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des détails',
        error: error.response?.data
      };
    }
  }

  /**
   * Obtenir les clients d'une boutique
   */
  static async obtenirClientsBoutique(boutiqueId) {
    try {
      const response = await axiosInstance.get(`/boutiques/${boutiqueId}/clients`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des clients',
        error: error.response?.data
      };
    }
  }

  // Méthodes utilitaires pour le formatage

  /**
   * Formater un montant en devise locale
   */
  static formaterMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF', // Franc CFA
      minimumFractionDigits: 0
    }).format(montant);
  }

  /**
   * Obtenir le libellé d'un statut de commande
   */
  static getLibelleStatut(statut) {
    const statuts = {
      'en_attente': 'En attente',
      'payee': 'Payée',
      'en_cours': 'En cours',
      'livree': 'Livrée',
      'annulee': 'Annulée'
    };
    return statuts[statut] || statut;
  }

  /**
   * Obtenir la couleur CSS pour un statut
   */
  static getCouleurStatut(statut) {
    const couleurs = {
      'en_attente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'payee': 'bg-blue-100 text-blue-800 border-blue-200',
      'en_cours': 'bg-orange-100 text-orange-800 border-orange-200',
      'livree': 'bg-green-100 text-green-800 border-green-200',
      'annulee': 'bg-red-100 text-red-800 border-red-200'
    };
    return couleurs[statut] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Obtenir le libellé d'une méthode de paiement
   */
  static getLibelleMethodePaiement(methode) {
    const methodes = {
      'kaliapay': 'KaliaPay',
      'en_ligne': 'Paiement en ligne',
      'a_la_livraison': 'Paiement à la livraison',
      'virement': 'Virement bancaire',
      'especes': 'Espèces',
      'cheque': 'Chèque'
    };
    return methodes[methode] || methode;
  }

  /**
   * Formater une date
   */
  static formaterDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calculer les totaux des statistiques
   */
  static calculerTotauxStatistiques(commandes) {
    const totaux = {
      totalCommandes: commandes.length,
      chiffreAffaires: 0,
      commandesPayees: 0,
      commandesEnAttente: 0,
      commandesAnnulees: 0,
      commandesLivrees: 0
    };

    commandes.forEach(commande => {
      if (['payee', 'livree'].includes(commande.statut)) {
        totaux.chiffreAffaires += parseFloat(commande.montant_total);
      }
      
      switch (commande.statut) {
        case 'payee':
          totaux.commandesPayees++;
          break;
        case 'en_attente':
          totaux.commandesEnAttente++;
          break;
        case 'annulee':
          totaux.commandesAnnulees++;
          break;
        case 'livree':
          totaux.commandesLivrees++;
          break;
      }
    });

    return totaux;
  }

  /**
   * Grouper les commandes par période
   */
  static grouperCommandesParPeriode(commandes, periode = 'jour') {
    const groupes = {};
    
    commandes.forEach(commande => {
      const date = new Date(commande.created_at);
      let cle;
      
      switch (periode) {
        case 'jour':
          cle = date.toISOString().split('T')[0];
          break;
        case 'semaine':
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          cle = startOfWeek.toISOString().split('T')[0];
          break;
        case 'mois':
          cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'annee':
          cle = date.getFullYear().toString();
          break;
        default:
          cle = date.toISOString().split('T')[0];
      }
      
      if (!groupes[cle]) {
        groupes[cle] = [];
      }
      groupes[cle].push(commande);
    });
    
    return groupes;
  }

  /**
   * Calculer l'évolution des commandes
   */
  static calculerEvolutionCommandes(commandes, nombreJours = 7) {
    const evolution = [];
    const aujourd_hui = new Date();
    
    for (let i = nombreJours - 1; i >= 0; i--) {
      const date = new Date(aujourd_hui);
      date.setDate(aujourd_hui.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const commandesDuJour = commandes.filter(commande => {
        const commandeDate = new Date(commande.created_at).toISOString().split('T')[0];
        return commandeDate === dateString;
      });
      
      const chiffreAffairesDuJour = commandesDuJour
        .filter(c => ['payee', 'livree'].includes(c.statut))
        .reduce((sum, c) => sum + parseFloat(c.montant_total), 0);
      
      evolution.push({
        date: dateString,
        commandes: commandesDuJour.length,
        chiffre_affaires: chiffreAffairesDuJour,
        date_formatee: date.toLocaleDateString('fr-FR', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        })
      });
    }
    
    return evolution;
  }

  /**
   * Extraire les clients uniques avec leurs statistiques
   */
  static extraireClientsUniques(commandes) {
    const clientsMap = new Map();
    
    commandes.forEach(commande => {
      if (!commande.user) return;
      
      const userId = commande.user.id;
      if (clientsMap.has(userId)) {
        const client = clientsMap.get(userId);
        client.total_commandes++;
        client.montant_total += parseFloat(commande.montant_total);
        
        // Mettre à jour la dernière commande si plus récente
        if (new Date(commande.created_at) > new Date(client.derniere_commande)) {
          client.derniere_commande = commande.created_at;
        }
        
        // Mettre à jour la première commande si plus ancienne
        if (new Date(commande.created_at) < new Date(client.premiere_commande)) {
          client.premiere_commande = commande.created_at;
        }
        
        // Ajouter les statuts
        if (!client.statuts[commande.statut]) {
          client.statuts[commande.statut] = 0;
        }
        client.statuts[commande.statut]++;
        
      } else {
        clientsMap.set(userId, {
          ...commande.user,
          total_commandes: 1,
          montant_total: parseFloat(commande.montant_total),
          derniere_commande: commande.created_at,
          premiere_commande: commande.created_at,
          statuts: {
            [commande.statut]: 1
          }
        });
      }
    });
    
    return Array.from(clientsMap.values())
      .sort((a, b) => b.montant_total - a.montant_total);
  }

  /**
   * Analyser les produits les plus vendus
   */
  static analyserProduitsPopulaires(commandes) {
    const produitsMap = new Map();
    
    commandes.forEach(commande => {
      if (!commande.produits) return;
      
      commande.produits.forEach(produit => {
        const produitId = produit.id;
        if (produitsMap.has(produitId)) {
          const stats = produitsMap.get(produitId);
          stats.quantite_vendue += parseInt(produit.quantite);
          stats.chiffre_affaires += parseFloat(produit.prix) * parseInt(produit.quantite);
          stats.nombre_commandes++;
        } else {
          produitsMap.set(produitId, {
            id: produitId,
            nom: produit.nom,
            quantite_vendue: parseInt(produit.quantite),
            chiffre_affaires: parseFloat(produit.prix) * parseInt(produit.quantite),
            nombre_commandes: 1,
            prix_moyen: parseFloat(produit.prix)
          });
        }
      });
    });
    
    return Array.from(produitsMap.values())
      .sort((a, b) => b.quantite_vendue - a.quantite_vendue);
  }

  /**
   * Filtrer les commandes par critères multiples
   */
  static filtrerCommandes(commandes, filtres) {
    return commandes.filter(commande => {
      // Filtre par statut
      if (filtres.statut && commande.statut !== filtres.statut) {
        return false;
      }
      
      // Filtre par méthode de paiement
      if (filtres.methode_paiement && commande.methode_paiement !== filtres.methode_paiement) {
        return false;
      }
      
      // Filtre par date de début
      if (filtres.date_debut) {
        const dateCommande = new Date(commande.created_at);
        const dateDebut = new Date(filtres.date_debut);
        if (dateCommande < dateDebut) {
          return false;
        }
      }
      
      // Filtre par date de fin
      if (filtres.date_fin) {
        const dateCommande = new Date(commande.created_at);
        const dateFin = new Date(filtres.date_fin);
        dateFin.setHours(23, 59, 59, 999); // Inclure toute la journée
        if (dateCommande > dateFin) {
          return false;
        }
      }
      
      // Filtre par recherche textuelle
      if (filtres.search) {
        const recherche = filtres.search.toLowerCase();
        const correspondance = 
          commande.reference.toLowerCase().includes(recherche) ||
          (commande.user && (
            commande.user.nom.toLowerCase().includes(recherche) ||
            commande.user.prenom.toLowerCase().includes(recherche) ||
            commande.user.email.toLowerCase().includes(recherche) ||
            commande.user.telephone.includes(recherche)
          ));
        
        if (!correspondance) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Valider les données d'une commande
   */
  static validerDonneesCommande(commande) {
    const erreurs = [];
    
    if (!commande.reference) {
      erreurs.push('La référence de la commande est requise');
    }
    
    if (!commande.montant_total || commande.montant_total <= 0) {
      erreurs.push('Le montant total doit être supérieur à 0');
    }
    
    if (!commande.statut) {
      erreurs.push('Le statut de la commande est requis');
    }
    
    const statutsValides = ['en_attente', 'payee', 'en_cours', 'livree', 'annulee'];
    if (commande.statut && !statutsValides.includes(commande.statut)) {
      erreurs.push('Statut de commande invalide');
    }
    
    if (!commande.methode_paiement) {
      erreurs.push('La méthode de paiement est requise');
    }
    
    return {
      valide: erreurs.length === 0,
      erreurs: erreurs
    };
  }
}

export default BoutiqueCommandeService;