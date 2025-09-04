import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useToast } from './ui/Toast';
import { reviewsAPI } from '../services/api';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  productName: string;
  productType: 'digital' | 'physical';
  onReviewSubmitted?: () => void;
  isAuthenticated?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  productName,
  productType,
  onReviewSubmitted,
  isAuthenticated = false
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      showToast('warning', 'Note requise', 'Veuillez sélectionner une note');
      return;
    }

    if (!comment.trim()) {
      showToast('warning', 'Commentaire requis', 'Veuillez saisir un commentaire');
      return;
    }

    if (!isAuthenticated && (!guestName.trim() || !guestEmail.trim())) {
      showToast('warning', 'Informations requises', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      
      const reviewData = {
        rating,
        comment: comment.trim(),
        ...(isAuthenticated ? {} : {
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim()
        })
      };

      await reviewsAPI.createReview(productId, reviewData);
      
      showToast('success', 'Avis envoyé', 'Votre avis a été soumis et sera modéré avant publication');
      
      // Reset form
      setRating(0);
      setComment('');
      setGuestName('');
      setGuestEmail('');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible d\'envoyer votre avis');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none"
          >
            <Star
              size={24}
              className={`transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 && `${rating}/5`}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Laisser un avis sur "{productName}"
      </h3>
      
      <div className="mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          productType === 'digital' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          Produit {productType === 'digital' ? 'numérique' : 'physique'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note *
          </label>
          {renderStars()}
        </div>

        {!isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Votre nom *"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Entrez votre nom"
              required
            />
            <Input
              label="Votre email *"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commentaire *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
            rows={4}
            placeholder="Partagez votre expérience avec ce produit..."
            required
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            * Votre avis sera modéré avant publication
          </p>
          <Button type="submit" loading={loading}>
            Publier l'avis
          </Button>
        </div>
      </form>
    </div>
  );
};