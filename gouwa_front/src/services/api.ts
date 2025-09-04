
import axios from 'axios';
import { 
  mockTrendingShops, 
  mockShopStats, 
  mockGuestOrders, 
  mockProductReviews, 
  mockAnalyticsSummary,
  mockSubscriptionPlans,
  mockUserSubscriptions,
  mockProductTransactions,
  mockTransactionSummary
} from './mockData';

// Configuration de base pour l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gouwadan_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gouwadan_token');
      localStorage.removeItem('gouwadan_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types pour les nouvelles fonctionnalités
export interface TrendingShop {
  id: string;
  name: string;
  owner: string;
  shop_type: 'digital' | 'physical';
  category: string;
  location: string;
  total_sales: number;
  total_visits: number;
  orders_count: number;
  growth_rate: number;
  is_trending: boolean;
  avatar?: string;
}

export interface ShopStats {
  shop_id: string;
  total_sales: number;
  total_orders: number;
  total_visits: number;
  conversion_rate: number;
  avg_order_value: number;
  monthly_growth: number;
  top_products: Array<{
    id: string;
    name: string;
    sales: number;
    quantity_sold: number;
  }>;
}

export interface GuestOrder {
  id: string;
  guest_token: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  shop_name: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items_count: number;
  created_at: string;
  delivery_address: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  product_name: string;
  user_name?: string;
  guest_name?: string;
  email: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  is_verified_purchase: boolean;
  created_at: string;
  product_type: 'digital' | 'physical';
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_orders: number;
  total_reviews: number;
  avg_rating: number;
  conversion_rate: number;
  trending_shops_count: number;
  guest_orders_percentage: number;
  monthly_growth: {
    revenue: number;
    orders: number;
    reviews: number;
  };
  top_categories: Array<{
    name: string;
    sales: number;
    percentage: number;
  }>;
  customer_satisfaction: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

// Types pour la gestion des abonnements
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  max_products: number;
  features: string[];
  is_popular: boolean;
  status: 'active' | 'inactive';
}

export interface UserSubscription {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  shop_name: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  amount_paid: number;
  products_used: number;
  max_products: number;
  auto_renewal: boolean;
  payment_method: string;
}

export interface ProductTransaction {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  shop_name: string;
  buyer_name: string;
  buyer_email: string;
  seller_name: string;
  amount: number;
  commission: number;
  net_amount: number;
  transaction_type: 'sale' | 'refund' | 'commission';
  payment_method: 'card' | 'mobile_money' | 'bank_transfer' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  completed_at?: string;
  reference_number: string;
}

export interface TransactionSummary {
  total_transactions: number;
  total_revenue: number;
  total_commission: number;
  pending_amount: number;
  completed_today: number;
  monthly_growth: number;
  top_payment_methods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  transaction_trends: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}

// Services API pour les nouvelles fonctionnalités

// 1. Boutiques tendance
export const trendingShopsAPI = {
  getTrendingShops: async (): Promise<TrendingShop[]> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockTrendingShops;
  },
  
  getShopStats: async (shopId: string): Promise<ShopStats> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockShopStats[shopId] || mockShopStats['1'];
  },
};

// 2. Commandes invitées
export const guestOrdersAPI = {
  getGuestOrders: async (): Promise<GuestOrder[]> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 700));
    return mockGuestOrders;
  },
  
  updateGuestOrderStatus: async (orderId: string, status: string): Promise<void> => {
    // Simulation de mise à jour
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  createGuestOrder: async (orderData: any): Promise<{ guest_token: string }> => {
    // Simulation de création
    await new Promise(resolve => setTimeout(resolve, 800));
    return { guest_token: `guest_${Date.now()}` };
  },
};

// 3. Avis produits
export const reviewsAPI = {
  getReviews: async (): Promise<ProductReview[]> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockProductReviews;
  },
  
  updateReviewStatus: async (reviewId: string, status: 'approved' | 'rejected'): Promise<void> => {
    // Simulation de mise à jour
    await new Promise(resolve => setTimeout(resolve, 400));
  },
  
  deleteReview: async (reviewId: string): Promise<void> => {
    // Simulation de suppression
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  createReview: async (productId: string, reviewData: any): Promise<void> => {
    // Simulation de création
    await new Promise(resolve => setTimeout(resolve, 700));
  },
};

// 4. Analytics enrichis
export const analyticsAPI = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 900));
    return mockAnalyticsSummary;
  },
};

// 5. Gestion des abonnements
export const subscriptionsAPI = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockSubscriptionPlans;
  },
  
  createPlan: async (planData: Partial<SubscriptionPlan>): Promise<void> => {
    // Simulation de création
    await new Promise(resolve => setTimeout(resolve, 800));
  },
  
  updatePlan: async (planId: string, planData: Partial<SubscriptionPlan>): Promise<void> => {
    // Simulation de mise à jour
    await new Promise(resolve => setTimeout(resolve, 700));
  },
  
  deletePlan: async (planId: string): Promise<void> => {
    // Simulation de suppression
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  getUserSubscriptions: async (): Promise<UserSubscription[]> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 700));
    return mockUserSubscriptions;
  },
  
  updateSubscriptionStatus: async (subscriptionId: string, status: string): Promise<void> => {
    // Simulation de mise à jour
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};

// 6. Gestion des transactions
export const transactionsAPI = {
  getTransactions: async (): Promise<ProductTransaction[]> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockProductTransactions;
  },
  
  getTransactionSummary: async (): Promise<TransactionSummary> => {
    // Simulation avec données réalistes
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockTransactionSummary;
  },
  
  updateTransactionStatus: async (transactionId: string, status: string): Promise<void> => {
    // Simulation de mise à jour
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  refundTransaction: async (transactionId: string, reason: string): Promise<void> => {
    // Simulation de remboursement
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
};

export default api;