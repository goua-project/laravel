import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { reviewsAPI, ProductReview } from '../services/api';
import { Search, Star, Check, X, Trash2, Eye, Shield, Package } from 'lucide-react';

export const ReviewsModeration: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewsAPI.getReviews();
      setReviews(data);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de charger les avis');
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await reviewsAPI.updateReviewStatus(reviewId, status);
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, status }
          : review
      ));
      
      const statusLabel = status === 'approved' ? 'approuvé' : 'rejeté';
      showToast('success', 'Avis mis à jour', `L'avis a été ${statusLabel}`);
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de mettre à jour l\'avis');
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      return;
    }

    try {
      await reviewsAPI.deleteReview(reviewId);
      setReviews(reviews.filter(review => review.id !== reviewId));
      showToast('success', 'Avis supprimé', 'L\'avis a été supprimé définitivement');
    } catch (error) {
      showToast('error', 'Erreur', 'Impossible de supprimer l\'avis');
    }
  };

  const viewReviewDetails = (review: ProductReview) => {
    setSelectedReview(review);
    setIsDetailModalOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const columns = [
    {
      key: 'product_name',
      title: 'Produit',
      render: (value: string, record: ProductReview) => (
        <div>
          <p className="font-medium">{value}</p>
          <div className="flex items-center mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              record.product_type === 'digital' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {record.product_type === 'digital' ? 'Numérique' : 'Physique'}
            </span>
            {record.is_verified_purchase && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                <Shield size={10} className="mr-1" />
                Achat vérifié
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'user_name',
      title: 'Auteur',
      render: (value: string, record: ProductReview) => (
        <div>
          <p className="font-medium">{value || record.guest_name || 'Invité'}</p>
          <p className="text-gray-500 text-sm">{record.email}</p>
        </div>
      )
    },
    {
      key: 'rating',
      title: 'Note',
      render: (value: number) => renderStars(value)
    },
    {
      key: 'comment',
      title: 'Commentaire',
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 truncate" title={value}>
            {value}
          </p>
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Date',
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('fr-FR')}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (value: string, record: ProductReview) => {
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
          approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approuvé' },
          rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeté' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            {value === 'pending' && (
              <div className="flex space-x-1">
                <button
                  onClick={() => updateReviewStatus(record.id, 'approved')}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="Approuver"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => updateReviewStatus(record.id, 'rejected')}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Rejeter"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: ProductReview) => (
        <div className="flex space-x-2">
          <button
            className="p-1 text-gray-600 hover:text-blue-600"
            onClick={() => viewReviewDetails(record)}
            title="Voir détails"
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-red-600"
            onClick={() => deleteReview(record.id)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (review.user_name || review.guest_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || review.status === selectedStatus;
    const matchesType = selectedType === 'all' || review.product_type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getReviewStats = () => {
    return {
      total: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length,
      avgRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      verifiedPurchases: reviews.filter(r => r.is_verified_purchase).length
    };
  };

  const stats = getReviewStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modération des Avis</h1>
        <Button variant="outline" onClick={loadReviews}>
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Total Avis</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Approuvés</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Rejetés</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Note Moyenne</p>
          <p className="text-2xl font-bold text-[#FF6A00]">{stats.avgRating.toFixed(1)}/5</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-medium text-gray-600">Achats Vérifiés</p>
          <p className="text-2xl font-bold text-blue-600">{stats.verifiedPurchases}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Rechercher un avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
          >
            <option value="all">Tous les types</option>
            <option value="digital">Numérique</option>
            <option value="physical">Physique</option>
          </select>
        </div>

        <Table columns={columns} data={filteredReviews} loading={loading} />
      </div>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReview(null);
        }}
        title="Détails de l'avis"
      >
        {selectedReview && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Produit</h4>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{selectedReview.product_name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedReview.product_type === 'digital' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedReview.product_type === 'digital' ? 'Numérique' : 'Physique'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Auteur</h4>
              <p>{selectedReview.user_name || selectedReview.guest_name || 'Invité'}</p>
              <p className="text-sm text-gray-600">{selectedReview.email}</p>
              {selectedReview.is_verified_purchase && (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mt-1">
                  <Shield size={10} className="mr-1" />
                  Achat vérifié
                </span>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Note</h4>
              {renderStars(selectedReview.rating)}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Commentaire</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReview.comment}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Date</h4>
              <p className="text-gray-600">{new Date(selectedReview.created_at).toLocaleString('fr-FR')}</p>
            </div>

            {selectedReview.status === 'pending' && (
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => {
                    updateReviewStatus(selectedReview.id, 'approved');
                    setIsDetailModalOpen(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check size={16} className="mr-2" />
                  Approuver
                </Button>
                <Button
                  onClick={() => {
                    updateReviewStatus(selectedReview.id, 'rejected');
                    setIsDetailModalOpen(false);
                  }}
                  variant="danger"
                  className="flex-1"
                >
                  <X size={16} className="mr-2" />
                  Rejeter
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};