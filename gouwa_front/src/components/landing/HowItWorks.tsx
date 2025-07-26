import { CheckCircle, Smartphone, CreditCard, Search, Zap, ShoppingCart, DollarSign, TrendingUp, Package, Users, Star } from 'lucide-react';

const steps = [
  {
    icon: <CheckCircle className="h-10 w-10 text-orange-500" />,
    title: 'Inscrivez-vous',
    description: 'Créez votre compte en quelques secondes avec votre email ou votre numéro de téléphone.',
  },
  {
    icon: <Smartphone className="h-10 w-10 text-orange-500" />,
    title: 'Créez votre boutique',
    description: 'Personnalisez votre boutique avec votre nom, logo, et ajoutez vos premiers produits.',
  },
  {
    icon: <CreditCard className="h-10 w-10 text-orange-500" />,
    title: 'Vendez vos produits',
    description: 'Recevez des paiements via Mobile Money, Wave ou transferts bancaires.',
  },
  {
    icon: <Search className="h-10 w-10 text-orange-500" />,
    title: 'Gagnez en visibilité',
    description: 'Votre boutique est optimisée pour les moteurs de recherche et facilement partageable.',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Comment ça marche</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Lancez votre activité en ligne en quelques minutes avec boutikplace. Aucune compétence technique requise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
              <div className="absolute -right-10 -top-10 w-20 h-20 bg-orange-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="mb-4 flex justify-center">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                <div className="mt-4 flex justify-center">
                  <div className="h-1 w-16 bg-orange-500 rounded"></div>
                </div>
              </div>
              <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold rounded-bl-lg w-8 h-8 flex items-center justify-center">
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Bannière e-commerce avec animations orange et noir */}
        <div className="mt-16 bg-gradient-to-br from-black via-gray-900 to-orange-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          
          {/* Paniers d'achat animés en arrière-plan - Adaptatifs mobile */}
          <div className="absolute top-8 left-4 sm:top-12 sm:left-12 animate-bounce" style={{animationDuration: '3s', animationDelay: '0.5s'}}>
            <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6 text-orange-400 opacity-60" />
          </div>
          <div className="absolute top-1/3 right-4 sm:right-12 animate-bounce" style={{animationDuration: '2.5s', animationDelay: '1.2s'}}>
            <ShoppingCart className="h-5 w-5 sm:h-8 sm:w-8 text-orange-300 opacity-40" />
          </div>
          <div className="absolute bottom-20 left-1/4 sm:bottom-16 animate-pulse" style={{animationDuration: '2s'}}>
            <ShoppingCart className="h-3 w-3 sm:h-5 sm:w-5 text-orange-500 opacity-50" />
          </div>
          <div className="absolute top-12 right-1/4 sm:top-16 sm:right-1/3 animate-bounce" style={{animationDuration: '2.8s', animationDelay: '0.8s'}}>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400 opacity-70" />
          </div>
          <div className="absolute bottom-16 right-6 sm:bottom-12 sm:right-12 animate-pulse" style={{animationDuration: '1.8s', animationDelay: '1.5s'}}>
            <ShoppingCart className="h-4 w-4 sm:h-7 sm:w-7 text-orange-300 opacity-45" />
          </div>

          {/* Formes géométriques flottantes - Réduites sur mobile */}
          <div className="absolute top-6 right-16 sm:top-8 sm:right-24 w-4 h-4 sm:w-6 sm:h-6 bg-orange-400 rounded-full animate-bounce" style={{animationDuration: '2s', animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-24 left-8 sm:bottom-20 sm:left-16 w-3 h-3 sm:w-4 sm:h-4 bg-orange-300 rotate-45 animate-bounce" style={{animationDuration: '2.5s', animationDelay: '1s'}}></div>
          <div className="absolute top-1/4 left-16 sm:left-28 w-2 h-2 sm:w-3 sm:h-3 bg-orange-400 animate-pulse" style={{animationDuration: '1.5s'}}></div>
          <div className="absolute top-3/4 right-12 sm:right-20 w-3 h-1 sm:w-5 sm:h-2 bg-orange-300 rounded-full animate-pulse" style={{animationDuration: '2s', animationDelay: '0.8s'}}></div>
          
          {/* Notifications de vente animées - Cachées sur très petit écran */}
          <div className="hidden sm:block absolute top-8 left-1/3 bg-orange-500 bg-opacity-20 backdrop-blur-sm rounded-lg p-3 animate-pulse border border-orange-400 border-opacity-30 z-20" style={{animationDuration: '3s'}}>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></div>
              <ShoppingCart className="h-4 w-4 mr-2 text-orange-300" />
              Nouvelle vente !
            </div>
          </div>
          
          <div className="hidden md:block absolute top-1/2 right-8 bg-orange-600 bg-opacity-20 backdrop-blur-sm rounded-lg p-3 animate-pulse border border-orange-400 border-opacity-30 z-20" style={{animationDuration: '2.5s', animationDelay: '1.5s'}}>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
              <Users className="h-4 w-4 mr-1 text-orange-300" />
              +12 clients
            </div>
          </div>

          {/* Formes géométriques qui tournent - Réduites sur mobile */}
          <div className="absolute top-1/3 right-20 sm:right-32 w-3 h-3 sm:w-4 sm:h-4 bg-orange-400 rotate-45 animate-spin" style={{animationDuration: '4s'}}></div>
          <div className="absolute bottom-1/3 left-1/4 sm:left-1/3 w-2 h-2 sm:w-3 sm:h-3 bg-orange-300 rounded-full animate-spin" style={{animationDuration: '5s', animationDelay: '2s'}}></div>

          {/* Cercles pulsants orange - Adaptés pour mobile */}
          <div className="absolute top-16 right-24 sm:top-20 sm:right-40 w-8 h-8 sm:w-12 sm:h-12 border-2 border-orange-500 border-opacity-40 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
          <div className="absolute bottom-24 left-20 sm:bottom-20 sm:left-32 w-6 h-6 sm:w-8 sm:h-8 border border-orange-400 border-opacity-50 rounded-full animate-pulse" style={{animationDuration: '2s'}}></div>
          
          {/* Barres de progression des ventes - Cachées sur mobile */}
          <div className="hidden sm:block absolute top-6 left-1/2 w-20 sm:w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full animate-pulse" style={{width: '75%', animationDuration: '1.8s'}}></div>
          </div>
          <div className="hidden sm:block absolute bottom-6 right-1/3 w-16 sm:w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-600 to-orange-500 rounded-full animate-pulse" style={{width: '90%', animationDuration: '2.2s'}}></div>
          </div>

          {/* Particules flottantes type monnaie avec paniers - Réduites sur mobile */}
          <div className="absolute top-1/4 left-12 sm:left-20 w-2 h-2 sm:w-3 sm:h-3 bg-orange-400 rounded-full animate-bounce" style={{animationDuration: '2s', animationDelay: '0.3s'}}></div>
          <div className="absolute top-3/4 right-16 sm:right-28 w-1 h-1 sm:w-2 sm:h-2 bg-orange-300 rounded-full animate-bounce" style={{animationDuration: '1.8s', animationDelay: '0.8s'}}></div>
          <div className="absolute top-1/2 right-24 sm:right-36 w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full animate-ping opacity-60" style={{animationDuration: '2.5s', animationDelay: '1.2s'}}></div>

          {/* Vagues de fond subtiles */}
          <div className="absolute inset-0 opacity-10">
            <svg className="absolute w-full h-full" viewBox="0 0 400 200" fill="none">
              <path d="M0,60 Q100,40 200,60 T400,60 L400,0 L0,0 Z" fill="orange" className="animate-pulse" style={{animationDuration: '4s'}}>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; -200 0; 0 0"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
          
          {/* Contenu principal */}
          <div className="relative z-30 text-center px-2 sm:px-4">
            <div className="flex justify-center mb-4">
              <div className="bg-orange-500 p-2 sm:p-3 rounded-full">
                
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
               Offre de lancement - 30 jours gratuits !
            </h3>
            <p className="text-base sm:text-lg mb-6 max-w-2xl mx-auto opacity-90">
              Profitez de notre offre exceptionnelle : créez votre boutique maintenant et bénéficiez de 30 jours d'essai gratuit avec toutes les fonctionnalités premium.
            </p>
            <div className="flex flex-col gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto">
                Commencer maintenant
              </button>
              <span className="text-xs sm:text-sm opacity-75 text-center">
                Sans engagement • Annulation possible à tout moment
              </span>
            </div>
          </div>

          {/* Compteur de ventes en temps réel - Adapté mobile */}
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-2 sm:p-4 border border-orange-500 border-opacity-30 z-30 max-w-40 sm:max-w-xs">
            <div className="flex items-center text-xs sm:text-sm mb-1 sm:mb-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1 sm:mr-2 animate-pulse"></div>
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-orange-300" />
              <span className="text-orange-300 font-semibold text-xs sm:text-sm">2,847 boutiques</span>
            </div>
            <div className="text-xs text-gray-300 flex items-center">
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-green-400" />
              <span className="text-xs">+23 ventes/h</span>
            </div>
          </div>

          {/* Statistiques de revenus - Adaptées mobile */}
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-2 sm:p-4 border border-orange-500 border-opacity-30 z-30 max-w-36 sm:max-w-xs">
            <div className="text-xs sm:text-sm text-orange-300 font-semibold flex items-center">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs">Revenus/jour</span>
            </div>
            <div className="text-sm sm:text-lg font-bold text-white flex items-center">
              <Package className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-orange-400" />
              <span className="text-xs sm:text-base">12,45M FCFA</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;