import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Container from '../common/Container';

const Hero = () => {
  return (
    <div className="relative bg-black text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'url("https://images.pexels.com/photos/5980800/pexels-photo-5980800.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px)'
        }}></div>
      </div>
      
      <Container className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">Lancez votre</span>
            <span className="block text-orange-500">boutique en ligne</span>
            <span className="block">en 5 minutes</span>
          </h1>
          <p className="mt-6 text-xl max-w-md mx-auto">
            Démocratiser le e-commerce en Afrique - sans compétence technique, sans frais cachés.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create-store">
              <Button size="lg" variant="primary" icon={<ArrowRight size={20} />} iconPosition="right">
                Créer ma boutique gratuite
              </Button>
            </Link>
            <Link to="#how-it-works">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Comment ça marche
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Simple', description: 'Boutique prête en 5 minutes' },
              { title: 'Mobile-first', description: 'Interface fluide même sur smartphone basique' },
              { title: 'Paiements intégrés', description: 'Mobile Money, Wave, transferts bancaires' }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-white/10 backdrop-blur-sm rounded-lg transition-transform hover:scale-105">
                <h3 className="text-lg font-semibold text-orange-500">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Hero;