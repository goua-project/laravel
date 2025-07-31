import { useState } from 'react';
import { StoreType } from '../../contexts/StoreContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import { ShoppingBag, Laptop, Eye, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BoutiqueService from '../../services/BoutiqueService';

const StoreForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [storeType, setStoreType] = useState<StoreType | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [storeSlogan, setStoreSlogan] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#F25539');
  const [keywords, setKeywords] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const handleStoreTypeSelect = (type: StoreType) => {
    setStoreType(type);
    setStep(2);
    setError('');
  };
  
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setStoreName(name);
    
    // Generate slug from name using the static service method
    if (name.trim()) {
      const slug = BoutiqueService.generateSlug(name);
      setStoreSlug(slug);
    } else {
      setStoreSlug('');
    }
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
      setError('');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Le logo doit être au format JPEG, PNG, JPG ou GIF');
        e.target.value = '';
        return;
      }
      
      // Vérifier la taille (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('Le logo ne doit pas dépasser 2MB');
        e.target.value = '';
        return;
      }
      
      setLogo(file);
      setError('');
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!storeType) {
      errors.push('Veuillez sélectionner un type de boutique');
    }
    
    if (!storeName.trim()) {
      errors.push('Le nom de la boutique est obligatoire');
    }
    
    if (!storeDescription.trim()) {
      errors.push('La description est obligatoire');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setError('');
    setValidationErrors([]);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!user) {
        setError('Vous devez être connecté pour créer une boutique');
        setIsLoading(false);
        return;
      }

      // Préparer les données - S'assurer que les champs requis sont présents et valides
      const boutiqueData = {
        nom: storeName.trim(),
        slogan: storeSlogan.trim() || undefined,
        description: storeDescription.trim(),
        categorie: storeType as string,
        couleur_accent: accentColor,
        mots_cles: keywords.trim() || undefined,
        logo: logo || undefined
      };

      // Validation côté client avec le service
      const clientValidationErrors = BoutiqueService.validateBoutiqueData(boutiqueData);
      if (clientValidationErrors.length > 0) {
        setValidationErrors(clientValidationErrors);
        setIsLoading(false);
        return;
      }

      console.log('Données de la boutique à envoyer:', boutiqueData);

      // Créer FormData
      const formData = BoutiqueService.createFormData(boutiqueData);

      // Debug: Afficher le contenu du FormData
      console.log('Contenu du FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // Envoyer la requête
      const response = await BoutiqueService.createBoutique(formData);
      console.log('Réponse du serveur:', response);

      if (response.success) {
        // Rediriger vers le dashboard après un délai court
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              message: 'Boutique créée avec succès ! Un plan gratuit a été automatiquement activé.',
              type: 'success' 
            }
          });
        }, 500);
      } else {
        setError(response.message || 'Une erreur est survenue lors de la création de la boutique');
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la création de la boutique:', error);
      
      // Gérer les différents types d'erreurs avec une meilleure structure
      if (error?.response) {
        const { status, data } = error.response;
        console.log('Détails de l\'erreur:', { status, data });
        
        if (status === 422 && data?.errors) {
          // Erreurs de validation Laravel
          const serverErrors = Object.values(data.errors).flat() as string[];
          setValidationErrors(serverErrors);
          setError('Veuillez corriger les erreurs ci-dessus');
        } else if (status === 403) {
          setError('Vous avez déjà une boutique active. Contactez le support pour en créer une supplémentaire.');
        } else if (status === 401) {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
        } else if (status === 500) {
          setError('Erreur serveur interne. Vérifiez les logs du serveur pour plus de détails.');
          console.error('Erreur 500 - Vérifiez:', {
            'Token présent': !!localStorage.getItem('token'),
            'Utilisateur connecté': !!user
          });
        } else {
          setError(data?.message || `Erreur serveur (${status})`);
        }
      } else if (error?.message) {
        if (error.message.includes('500')) {
          setError('Erreur serveur interne. Vérifiez la connexion à la base de données et les logs du serveur.');
        } else if (error.message.includes('422') || error.message.includes('validation')) {
          setError('Données invalides. Veuillez vérifier les informations saisies.');
        } else if (error.message.includes('403')) {
          setError('Vous avez déjà une boutique active. Contactez le support pour en créer une supplémentaire.');
        } else if (error.message.includes('401')) {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Erreur de connexion. Vérifiez que le serveur est démarré et accessible.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
      setError('');
    }
  };

  // Composant simple pour le bouton de soumission
  const SubmitButton = () => {
    if (isLoading) {
      return (
        <button
          type="submit"
          disabled
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-400 cursor-not-allowed"
        >
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Création en cours...
        </button>
      );
    }

    return (
      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
      >
        Créer ma boutique
        <ChevronRight className="ml-2 h-4 w-4" />
      </button>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Créer votre boutique</h2>
          <div className="text-sm text-gray-500">
            {step === 1 ? 'Étape 1/2' : 'Étape 2/2'}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-300 ease-out"
            style={{ width: step === 1 ? '50%' : '100%' }}
          ></div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Affichage des erreurs générales */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Affichage des erreurs de validation */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation :</h4>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Information sur le plan gratuit */}
        {step === 2 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-1">Plan gratuit inclus</h4>
                <p className="text-sm text-green-700">
                  Votre boutique sera créée avec un plan gratuit automatique qui vous permet de commencer immédiatement avec jusqu'à 3 produits.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 1 ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choisissez le type de boutique</h3>
            <p className="text-gray-600 mb-6">
              Ce choix détermine les fonctionnalités disponibles pour votre boutique.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleStoreTypeSelect('physical')}
                className={`flex flex-col items-center p-6 border-2 rounded-lg text-center transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  storeType === 'physical'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag size={48} className="text-orange-500 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Produits Physiques</h4>
                <p className="text-sm text-gray-600">
                  Vendez des objets réels qui nécessitent une livraison physique.
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => handleStoreTypeSelect('digital')}
                className={`flex flex-col items-center p-6 border-2 rounded-lg text-center transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  storeType === 'digital'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Laptop size={48} className="text-orange-500 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Produits Digitaux / Services</h4>
                <p className="text-sm text-gray-600">
                  Vendez des fichiers digitaux, formations, services ou prestations.
                </p>
              </button>
            </div>
            
            <p className="mt-8 text-sm text-gray-500 italic">
              Note: Ce choix n'est pas modifiable après la création de la boutique.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la boutique <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="store-name"
                  value={storeName}
                  onChange={handleStoreNameChange}
                  required
                  maxLength={255}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder="Ex: La Pagneuse"
                />
              </div>
              
              <div>
                <label htmlFor="store-slug" className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la boutique
                </label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    gouadan.com/
                  </span>
                  <input
                    type="text"
                    id="store-slug"
                    value={storeSlug}
                    onChange={handleInputChange(setStoreSlug)}
                    required
                    className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  L'URL sera générée automatiquement à partir du nom, mais vous pouvez la personnaliser
                </p>
              </div>
              
              <div>
                <label htmlFor="store-slogan" className="block text-sm font-medium text-gray-700 mb-1">
                  Slogan / Tagline
                </label>
                <input
                  type="text"
                  id="store-slogan"
                  value={storeSlogan}
                  onChange={handleInputChange(setStoreSlogan)}
                  maxLength={255}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder="Une phrase qui décrit votre activité"
                />
              </div>
              
              <div>
                <label htmlFor="store-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="store-description"
                  rows={4}
                  value={storeDescription}
                  onChange={handleInputChange(setStoreDescription)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder="Décrivez votre boutique en quelques phrases..."
                ></textarea>
              </div>

              <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                  Mots-clés
                </label>
                <input
                  type="text"
                  id="keywords"
                  value={keywords}
                  onChange={handleInputChange(setKeywords)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder="Ex: mode, vêtements, accessoires (séparés par des virgules)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ajoutez des mots-clés pour aider les clients à trouver votre boutique
                </p>
              </div>

              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                  Logo de la boutique
                </label>
                <input
                  type="file"
                  id="logo"
                  accept=".jpeg,.jpg,.png,.gif"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Formats acceptés: JPEG, PNG, JPG, GIF. Taille max: 2MB
                </p>
                {logo && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Fichier sélectionné: {logo.name}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="accent-color" className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur d'accent
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="accent-color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-10 border-0 rounded-md cursor-pointer"
                  />
                  <div className="text-sm text-gray-600">
                    Cette couleur sera utilisée pour les boutons et éléments accentués de votre boutique.
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              <div className="mt-8 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Aperçu</h4>
                  <button type="button" className="text-sm text-orange-500 flex items-center hover:text-orange-600">
                    <Eye size={16} className="mr-1" /> Vue complète
                  </button>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="h-16 bg-gray-800 flex items-center px-4">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      {storeType === 'physical' ? (
                        <ShoppingBag size={16} style={{ color: accentColor }} />
                      ) : (
                        <Laptop size={16} style={{ color: accentColor }} />
                      )}
                    </div>
                    <div className="ml-2 text-white">
                      <div className="font-medium">{storeName || 'Nom de la boutique'}</div>
                      <div className="text-xs text-gray-300">{storeSlogan || 'Slogan de la boutique'}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {storeDescription || 'Description de la boutique...'}
                    </div>
                    <button
                      type="button"
                      className="text-sm rounded-md px-4 py-2 text-white transition-colors"
                      style={{ backgroundColor: accentColor }}
                    >
                      Voir les produits
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retour
              </button>
              
              <SubmitButton />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StoreForm;