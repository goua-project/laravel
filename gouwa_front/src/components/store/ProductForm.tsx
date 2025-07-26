import { useState, useEffect } from 'react';
import { Product, useStore } from '../../contexts/StoreContext';
import Button from '../common/Button';
import { ImagePlus, Trash2, Save, ArrowLeft, FileText, Video, Music, Book, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProduitService from '../../services/produitService';

interface ProductFormProps {
  productId?: string;
}

type DigitalProductType = 'pdf' | 'video' | 'audio' | 'ebook' | 'other';

const ProductForm: React.FC<ProductFormProps> = ({ productId }) => {
  const { currentStore } = useStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isDigital, setIsDigital] = useState(false);
  const [inStock, setInStock] = useState('0');
  const [isVisible, setIsVisible] = useState(true);
  const [images, setImages] = useState<(string | File)[]>(['']);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [shippingFrom, setShippingFrom] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [digitalProductType, setDigitalProductType] = useState<DigitalProductType>('pdf');
  const [fileSize, setFileSize] = useState('');
  const [duration, setDuration] = useState('');
  const [format, setFormat] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  useEffect(() => {
    if (currentStore?.type === 'digital') {
      setIsDigital(true);
    }
    
    if (productId && currentStore) {
      loadProduct();
    }
  }, [productId, currentStore]);

  const loadProduct = async () => {
    if (!currentStore || !productId) return;
    
    try {
      setIsLoading(true);
      const response = await ProduitService.getProduitById(currentStore.id, productId);
      const product = ProduitService.convertToReactFormat(response.data);
      
      setName(product.name);
      setPrice(product.price.toString());
      setDescription(product.description);
      setCategory(product.category);
      setTags(product.tags.join(', '));
      setIsDigital(product.isDigital);
      setInStock(product.inStock.toString());
      setIsVisible(product.isVisible);
      setImages(product.images);
      setShippingFrom(product.shippingFrom || '');
      setDeliveryTime(product.deliveryTime || '');
      setDownloadLink(product.downloadLink || '');
      setServiceType(product.serviceType || '');
      setDigitalProductType(product.digitalProductType || 'pdf');
      setFileSize(product.fileSize || '');
      setDuration(product.duration || '');
      setFormat(product.format || '');
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
      setErrors(['Erreur lors du chargement du produit']);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStore) return;
    
    setIsLoading(true);
    setErrors([]);
    
    try {
      // Créer l'objet productData avec toutes les données du formulaire
      const productData = {
        name: name.trim(),
        price: price,
        description: description.trim(),
        category: category.trim(),
        tags: tags.trim(),
        isDigital,
        inStock: parseInt(inStock) || 0,
        isVisible,
        images: images.filter(img => img && (typeof img === 'string' ? img.trim() : img)),
        shippingFrom: !isDigital ? shippingFrom.trim() : '',
        deliveryTime: !isDigital ? deliveryTime.trim() : '',
        downloadLink: isDigital ? downloadLink.trim() : '',
        serviceType: serviceType.trim(),
        digitalProductType,
        fileSize: fileSize.trim(),
        duration: duration.trim(),
        format: format.trim(),
      };
      
      console.log('Product data before conversion:', productData);
      
      // Convertir les données au format Laravel
      const laravelData = ProduitService.convertToLaravelFormat(productData);
      
      console.log('Laravel data after conversion:', laravelData);
      
      // Validation côté client
      const validationErrors = ProduitService.validateProduitData(laravelData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }
      
      let response;
      if (productId) {
        response = await ProduitService.updateProduit(currentStore.id, productId, laravelData);
      } else {
        response = await ProduitService.createProduit(currentStore.id, laravelData);
      }
      
      console.log('API Response:', response);
      
      if (response.success || response.data) {
        navigate('/dashboard/products');
      } else {
        setErrors([response.message || 'Une erreur est survenue']);
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.message) {
        setErrors([error.message]);
      } else {
        setErrors(['Une erreur est survenue lors de la sauvegarde']);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddImage = () => {
    setImages([...images, '']);
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleFileUpload = (index: number, file: File | null) => {
    if (file) {
      const newImages = [...images];
      newImages[index] = file;
      setImages(newImages);
    }
  };
  
  const getDigitalProductTypeIcon = () => {
    switch (digitalProductType) {
      case 'pdf':
        return <FileText size={20} className="text-gray-400" />;
      case 'video':
        return <Video size={20} className="text-gray-400" />;
      case 'audio':
        return <Music size={20} className="text-gray-400" />;
      case 'ebook':
        return <Book size={20} className="text-gray-400" />;
      default:
        return <Archive size={20} className="text-gray-400" />;
    }
  };
  
  if (!currentStore) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vous devez d'abord créer une boutique.</p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate('/create-store')}
        >
          Créer une boutique
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
        <button
          type="button"
          onClick={() => navigate('/dashboard/products')}
          className="mr-3 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          {productId ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
        </h2>
      </div>

      {errors.length > 0 && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800">
            <h3 className="font-medium">Erreurs de validation :</h3>
            <ul className="mt-2 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit*
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
              placeholder="Ex: Formation Marketing Digital"
            />
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Prix (FCFA)*
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
              placeholder="Ex: 15000"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
              placeholder="Ex: Formation"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
              placeholder="Décrivez votre produit en détail..."
            ></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
              placeholder="Ex: formation, marketing, digital"
            />
          </div>
          
          <div>
            <label htmlFor="isDigital" className="block text-sm font-medium text-gray-700 mb-1">
              Type de produit*
            </label>
            <select
              id="isDigital"
              value={isDigital ? 'digital' : 'physical'}
              onChange={(e) => setIsDigital(e.target.value === 'digital')}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
            >
              <option value="">Sélectionner un type</option>
              <option value="physical">Produit Physique</option>
              <option value="digital">Produit Digital</option>
            </select>
          </div>
          
          {!isDigital && (
            <div>
              <label htmlFor="inStock" className="block text-sm font-medium text-gray-700 mb-1">
                Quantité en stock*
              </label>
              <input
                type="number"
                id="inStock"
                value={inStock}
                onChange={(e) => setInStock(e.target.value)}
                required={!isDigital}
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                placeholder="Ex: 10"
              />
            </div>
          )}
          
          {!isDigital && currentStore.type === 'physical' && (
            <>
              <div>
                <label htmlFor="shippingFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu d'expédition
                </label>
                <input
                  type="text"
                  id="shippingFrom"
                  value={shippingFrom}
                  onChange={(e) => setShippingFrom(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder="Ex: Abidjan"
                />
              </div>
              
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Délai de livraison
                </label>
                <input
                  type="text"
                  id="deliveryTime"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder="Ex: 3-5 jours"
                />
              </div>
            </>
          )}
          
          {(isDigital || currentStore.type === 'digital') && (
            <>
              <div>
                <label htmlFor="digitalProductType" className="block text-sm font-medium text-gray-700 mb-1">
                  Type de produit digital
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {getDigitalProductTypeIcon()}
                  </div>
                  <select
                    id="digitalProductType"
                    value={digitalProductType}
                    onChange={(e) => setDigitalProductType(e.target.value as DigitalProductType)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  >
                    <option value="pdf">Document PDF</option>
                    <option value="video">Vidéo</option>
                    <option value="audio">Audio</option>
                    <option value="ebook">E-book</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <input
                  type="text"
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder={
                    digitalProductType === 'pdf' ? "Ex: PDF" :
                    digitalProductType === 'video' ? "Ex: MP4, 1080p" :
                    digitalProductType === 'audio' ? "Ex: MP3, 320kbps" :
                    digitalProductType === 'ebook' ? "Ex: EPUB, MOBI" :
                    "Ex: ZIP, RAR"
                  }
                />
              </div>

              <div>
                <label htmlFor="fileSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Taille du fichier
                </label>
                <input
                  type="text"
                  id="fileSize"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder="Ex: 500 MB"
                />
              </div>

              {(digitalProductType === 'video' || digitalProductType === 'audio') && (
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Durée
                  </label>
                  <input
                    type="text"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                    placeholder="Ex: 2h 30min"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label htmlFor="downloadLink" className="block text-sm font-medium text-gray-700 mb-1">
                  Lien de téléchargement*
                </label>
                <input
                  type="url"
                  id="downloadLink"
                  value={downloadLink}
                  onChange={(e) => setDownloadLink(e.target.value)}
                  required={isDigital}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                  placeholder="https://example.com/download/file"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Lien sécurisé vers votre fichier. Utilisez un service de stockage cloud comme Google Drive ou Dropbox.
                </p>
              </div>
            </>
          )}
          
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Images du produit*
              </label>
              <button
                type="button"
                onClick={handleAddImage}
                className="text-sm text-orange-500 flex items-center"
              >
                <ImagePlus size={16} className="mr-1" /> Ajouter une image
              </button>
            </div>
            
            <div className="space-y-3">
              {images.map((image, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={typeof image === 'string' ? image : ''}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2.5"
                      placeholder="URL de l'image (https://...)"
                      required={index === 0 && !(image instanceof File)}
                      disabled={image instanceof File}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">ou</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      disabled={typeof image === 'string' && image.trim() !== ''}
                    />
                  </div>
                  
                  {image instanceof File && (
                    <div className="text-sm text-green-600 flex items-center">
                      <span>✓ Fichier sélectionné: {image.name}</span>
                      <button
                        type="button"
                        onClick={() => handleImageChange(index, '')}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Vous pouvez utiliser des URLs d'images (JPG, PNG) ou uploader des fichiers. La première image sera l'image principale.
            </p>
          </div>
          
          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isVisible"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="isVisible" className="ml-2 block text-sm text-gray-700">
                Rendre ce produit visible dans ma boutique
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/products')}
          >
            Annuler
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            icon={<Save size={16} />}
            iconPosition="left"
          >
            {productId ? 'Enregistrer les modifications' : 'Ajouter le produit'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;