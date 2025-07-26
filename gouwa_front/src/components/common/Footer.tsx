import { Link } from 'react-router-dom';
import Container from './Container';
import { ShoppingBag, Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white mt-16">
      <Container>
        <div className="pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center mb-4">
                <ShoppingBag className="h-8 w-8 text-orange-500" />
                <span className="ml-2 text-xl font-bold">Gouwadan</span>
              </Link>
              <p className="text-gray-400 mb-4">
                Démocratiser le e-commerce en Afrique, en permettant à toute personne de lancer sa mini-boutique en ligne en quelques minutes.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Facebook size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Boutiques</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Explorer</Link></li>
                <li><Link to="/create-store" className="text-gray-400 hover:text-white transition-colors">Créer une boutique</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Boutiques tendances</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Catégories</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Ressources</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Comment ça marche</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Guides des vendeurs</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">À propos</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Nous contacter</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Conditions d'utilisation</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Politique de confidentialité</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="py-6 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} gouwadan. Tous droits réservés.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;