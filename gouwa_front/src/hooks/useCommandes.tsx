// hooks/useCommandes.js
import { useState, useEffect, useCallback } from 'react';
import CommandeApiService from '../services/commandeApiService';

// ====== HOOK PRINCIPAL POUR LES COMMANDES ======

export const useCommandes = (autoLoad = true) => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const chargerCommandes = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await CommandeApiService.listerCommandes(page);
      if (result.success) {
        setCommandes(result.data.commandes.data);
        setPagination({
          current_page: result.data.commandes.current_page,
          last_page: result.data.commandes.last_page,
          total: result.data.commandes.total,
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      chargerCommandes();
    }
  }, [autoLoad, chargerCommandes]);

  return {
    commandes,
    loading,
    error,
    pagination,
    chargerCommandes,
    rafraichir: () => chargerCommandes(pagination.current_page),
  };
};

// ====== HOOK POUR UNE COMMANDE SPÉCIFIQUE ======

export const useCommande = (commandeId) => {
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chargerCommande = useCallback(async () => {
    if (!commandeId) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await CommandeApiService.afficherCommande(commandeId);
      if (result.success) {
        setCommande(result.data.commande);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  }, [commandeId]);

  useEffect(() => {
    chargerCommande();
  }, [chargerCommande]);

  return {
    commande,
    loading,
    error,
    rafraichir: chargerCommande,
  };
};

// ====== HOOK POUR CRÉER UNE COMMANDE ======

export const useCreerCommande = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [commandeCreee, setCommandeCreee] = useState(null);

  const creerCommande = useCallback(async (donneesCommande) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setCommandeCreee(null);

    try {
      // Valider les données avant envoi
      const validation = CommandeApiService.validerDonneesCommande(donneesCommande);
      if (!validation.isValid) {
        setError({
          type: 'validation',
          message: 'Données invalides',
          errors: validation.errors,
        });
        setLoading(false);
        return null;
      }

      const result = await CommandeApiService.creerCommande(donneesCommande);
      
      if (result.success) {
        setSuccess(true);
        setCommandeCreee(result.data);
        return result.data;
      } else {
        setError({
          type: 'api',
          message: result.message,
          errors: result.errors,
        });
        return null;
      }
    } catch (err) {
      const errorInfo = CommandeApiService.handleApiError(err);
      setError(errorInfo);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const creerCommandeKaliaPay = useCallback(async (donneesKalia) => {
    return await creerCommande({
      ...donneesKalia,
      methode_paiement: 'kaliapay',
    });
  }, [creerCommande]);

  const creerCommandeLivraison = useCallback(async (donneesLivraison) => {
    return await creerCommande({
      ...donneesLivraison,
      methode_paiement: 'a_la_livraison',
    });
  }, [creerCommande]);

  const resetState = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setCommandeCreee(null);
  }, []);

  return {
    loading,
    error,
    success,
    commandeCreee,
    creerCommande,
    creerCommandeKaliaPay,
    creerCommandeLivraison,
    resetState,
  };
};

// ====== HOOK POUR ANNULER UNE COMMANDE ======

export const useAnnulerCommande = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const annulerCommande = useCallback(async (commandeId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await CommandeApiService.annulerCommande(commandeId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.message);
        return null;
      }
    } catch (err) {
      const errorInfo = CommandeApiService.handleApiError(err);
      setError(errorInfo.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    annulerCommande,
    loading,
    error,
  };
};

// ====== HOOK POUR LE STATUT DE PAIEMENT KALIAPAY ======

export const useStatutPaiementKalia = (commandeId, autoCheck = false, interval = 10000) => {
  const [statut, setStatut] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verifierStatut = useCallback(async () => {
    if (!commandeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await CommandeApiService.verifierStatutPaiementKalia(commandeId);
      if (result.success) {
        setStatut(result.data);
        return result.data;
      } else {
        setError(result.message);
        return null;
      }
    } catch (err) {
      const errorInfo = CommandeApiService.handleApiError(err);
      setError(errorInfo.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [commandeId]);

  // Vérification automatique périodique
  useEffect(() => {
    let intervalId;

    if (autoCheck && commandeId) {
      // Première vérification immédiate
      verifierStatut();

      // Puis vérifications périodiques
      intervalId = setInterval(verifierStatut, interval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoCheck, commandeId, interval, verifierStatut]);

  return {
    statut,
    loading,
    error,
    verifierStatut,
  };
};

// ====== HOOK POUR RELANCER UN PAIEMENT KALIAPAY ======

export const useRelancerPaiementKalia = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const relancerPaiement = useCallback(async (commandeId, donneesRelance) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await CommandeApiService.relancerPaiementKalia(commandeId, donneesRelance);
      
      if (result.success) {
        setSuccess(true);
        return result.data;
      } else {
        setError({
          message: result.message,
          errors: result.errors,
        });
        return null;
      }
    } catch (err) {
      const errorInfo = CommandeApiService.handleApiError(err);
      setError(errorInfo);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetState = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    relancerPaiement,
    resetState,
  };
};

// ====== HOOK POUR LES STATISTIQUES ======

export const useStatistiquesCommandes = (autoLoad = true) => {
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chargerStatistiques = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await CommandeApiService.obtenirStatistiques();
      if (result.success) {
        setStatistiques(result.data.statistiques);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      chargerStatistiques();
    }
  }, [autoLoad, chargerStatistiques]);

  return {
    statistiques,
    loading,
    error,
    rafraichir: chargerStatistiques,
  };
};

// ====== HOOK POUR LE PANIER (ÉTAT LOCAL) ======

export const usePanier = () => {
  const [produits, setProduits] = useState([]);
  const [boutique, setBoutique] = useState(null);

  const ajouterProduit = useCallback((produit, quantite = 1) => {
    setProduits(prev => {
      const existant = prev.find(p => p.id === produit.id);
      if (existant) {
        return prev.map(p =>
          p.id === produit.id
            ? { ...p, quantite: p.quantite + quantite }
            : p
        );
      } else {
        return [...prev, { ...produit, quantite }];
      }
    });
  }, []);

  const supprimerProduit = useCallback((produitId) => {
    setProduits(prev => prev.filter(p => p.id !== produitId));
  }, []);

  const modifierQuantite = useCallback((produitId, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      supprimerProduit(produitId);
      return;
    }

    setProduits(prev =>
      prev.map(p =>
        p.id === produitId
          ? { ...p, quantite: nouvelleQuantite }
          : p
      )
    );
  }, [supprimerProduit]);

  const viderPanier = useCallback(() => {
    setProduits([]);
    setBoutique(null);
  }, []);

  const definirBoutique = useCallback((nouvelleBoutique) => {
    setBoutique(nouvelleBoutique);
  }, []);

  const total = useMemo(() => {
    return CommandeApiService.calculerTotal(produits);
  }, [produits]);

  const nombreProduits = useMemo(() => {
    return produits.reduce((total, produit) => total + produit.quantite, 0);
  }, [produits]);

  const preparerDonneesCommande = useCallback(() => {
    if (!boutique || produits.length === 0) {
      return null;
    }

    return {
      boutique_id: boutique.id,
      produits: produits.map(p => ({
        id: p.id,
        quantite: p.quantite,
      })),
    };
  }, [boutique, produits]);

  return {
    produits,
    boutique,
    total,
    nombreProduits,
    ajouterProduit,
    supprimerProduit,
    modifierQuantite,
    viderPanier,
    definirBoutique,
    preparerDonneesCommande,
  };
};

// Hook personnalisé pour importer useMemo
import { useMemo } from 'react';