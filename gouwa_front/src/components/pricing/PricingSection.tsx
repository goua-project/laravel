import { Check } from 'lucide-react';
import Container from '../common/Container';
import Button from '../common/Button';

const plans = [
  {
    name: 'Gratuit',
    price: 0,
    description: 'Parfait pour démarrer votre activité en ligne',
    features: [
      'Jusqu\'à 10 produits',
      'Page boutique personnalisée',
      'Paiements Mobile Money',
      'Support email',
    ],
  },
  {
    name: 'Pro',
    price: 9900,
    description: 'Pour les vendeurs qui veulent se développer',
    features: [
      'Produits illimités',
      'Domaine personnalisé',
      'Tous les moyens de paiement',
      'Analytics avancés',
      'Support prioritaire',
      'Pas de frais de transaction',
    ],
    popular: true,
  },
  {
    name: 'Entreprise',
    price: 49900,
    description: 'Solutions sur mesure pour les grandes entreprises',
    features: [
      'Tout le plan Pro',
      'API personnalisée',
      'Intégrations sur mesure',
      'Account manager dédié',
      'SLA garanti',
      'Formation équipe',
    ],
  },
];

const PricingSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Choisissez votre plan
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Des solutions adaptées à tous les besoins, de l'entrepreneur individuel à la grande entreprise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                plan.popular ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-orange-500 text-white text-center text-sm font-medium py-1">
                  Populaire
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} FCFA`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 text-sm">/mois</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="ml-3 text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {plan.name === 'Entreprise' ? 'Contactez-nous' : 'Commencer'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-orange-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-900">
                Offre de lancement 
              </h3>
              <p className="mt-1 text-orange-700">
                -50% sur le plan Pro pendant 3 mois pour tout nouveau compte créé avant le 31 mars !
              </p>
            </div>
            <Button variant="primary">
              En profiter
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default PricingSection;