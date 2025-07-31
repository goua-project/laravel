import { X } from 'lucide-react';
import Button from '../components/common/Button';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  currentPlan: string;
  onUpgrade: () => void;
}

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  message,
  currentPlan,
  onUpgrade
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-in">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Limite de produits atteinte
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4 whitespace-pre-line">{message}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-blue-800 mb-1">
                  Plan actuel: {currentPlan}
                </h4>
                <p className="text-sm text-blue-700">
                  Les plans supérieurs offrent plus de produits et des fonctionnalités avancées pour développer votre boutique.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Continuer avec les limites actuelles
          </Button>
          <Button
            variant="primary"
            onClick={onUpgrade}
          >
            Voir les abonnements
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlanModal;