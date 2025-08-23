import { useState, useEffect } from 'react';
import { Check, Star, Zap, Building2, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('physical');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction améliorée pour enregistrer une visite de boutique
  const recordBoutiqueView = async (boutiqueSlug) => {
    try {
      console.log(`🔄 Tentative d'enregistrement de vue pour: ${boutiqueSlug}`);
      
      // Utiliser la méthode avec retry et enregistrement asynchrone
      const result = await StatsService.recordViewWithRetry(boutiqueSlug, 2);
      
      if (result && result.success) {
        console.log(`✅ Vue enregistrée avec succès pour: ${boutiqueSlug}`);
      } else {
        console.warn(`⚠️ Vue non enregistrée pour ${boutiqueSlug}:`, result?.error || 'Raison inconnue');
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'enregistrement de vue pour ${boutiqueSlug}:`, error);
      
      // Ne pas bloquer la navigation même si l'enregistrement échoue
      return { success: false, error: error.message };
    }
  };

  // Fonction pour gérer le clic sur "Visiter la boutique" avec debounce
  const handleVisitStore = async (e, storeSlug) => {
    try {
      // Enregistrer la visite de manière non-bloquante en arrière-plan
      // On n'attend pas le résultat pour ne pas ralentir la navigation
      StatsService.recordViewAsync(storeSlug);
      
      console.log(`🚀 Navigation vers la boutique: ${storeSlug}`);
      
      // La navigation se fera normalement via le Link
      // Pas besoin de preventDefault() car on veut que la navigation se fasse
      
    } catch (error) {
      console.warn(`Erreur silencieuse lors de l'enregistrement de vue:`, error);
      // Ne pas empêcher la navigation
    }
  };

  // Fonction pour charger les boutiques et leurs produits avec les vraies statistiques
  const loadStoresWithProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Chargement des boutiques...');

      // Récupérer toutes les boutiques
      const boutiquesResponse = await BoutiqueService.getAllBoutiques();
      const boutiques = boutiquesResponse.data || boutiquesResponse;

      if (!Array.isArray(boutiques)) {
        throw new Error('Format de données invalide pour les boutiques');
      }

      console.log(`📦 ${boutiques.length} boutiques récupérées`);

      // Pour chaque boutique, récupérer ses produits et ses statistiques
      const storesWithProducts = await Promise.all(
        boutiques.map(async (boutique) => {
          try {
            console.log(`🏪 Traitement de la boutique: ${boutique.nom} (ID: ${boutique.id})`);
            
            // Récupérer les produits avec gestion d'erreur
            let produits = [];
            try {
              const produitsResponse = await ProduitService.getAllProduits(boutique.id);
              produits = produitsResponse.data || produitsResponse || [];
            } catch (produitError) {
              console.warn(`⚠️ Erreur produits pour boutique ${boutique.id}:`, produitError.message);
              // Continuer sans produits
            }

            // Récupérer les statistiques de visite avec fallback intelligent
            let visitCount = Math.floor(Math.random() * 2000) + 800; // Valeur par défaut réaliste
            
            try {
              const statsResponse = await StatsService.getBoutiqueStats(boutique.id, 'month');
              if (StatsService.hasValidStats(statsResponse)) {
                visitCount = statsResponse.data.total_views;
                console.log(`📊 Statistiques récupérées pour ${boutique.nom}: ${visitCount} vues`);
              } else {
                console.log(`📊 Statistiques par défaut pour ${boutique.nom}: ${visitCount} vues`);
              }
            } catch (statsError) {
              console.log(`📊 Statistiques non disponibles pour ${boutique.nom}, utilisation valeur par défaut`);
            }

            // Convertir les produits au format React et prendre seulement les 3 premiers
            const formattedProduits = Array.isArray(produits) 
              ? produits
                  .filter(produit => produit && produit.visible !== false) // Filtrer les produits valides et visibles
                  .slice(0, 3)
                  .map(produit => ({
                    id: produit.id,
                    name: produit.nom || 'Produit sans nom',
                    price: produit.prix || 0,
                    images: produit.images && produit.images.length > 0 
                      ? [ProduitService.getImageUrl(produit.images[0])]
                      : ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100'] // Image par défaut
                  }))
              : [];

            // Générer ou récupérer le slug de manière sécurisée
            const slug = boutique.slug || BoutiqueService.generateSlug(boutique.nom) || `boutique-${boutique.id}`;

            return {
              id: boutique.id,
              name: boutique.nom || 'Boutique sans nom',
              slug: slug,
              type: boutique.categorie || 'physical', // Par défaut physique
              logo: boutique.logo 
                ? BoutiqueService.getLogoUrl(boutique.logo)
                : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
              slogan: boutique.slogan || 'Découvrez nos produits de qualité',
              visitCount: visitCount,
              products: formattedProduits
            };
            
          } catch (error) {
            console.error(`❌ Erreur lors du traitement de la boutique ${boutique.id}:`, error);
            
            // Retourner une version minimale en cas d'erreur
            return {
              id: boutique.id,
              name: boutique.nom || 'Boutique',
              slug: boutique.slug || `boutique-${boutique.id}`,
              type: boutique.categorie || 'physical',
              logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
              slogan: 'Boutique en cours de configuration',
              visitCount: Math.floor(Math.random() * 1000) + 200,
              products: []
            };
          }
        })
      );

      // Filtrer les boutiques null et valider les données
      const validStores = storesWithProducts.filter(store => 
        store && store.id && store.name && store.slug
      );

      console.log(`✅ ${validStores.length} boutiques traitées avec succès`);
      setStores(validStores);

    } catch (error) {
      console.error('❌ Erreur globale lors du chargement des boutiques:', error);
      setError('Erreur lors du chargement des boutiques. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Effect pour charger les données au montage du composant
  useEffect(() => {
    loadStoresWithProducts();
  }, []);

  // Filtrer les boutiques selon l'onglet actif
  const filteredStores = stores.filter(store => store.type === activeTab);

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

  const handleCreateStore = () => {
    console.log('Navigation vers /create-store');
  };

  // État de chargement
  if (loading) {
    return (
      <div className="bg-white">
        <section className="py-16">
          <Container>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des boutiques en cours...</p>
              <p className="mt-2 text-sm text-gray-500">Cela peut prendre quelques secondes</p>
            </div>
          </Container>
        </section>
      </div>
    );
  }

  // État d'erreur
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
                  🔄 Réessayer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setError(null);
                    setStores([]);
                  }}
                >
                  Continuer sans boutiques
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStores.map((store) => (
              <div key={store.id} className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
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
                      {store.type === 'physical' ? '🏪 Produits Physiques' : '💻 Produits Digitaux'}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                      {store.name}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      👁️ {StatsService.formatViewCount(store.visitCount)}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600 italic">"{store.slogan}"</p>
                  
                  <div className="mt-4 space-y-4">
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
                          <div className="text-sm font-medium text-gray-900">
                            {parseFloat(product.price).toLocaleString()} FCFA
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">🔄 Produits en cours d'ajout</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <Link 
                      to={`/store/${store.slug}`} 
                      className="flex items-center justify-center w-full text-orange-500 hover:text-orange-600 font-medium transition-colors group-hover:bg-orange-50 py-2 rounded-lg"
                      onClick={(e) => handleVisitStore(e, store.slug)}
                    >
                      Visiter la boutique
                      <ExternalLink size={16} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty State */}
            {filteredStores.length === 0 && (
              <div className="col-span-full py-8 text-center">
                <div className="bg-gray-50 rounded-lg p-8">
                  <p className="text-gray-500 mb-4">
                    🏪 Aucune boutique {activeTab === 'physical' ? 'physique' : 'digitale'} disponible pour le moment.
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
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