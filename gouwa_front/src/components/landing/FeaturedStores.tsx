import { useState, useEffect } from 'react';
import { Check, Star, Zap, Building2, ArrowRight, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BoutiqueService from '../../services/BoutiqueService';
import ProduitService from '../../services/produitService';
import StatsService from '../../services/StatsService';

const Container = ({ children, className = "" }) => (
  <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

const Button = ({ children, variant = "primary", className = "", icon, iconPosition = "left", ...props }) => {
  const baseClasses = "inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500",
    outline: "border-2 border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-500 focus:ring-orange-500"
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </button>
  );
};

const FeaturedStores = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('physical');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NOUVELLE fonction d'enregistrement de vue FORCÉE
  const recordBoutiqueViewForced = async (boutiqueSlug) => {
    try {
      console.log(`[FORCE RECORD VIEW] Tentative d'enregistrement FORCÉ pour: ${boutiqueSlug}`);
      
      if (!boutiqueSlug || typeof boutiqueSlug !== 'string') {
        throw new Error('Slug de boutique invalide');
      }

      if (!StatsService || typeof StatsService.recordView !== 'function') {
        throw new Error('Service de statistiques non disponible');
      }

      // Utiliser la nouvelle méthode d'enregistrement étendu
      const result = await StatsService.recordViewExtended(boutiqueSlug, {
        source: 'featured_stores_list',
        click_context: 'store_card_button',
        force_new_record: true,
        timestamp_precise: Date.now(),
        session_unique_id: `featured_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      
      if (result && result.success) {
        if (result.data && result.data.view_recorded === true) {
          console.log(`[FORCE RECORD VIEW] ✅ Vue EFFECTIVEMENT enregistrée pour: ${boutiqueSlug}`);
          return { success: true, view_recorded: true, data: result };
        } else {
          console.warn(`[FORCE RECORD VIEW] ⚠️ Success mais view_recorded=false pour: ${boutiqueSlug}`);
          // Essayer avec la méthode de retry
          const retryResult = await StatsService.recordView(boutiqueSlug);
          return retryResult;
        }
      } else {
        console.warn(`[FORCE RECORD VIEW] Échec pour ${boutiqueSlug}:`, result?.error || result?.message);
        return { success: false, error: result?.error || result?.message || 'Échec inconnu' };
      }
      
    } catch (error) {
      console.error(`[FORCE RECORD VIEW] Erreur pour ${boutiqueSlug}:`, error.message);
      return { success: false, error: error.message };
    }
  };

  // NOUVELLE fonction de gestion du clic avec stratégies multiples
  const handleVisitStoreAdvanced = async (e, storeSlug) => {
    console.log(`[VISIT STORE ADVANCED] Navigation vers: ${storeSlug}`);
    
    // Navigation immédiate - l'utilisateur ne doit pas attendre
    navigate(`/store/${storeSlug}`);
    
    // Stratégie d'enregistrement multiple (fire-and-forget)
    Promise.resolve().then(async () => {
      console.log(`[BACKGROUND RECORDING] Début enregistrement pour: ${storeSlug}`);
      
      // Stratégie 1: Enregistrement forcé avec données étendues
      try {
        const result1 = await recordBoutiqueViewForced(storeSlug);
        if (result1.success && result1.view_recorded === true) {
          console.log(`[STRATEGY 1] ✅ Enregistrement réussi pour: ${storeSlug}`);
          return; // Succès, pas besoin d'essayer les autres stratégies
        } else {
          console.log(`[STRATEGY 1] ⚠️ Échec, essai stratégie 2 pour: ${storeSlug}`);
        }
      } catch (error) {
        console.warn(`[STRATEGY 1] Erreur pour ${storeSlug}:`, error);
      }
      
      // Stratégie 2: Enregistrement normal avec retry
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Délai court
        const result2 = await StatsService.recordView(storeSlug);
        if (result2.success) {
          console.log(`[STRATEGY 2] ✅ Enregistrement réussi pour: ${storeSlug}`);
          return;
        } else {
          console.log(`[STRATEGY 2] ⚠️ Échec, essai stratégie 3 pour: ${storeSlug}`);
        }
      } catch (error) {
        console.warn(`[STRATEGY 2] Erreur pour ${storeSlug}:`, error);
      }
      
      // Stratégie 3: Enregistrement asynchrone comme fallback
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Délai plus long
        StatsService.recordViewAsync(storeSlug); // Version async non-bloquante
        console.log(`[STRATEGY 3] Enregistrement async lancé pour: ${storeSlug}`);
      } catch (error) {
        console.warn(`[STRATEGY 3] Erreur pour ${storeSlug}:`, error);
      }
      
      console.log(`[BACKGROUND RECORDING] Fin des tentatives pour: ${storeSlug}`);
    }).catch(error => {
      console.warn(`[BACKGROUND RECORDING] Erreur globale pour ${storeSlug}:`, error);
    });
  };

  // Fonction pour récupérer le nombre de vues réel
  const getRealViewCount = async (boutiqueId) => {
    try {
      if (!boutiqueId || boutiqueId <= 0) {
        return 0;
      }

      if (!StatsService || typeof StatsService.getViewCount !== 'function') {
        return 0;
      }

      const statsResult = await StatsService.getViewCount(boutiqueId);
      
      if (statsResult && statsResult.success) {
        const count = statsResult.count || 0;
        console.log(`[VIEW COUNT] Boutique ${boutiqueId}: ${count} vues`);
        return count;
      }
      
      return 0;
      
    } catch (error) {
      console.error(`[VIEW COUNT] Erreur pour boutique ${boutiqueId}:`, error);
      return 0;
    }
  };

  // Fonction pour charger les boutiques
  const loadStoresWithProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[LOAD STORES] Début du chargement des boutiques');
      
      // Récupérer toutes les boutiques
      const boutiquesResponse = await BoutiqueService.getAllBoutiques();
      const boutiques = boutiquesResponse.data || boutiquesResponse;
      
      console.log(`[LOAD STORES] ${boutiques?.length || 0} boutiques récupérées`);
      
      if (!Array.isArray(boutiques)) {
        throw new Error(`Format de données invalide. Attendu: Array, Reçu: ${typeof boutiques}`);
      }
      
      // Traiter chaque boutique en parallèle pour de meilleures performances
      const storesWithProducts = await Promise.all(
        boutiques.map(async (boutique) => {
          try {
            // Récupérer les produits (en parallèle avec les stats)
            const [produitsResponse, realViewCount] = await Promise.allSettled([
              ProduitService.getAllProduits(boutique.id).catch(() => ({ data: [] })),
              getRealViewCount(boutique.id)
            ]);
            
            // Traiter les produits
            const produits = produitsResponse.status === 'fulfilled' 
              ? (produitsResponse.value.data || produitsResponse.value || [])
              : [];
            
            const viewCount = realViewCount.status === 'fulfilled' ? realViewCount.value : 0;
            
            // Formater les produits
            const formattedProduits = Array.isArray(produits) 
              ? produits
                  .filter(produit => produit && produit.visible !== false)
                  .slice(0, 3)
                  .map(produit => ({
                    id: produit.id,
                    name: produit.nom || 'Produit sans nom',
                    price: produit.prix || 0,
                    images: produit.images && produit.images.length > 0 
                      ? [ProduitService.getImageUrl(produit.images[0])]
                      : ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100']
                  }))
              : [];
            
            // Générer le slug
            const slug = boutique.slug || BoutiqueService.generateSlug(boutique.nom) || `boutique-${boutique.id}`;
            
            return {
              id: boutique.id,
              name: boutique.nom || 'Boutique sans nom',
              slug: slug,
              type: boutique.categorie || 'physical',
              logo: boutique.logo 
                ? BoutiqueService.getLogoUrl(boutique.logo)
                : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
              slogan: boutique.slogan || 'Découvrez nos produits de qualité',
              visitCount: viewCount,
              products: formattedProduits,
              status: boutique.status || 'active'
            };
            
          } catch (error) {
            console.error(`[LOAD STORES] Erreur boutique ${boutique.id}:`, error);
            
            // Version minimale en cas d'erreur
            return {
              id: boutique.id,
              name: boutique.nom || 'Boutique',
              slug: boutique.slug || `boutique-${boutique.id}`,
              type: boutique.categorie || 'physical',
              logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
              slogan: 'Boutique en cours de configuration',
              visitCount: 0,
              products: [],
              status: boutique.status || 'active'
            };
          }
        })
      );
      
      // Filtrer les boutiques valides et actives
      const validStores = storesWithProducts.filter(store => {
        return store && store.id && store.name && store.slug && store.status === 'active';
      });
      
      console.log(`[LOAD STORES] ${validStores.length} boutiques valides chargées`);
      setStores(validStores);
      
    } catch (error) {
      console.error('[LOAD STORES] Erreur globale:', error);
      setError('Erreur lors du chargement des boutiques. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // NOUVELLE fonction de test pour le développement avec debug complet
  const testRecordViewComplete = async (slug) => {
    console.log(`[TEST COMPLETE] Test complet pour: ${slug}`);
    
    try {
      // Test de l'enregistrement forcé
      const result1 = await recordBoutiqueViewForced(slug);
      console.log('[TEST COMPLETE] Résultat enregistrement forcé:', result1);
      
      // Attendre un peu puis vérifier le compteur
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const store = stores.find(s => s.slug === slug);
      if (store) {
        const count = await getRealViewCount(store.id);
        console.log('[TEST COMPLETE] Nouveau compteur après enregistrement:', count);
        
        // Mettre à jour l'affichage local
        setStores(prevStores => 
          prevStores.map(s => 
            s.slug === slug ? { ...s, visitCount: count } : s
          )
        );
      }
      
      return { success: true, result: result1 };
      
    } catch (error) {
      console.error('[TEST COMPLETE] Erreur:', error);
      return { success: false, error: error.message };
    }
  };

  // Effect pour exposer les fonctions de test en développement
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.testRecordView = testRecordViewComplete;
      window.debugBoutique = (slug) => {
        const store = stores.find(s => s.slug === slug);
        console.log('DEBUG BOUTIQUE:', { slug, store, stores: stores.length });
        return store;
      };
      
      return () => {
        delete window.testRecordView;
        delete window.debugBoutique;
      };
    }
  }, [stores]);

  // Effect pour charger les données au montage
  useEffect(() => {
    console.log('[MOUNT] Montage du composant FeaturedStores');
    loadStoresWithProducts();
    
    return () => {
      console.log('[UNMOUNT] Démontage du composant FeaturedStores');
    };
  }, []);

  // Filtrer les boutiques selon l'onglet actif
  const filteredStores = stores.filter(store => store.type === activeTab);

  // Plans tarifaires
  const pricingPlans = [
    {
      id: 'gratuit',
      name: 'Gratuit',
      price: '0 FCFA',
      period: '/mois',
      description: '+ 3% de commission par vente',
      popular: false,
      icon: <Star className="w-6 h-6" />,
      gradient: 'from-gray-50 to-gray-100',
      borderColor: 'border-gray-200',
      features: [
        'Création de boutique',
        '3 produits/services max',
        'Lien unique',
        'Paiements Mobile Money',
        'Dashboard basique'
      ],
      buttonText: 'Commencer gratuitement',
      buttonVariant: 'outline'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '10 000 FCFA',
      period: '/mois',
      description: 'Sans commission sur les ventes',
      popular: true,
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      features: [
        'Tout ce qui est inclus en Gratuit',
        'Produits/services illimités',
        'Zéro commission',
        'Personnalisation avancée',
        'Statistiques SEO détaillées',
        'Support prioritaire'
      ],
      buttonText: 'Choisir Pro',
      buttonVariant: 'primary'
    },
    {
      id: 'business',
      name: 'Business',
      price: '25 000 FCFA',
      period: '/mois',
      description: 'Solution complète pour entreprises',
      popular: false,
      icon: <Building2 className="w-6 h-6" />,
      gradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      features: [
        'Tout ce qui est inclus en Pro',
        'Gestion d\'inventaire avancée',
        'Comptes multi-utilisateurs',
        'Rapports exportables',
        'Support dédié'
      ],
      buttonText: 'Contacter l\'équipe',
      buttonVariant: 'outline'
    }
  ];

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="bg-white">
        <section className="py-16">
          <Container>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des boutiques en cours...</p>
              <p className="mt-2 text-sm text-gray-500">Récupération des statistiques réelles</p>
            </div>
          </Container>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white">
        <section className="py-16">
          <Container>
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-600 mb-4 font-medium">{error}</p>
                <Button 
                  variant="primary" 
                  onClick={loadStoresWithProducts}
                  className="mr-3"
                >
                  Réessayer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setError(null);
                    setStores([]);
                  }}
                >
                  Continuer
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Section Boutiques */}
      <section className="py-16">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Découvrez nos boutiques</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Explorez des boutiques qui ont déjà réussi avec boutikplace
            </p>
            
            {/* Tabs */}
            <div className="mt-8 inline-flex p-1 bg-gray-100 rounded-full">
              <button
                onClick={() => setActiveTab('physical')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'physical'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Produits Physiques ({stores.filter(s => s.type === 'physical').length})
              </button>
              <button
                onClick={() => setActiveTab('digital')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'digital'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Produits Digitaux ({stores.filter(s => s.type === 'digital').length})
              </button>
            </div>
            
            {/* Debug Info - Uniquement en développement */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-gray-400">
                Debug: testRecordView('slug-boutique') et debugBoutique('slug') disponibles
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStores.map((store) => (
              <div key={store.id} className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div 
                  className="h-48 bg-gray-200 relative"
                  style={{
                    backgroundImage: `url(${store.logo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="bg-white text-black px-2 py-1 rounded text-xs font-medium inline-block">
                      {store.type === 'physical' ? 'Produits Physiques' : 'Produits Digitaux'}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                      {store.name}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                      {StatsService.formatViewCount(store.visitCount)} vues
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 italic mb-4">"{store.slogan}"</p>
                  
                  <div className="space-y-3 mb-6">
                    {store.products.length > 0 ? (
                      store.products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-3">
                          <div 
                            className="h-10 w-10 rounded bg-gray-200 flex-shrink-0"
                            style={{
                              backgroundImage: `url(${product.images[0]})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {parseFloat(product.price).toLocaleString()} FCFA
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Produits en cours d'ajout</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <button
                      onClick={(e) => handleVisitStoreAdvanced(e, store.slug)}
                      className="flex items-center justify-center w-full bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 font-medium transition-all py-2 px-4 rounded-lg border border-orange-200 hover:border-orange-300"
                    >
                      Visiter la boutique
                      <ExternalLink size={16} className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty State */}
            {filteredStores.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
                  <div className="text-4xl mb-4">
                    {activeTab === 'physical' ? '🏪' : '💻'}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune boutique {activeTab === 'physical' ? 'physique' : 'digitale'} disponible
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Soyez le premier à créer votre boutique dans cette catégorie !
                  </p>
                  <Link to="/create-store">
                    <Button variant="primary" icon={<ArrowRight size={16} />} iconPosition="right">
                      Créer ma boutique
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/create-store">
              <Button 
                variant="primary" 
                icon={<ArrowRight size={16} />} 
                iconPosition="right"
                className="text-lg px-8 py-4"
              >
                Créer ma boutique maintenant
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Section Offres */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <Container>
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-orange-100 rounded-full mb-4">
              <Star className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choisissez votre plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des solutions adaptées à tous les besoins, de l'entrepreneur débutant à l'entreprise établie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative bg-gradient-to-br ${plan.gradient} rounded-2xl border-2 ${plan.borderColor} p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-orange-200 ring-opacity-50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                      ⭐ Populaire
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    plan.popular ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'
                  } shadow-lg`}>
                    {plan.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <Button 
                    variant={plan.buttonVariant}
                    className={`w-full ${plan.popular ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' : ''}`}
                    onClick={() => console.log(`Plan sélectionné: ${plan.name}`)}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6">
              Besoin d'aide pour choisir ? Notre équipe est là pour vous accompagner
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline"
                onClick={() => console.log('Comparer les plans')}
              >
                📊 Comparer les plans
              </Button>
              <Button 
                variant="primary"
                onClick={() => console.log('Parler à un expert')}
              >
                💬 Parler à un expert
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default FeaturedStores;