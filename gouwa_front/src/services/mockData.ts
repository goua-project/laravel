// Données simulées pour toutes les fonctionnalités
// Ces données permettent de tester l'interface sans backend

import { 
  TrendingShop, 
  ShopStats, 
  GuestOrder, 
  ProductReview, 
  AnalyticsSummary,
  SubscriptionPlan,
  UserSubscription,
  ProductTransaction,
  TransactionSummary
} from './api';

// 1. Boutiques Tendance
export const mockTrendingShops: TrendingShop[] = [
  {
    id: '1',
    name: 'Électro Bénin Pro',
    owner: 'Jean Kouassi',
    shop_type: 'physical',
    category: 'Électronique',
    location: 'Cotonou, Bénin',
    total_sales: 2500000,
    total_visits: 15420,
    orders_count: 89,
    growth_rate: 23.5,
    is_trending: true,
    avatar: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  {
    id: '2',
    name: 'Mode Africaine Deluxe',
    owner: 'Marie Adjou',
    shop_type: 'physical',
    category: 'Mode',
    location: 'Porto-Novo, Bénin',
    total_sales: 1800000,
    total_visits: 12350,
    orders_count: 156,
    growth_rate: 18.2,
    is_trending: true,
    avatar: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  {
    id: '3',
    name: 'Épicerie Premium',
    owner: 'Paul Dossou',
    shop_type: 'physical',
    category: 'Alimentation',
    location: 'Parakou, Bénin',
    total_sales: 950000,
    total_visits: 8900,
    orders_count: 234,
    growth_rate: 12.8,
    is_trending: false
  },
  {
    id: '4',
    name: 'Tech Solutions',
    owner: 'Fatou Diallo',
    shop_type: 'physical',
    category: 'Électronique',
    location: 'Abomey-Calavi, Bénin',
    total_sales: 3200000,
    total_visits: 18750,
    orders_count: 67,
    growth_rate: 31.4,
    is_trending: true
  },
  {
    id: '5',
    name: 'Beauté Naturelle',
    owner: 'Aisha Mamadou',
    shop_type: 'physical',
    category: 'Beauté',
    location: 'Bohicon, Bénin',
    total_sales: 720000,
    total_visits: 6420,
    orders_count: 98,
    growth_rate: 8.9,
    is_trending: false
  },
  {
    id: '6',
    name: 'Digital Academy Bénin',
    owner: 'Dr. Kossi Agbodjan',
    shop_type: 'digital',
    category: 'Formation',
    location: 'En ligne',
    total_sales: 1200000,
    total_visits: 9800,
    orders_count: 145,
    growth_rate: 28.7,
    is_trending: true
  },
  {
    id: '7',
    name: 'eBooks Afrique',
    owner: 'Sylvie Akakpo',
    shop_type: 'digital',
    category: 'Livres Numériques',
    location: 'En ligne',
    total_sales: 850000,
    total_visits: 7200,
    orders_count: 89,
    growth_rate: 22.1,
    is_trending: true
  },
  {
    id: '8',
    name: 'Software Solutions BJ',
    owner: 'Emmanuel Tossa',
    shop_type: 'digital',
    category: 'Logiciels',
    location: 'En ligne',
    total_sales: 2800000,
    total_visits: 5400,
    orders_count: 67,
    growth_rate: 35.2,
    is_trending: true
  },
  {
    id: '9',
    name: 'Music Store Digital',
    owner: 'Angélique Kidjo Jr.',
    shop_type: 'digital',
    category: 'Musique',
    location: 'En ligne',
    total_sales: 450000,
    total_visits: 12500,
    orders_count: 234,
    growth_rate: 18.9,
    is_trending: false
  }
];

export const mockShopStats: { [key: string]: ShopStats } = {
  '1': {
    shop_id: '1',
    total_sales: 2500000,
    total_orders: 89,
    total_visits: 15420,
    conversion_rate: 5.8,
    avg_order_value: 28090,
    monthly_growth: 23.5,
    top_products: [
      { id: 'p1', name: 'iPhone 15 Pro Max', sales: 750000, quantity_sold: 10 },
      { id: 'p2', name: 'MacBook Air M2', sales: 650000, quantity_sold: 5 },
      { id: 'p3', name: 'AirPods Pro', sales: 400000, quantity_sold: 20 },
      { id: 'p4', name: 'iPad Air', sales: 350000, quantity_sold: 8 },
      { id: 'p5', name: 'Apple Watch', sales: 350000, quantity_sold: 15 }
    ]
  },
  '2': {
    shop_id: '2',
    total_sales: 1800000,
    total_orders: 156,
    total_visits: 12350,
    conversion_rate: 12.6,
    avg_order_value: 11538,
    monthly_growth: 18.2,
    top_products: [
      { id: 'p6', name: 'Robe Traditionnelle Deluxe', sales: 450000, quantity_sold: 30 },
      { id: 'p7', name: 'Boubou Brodé', sales: 380000, quantity_sold: 25 },
      { id: 'p8', name: 'Chaussures Artisanales', sales: 320000, quantity_sold: 40 },
      { id: 'p9', name: 'Sac à Main Cuir', sales: 280000, quantity_sold: 35 },
      { id: 'p10', name: 'Bijoux Traditionnels', sales: 370000, quantity_sold: 50 }
    ]
  },
  '6': {
    shop_id: '6',
    total_sales: 1200000,
    total_orders: 145,
    total_visits: 9800,
    conversion_rate: 14.8,
    avg_order_value: 8276,
    monthly_growth: 28.7,
    top_products: [
      { id: 'p11', name: 'Cours Développement Web', sales: 350000, quantity_sold: 50 },
      { id: 'p12', name: 'Formation Marketing Digital', sales: 280000, quantity_sold: 40 },
      { id: 'p13', name: 'Cours Design UI/UX', sales: 240000, quantity_sold: 30 },
      { id: 'p14', name: 'Formation E-commerce', sales: 180000, quantity_sold: 25 },
      { id: 'p15', name: 'Cours Data Science', sales: 150000, quantity_sold: 20 }
    ]
  },
  '8': {
    shop_id: '8',
    total_sales: 2800000,
    total_orders: 67,
    total_visits: 5400,
    conversion_rate: 12.4,
    avg_order_value: 41791,
    monthly_growth: 35.2,
    top_products: [
      { id: 'p16', name: 'Logiciel Gestion Stock', sales: 800000, quantity_sold: 8 },
      { id: 'p17', name: 'App Mobile E-commerce', sales: 650000, quantity_sold: 5 },
      { id: 'p18', name: 'Plugin WordPress', sales: 450000, quantity_sold: 15 },
      { id: 'p19', name: 'Template Site Web', sales: 380000, quantity_sold: 20 },
      { id: 'p20', name: 'Extension Chrome', sales: 520000, quantity_sold: 19 }
    ]
  }
};

// 2. Commandes Invitées
export const mockGuestOrders: GuestOrder[] = [
  {
    id: 'GO-001',
    guest_token: 'guest_abc123def456',
    guest_name: 'Koffi Mensah',
    guest_email: 'koffi.mensah@email.com',
    guest_phone: '+229 97 45 67 89',
    shop_name: 'Électro Bénin Pro',
    total_amount: 750000,
    status: 'pending',
    items_count: 1,
    created_at: '2024-01-25T10:30:00Z',
    delivery_address: '123 Rue des Palmiers, Cotonou, Bénin'
  },
  {
    id: 'GO-002',
    guest_token: 'guest_xyz789abc123',
    guest_name: 'Aminata Traoré',
    guest_email: 'aminata.traore@gmail.com',
    guest_phone: '+229 96 78 90 12',
    shop_name: 'Mode Africaine Deluxe',
    total_amount: 45000,
    status: 'confirmed',
    items_count: 2,
    created_at: '2024-01-24T14:15:00Z',
    delivery_address: 'Quartier Zongo, Porto-Novo, Bénin'
  },
  {
    id: 'GO-003',
    guest_token: 'guest_def456ghi789',
    guest_name: 'Ibrahim Sanni',
    guest_email: 'ibrahim.sanni@yahoo.fr',
    guest_phone: '+229 95 34 56 78',
    shop_name: 'Tech Solutions',
    total_amount: 1200000,
    status: 'shipped',
    items_count: 1,
    created_at: '2024-01-23T09:45:00Z',
    delivery_address: 'Avenue Steinmetz, Abomey-Calavi, Bénin'
  },
  {
    id: 'GO-004',
    guest_token: 'guest_ghi789jkl012',
    guest_name: 'Fatoumata Bello',
    guest_email: 'fatoumata.bello@hotmail.com',
    guest_phone: '+229 94 12 34 56',
    shop_name: 'Beauté Naturelle',
    total_amount: 35000,
    status: 'delivered',
    items_count: 3,
    created_at: '2024-01-22T16:20:00Z',
    delivery_address: 'Carrefour Wologuèdè, Bohicon, Bénin'
  },
  {
    id: 'GO-005',
    guest_token: 'guest_jkl012mno345',
    guest_name: 'Moussa Ouédraogo',
    guest_email: 'moussa.ouedraogo@gmail.com',
    guest_phone: '+229 93 67 89 01',
    shop_name: 'Épicerie Premium',
    total_amount: 28000,
    status: 'cancelled',
    items_count: 4,
    created_at: '2024-01-21T11:10:00Z',
    delivery_address: 'Rue de la Paix, Parakou, Bénin'
  }
];

// 3. Avis Produits
export const mockProductReviews: ProductReview[] = [
  {
    id: 'r1',
    product_id: 'p1',
    product_name: 'iPhone 15 Pro Max',
    user_name: 'Jean Dupont',
    guest_name: undefined,
    email: 'jean.dupont@email.com',
    rating: 5,
    comment: 'Excellent produit ! Livraison rapide et emballage soigné. Je recommande vivement cette boutique.',
    status: 'pending',
    is_verified_purchase: true,
    created_at: '2024-01-25T08:30:00Z',
    product_type: 'physical'
  },
  {
    id: 'r2',
    product_id: 'p6',
    product_name: 'Robe Traditionnelle Deluxe',
    user_name: undefined,
    guest_name: 'Marie Kone',
    email: 'marie.kone@gmail.com',
    rating: 4,
    comment: 'Très belle robe, la qualité du tissu est excellente. Taille parfaite selon le guide des tailles.',
    status: 'approved',
    is_verified_purchase: true,
    created_at: '2024-01-24T15:45:00Z',
    product_type: 'physical'
  },
  {
    id: 'r3',
    product_id: 'p11',
    product_name: 'Cours de Programmation Web',
    user_name: 'Paul Martin',
    guest_name: undefined,
    email: 'paul.martin@yahoo.fr',
    rating: 5,
    comment: 'Formation très complète et bien structurée. Les exercices pratiques sont excellents.',
    status: 'approved',
    is_verified_purchase: true,
    created_at: '2024-01-23T12:20:00Z',
    product_type: 'digital'
  },
  {
    id: 'r4',
    product_id: 'p2',
    product_name: 'MacBook Air M2',
    user_name: undefined,
    guest_name: 'Fatou Diarra',
    email: 'fatou.diarra@hotmail.com',
    rating: 2,
    comment: 'Produit arrivé avec des rayures sur l\'écran. Service client peu réactif.',
    status: 'pending',
    is_verified_purchase: false,
    created_at: '2024-01-22T18:10:00Z',
    product_type: 'physical'
  },
  {
    id: 'r5',
    product_name: 'Chaussures Artisanales',
    product_id: 'p8',
    user_name: 'Amadou Tall',
    guest_name: undefined,
    email: 'amadou.tall@gmail.com',
    rating: 4,
    comment: 'Chaussures confortables et bien finies. Livraison dans les délais annoncés.',
    status: 'rejected',
    is_verified_purchase: true,
    created_at: '2024-01-21T14:35:00Z',
    product_type: 'physical'
  },
  {
    id: 'r6',
    product_id: 'p12',
    product_name: 'eBook Marketing Digital',
    user_name: undefined,
    guest_name: 'Salimata Ba',
    email: 'salimata.ba@email.com',
    rating: 5,
    comment: 'Contenu très riche et applicable immédiatement. Parfait pour débuter en marketing digital.',
    status: 'approved',
    is_verified_purchase: true,
    created_at: '2024-01-20T09:25:00Z',
    product_type: 'digital'
  }
];

// 4. Analytics Enrichis
export const mockAnalyticsSummary: AnalyticsSummary = {
  total_revenue: 28500000,
  total_orders: 3010,
  total_reviews: 735,
  avg_rating: 4.6,
  conversion_rate: 3.2,
  trending_shops_count: 12,
  guest_orders_percentage: 25.5,
  monthly_growth: {
    revenue: 12.5,
    orders: 8.3,
    reviews: 15.2
  },
  top_categories: [
    { name: 'Électronique', sales: 12500000, percentage: 43.8 },
    { name: 'Mode', sales: 8200000, percentage: 28.8 },
    { name: 'Maison', sales: 4800000, percentage: 16.8 },
    { name: 'Sport', sales: 3000000, percentage: 10.5 }
  ],
  customer_satisfaction: {
    excellent: 45,
    good: 30,
    average: 15,
    poor: 10
  }
};

// 5. Plans d'Abonnement
export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan1',
    name: 'Plan Basique',
    description: 'Parfait pour débuter votre activité en ligne',
    price: 5000,
    duration_months: 1,
    max_products: 10,
    features: ['Support email', 'Statistiques de base', 'Paiement mobile money'],
    is_popular: false,
    status: 'active'
  },
  {
    id: 'plan2',
    name: 'Plan Standard',
    description: 'Idéal pour les boutiques en croissance',
    price: 12000,
    duration_months: 3,
    max_products: 50,
    features: ['Support prioritaire', 'Analytics avancés', 'Multi-paiements', 'Promotion produits'],
    is_popular: true,
    status: 'active'
  },
  {
    id: 'plan3',
    name: 'Plan Premium',
    description: 'Pour les vendeurs professionnels',
    price: 20000,
    duration_months: 6,
    max_products: 200,
    features: ['Support 24/7', 'API access', 'Rapports personnalisés', 'Formation gratuite', 'Badge premium'],
    is_popular: false,
    status: 'active'
  },
  {
    id: 'plan4',
    name: 'Plan Enterprise',
    description: 'Solution complète pour grandes boutiques',
    price: 35000,
    duration_months: 12,
    max_products: 500,
    features: ['Account manager dédié', 'Intégrations personnalisées', 'White-label', 'Formation équipe'],
    is_popular: false,
    status: 'active'
  }
];

// 6. Abonnements Utilisateurs
export const mockUserSubscriptions: UserSubscription[] = [
  {
    id: 'sub1',
    user_id: 'u1',
    user_name: 'Jean Kouassi',
    user_email: 'jean.kouassi@email.com',
    shop_name: 'Électro Bénin Pro',
    plan_id: 'plan3',
    plan_name: 'Plan Premium',
    start_date: '2024-01-01',
    end_date: '2024-07-01',
    status: 'active',
    amount_paid: 20000,
    products_used: 145,
    max_products: 200,
    auto_renewal: true,
    payment_method: 'Mobile Money'
  },
  {
    id: 'sub2',
    user_id: 'u2',
    user_name: 'Marie Adjou',
    user_email: 'marie.adjou@gmail.com',
    shop_name: 'Mode Africaine Deluxe',
    plan_id: 'plan2',
    plan_name: 'Plan Standard',
    start_date: '2024-01-15',
    end_date: '2024-04-15',
    status: 'active',
    amount_paid: 12000,
    products_used: 38,
    max_products: 50,
    auto_renewal: false,
    payment_method: 'Carte bancaire'
  },
  {
    id: 'sub3',
    user_id: 'u3',
    user_name: 'Paul Dossou',
    user_email: 'paul.dossou@yahoo.fr',
    shop_name: 'Épicerie Premium',
    plan_id: 'plan1',
    plan_name: 'Plan Basique',
    start_date: '2023-12-01',
    end_date: '2024-01-01',
    status: 'expired',
    amount_paid: 5000,
    products_used: 10,
    max_products: 10,
    auto_renewal: false,
    payment_method: 'Mobile Money'
  },
  {
    id: 'sub4',
    user_id: 'u4',
    user_name: 'Fatou Diallo',
    user_email: 'fatou.diallo@email.com',
    shop_name: 'Tech Solutions',
    plan_id: 'plan4',
    plan_name: 'Plan Enterprise',
    start_date: '2024-01-10',
    end_date: '2025-01-10',
    status: 'active',
    amount_paid: 35000,
    products_used: 287,
    max_products: 500,
    auto_renewal: true,
    payment_method: 'Virement bancaire'
  },
  {
    id: 'sub5',
    user_id: 'u5',
    user_name: 'Aisha Mamadou',
    user_email: 'aisha.mamadou@hotmail.com',
    shop_name: 'Beauté Naturelle',
    plan_id: 'plan2',
    plan_name: 'Plan Standard',
    start_date: '2024-01-20',
    end_date: '2024-04-20',
    status: 'active',
    amount_paid: 12000,
    products_used: 23,
    max_products: 50,
    auto_renewal: true,
    payment_method: 'Mobile Money'
  }
];

// 7. Transactions Produits
export const mockProductTransactions: ProductTransaction[] = [
  {
    id: 't1',
    transaction_id: 'TXN-2024-001',
    product_id: 'p1',
    product_name: 'iPhone 15 Pro Max',
    shop_name: 'Électro Bénin Pro',
    buyer_name: 'Koffi Mensah',
    buyer_email: 'koffi.mensah@email.com',
    seller_name: 'Jean Kouassi',
    amount: 750000,
    commission: 75000,
    net_amount: 675000,
    transaction_type: 'sale',
    payment_method: 'card',
    status: 'completed',
    created_at: '2024-01-25T10:30:00Z',
    completed_at: '2024-01-25T10:32:15Z',
    reference_number: 'REF-750K-001'
  },
  {
    id: 't2',
    transaction_id: 'TXN-2024-002',
    product_id: 'p6',
    product_name: 'Robe Traditionnelle Deluxe',
    shop_name: 'Mode Africaine Deluxe',
    buyer_name: 'Aminata Traoré',
    buyer_email: 'aminata.traore@gmail.com',
    seller_name: 'Marie Adjou',
    amount: 25000,
    commission: 2500,
    net_amount: 22500,
    transaction_type: 'sale',
    payment_method: 'mobile_money',
    status: 'pending',
    created_at: '2024-01-25T14:15:00Z',
    reference_number: 'REF-25K-002'
  },
  {
    id: 't3',
    transaction_id: 'TXN-2024-003',
    product_id: 'p2',
    product_name: 'MacBook Air M2',
    shop_name: 'Tech Solutions',
    buyer_name: 'Ibrahim Sanni',
    buyer_email: 'ibrahim.sanni@yahoo.fr',
    seller_name: 'Fatou Diallo',
    amount: 650000,
    commission: 65000,
    net_amount: 585000,
    transaction_type: 'sale',
    payment_method: 'bank_transfer',
    status: 'completed',
    created_at: '2024-01-24T09:45:00Z',
    completed_at: '2024-01-24T16:20:00Z',
    reference_number: 'REF-650K-003'
  },
  {
    id: 't4',
    transaction_id: 'TXN-2024-004',
    product_id: 'p8',
    product_name: 'Chaussures Artisanales',
    shop_name: 'Mode Africaine Deluxe',
    buyer_name: 'Fatoumata Bello',
    buyer_email: 'fatoumata.bello@hotmail.com',
    seller_name: 'Marie Adjou',
    amount: 15000,
    commission: 1500,
    net_amount: 13500,
    transaction_type: 'sale',
    payment_method: 'cash',
    status: 'failed',
    created_at: '2024-01-23T16:20:00Z',
    reference_number: 'REF-15K-004'
  },
  {
    id: 't5',
    transaction_id: 'TXN-2024-005',
    product_id: 'p3',
    product_name: 'AirPods Pro',
    shop_name: 'Électro Bénin Pro',
    buyer_name: 'Moussa Ouédraogo',
    buyer_email: 'moussa.ouedraogo@gmail.com',
    seller_name: 'Jean Kouassi',
    amount: 85000,
    commission: 8500,
    net_amount: 76500,
    transaction_type: 'refund',
    payment_method: 'card',
    status: 'refunded',
    created_at: '2024-01-22T11:10:00Z',
    completed_at: '2024-01-23T09:30:00Z',
    reference_number: 'REF-85K-005'
  }
];

// 8. Résumé des Transactions
export const mockTransactionSummary: TransactionSummary = {
  total_transactions: 1247,
  total_revenue: 45800000,
  total_commission: 4580000,
  pending_amount: 890000,
  completed_today: 23,
  monthly_growth: 18.7,
  top_payment_methods: [
    { method: 'mobile_money', count: 456, percentage: 36.6 },
    { method: 'card', count: 398, percentage: 31.9 },
    { method: 'cash', count: 267, percentage: 21.4 },
    { method: 'bank_transfer', count: 126, percentage: 10.1 }
  ],
  transaction_trends: [
    { date: '2024-01-19', amount: 2100000, count: 45 },
    { date: '2024-01-20', amount: 1950000, count: 42 },
    { date: '2024-01-21', amount: 2350000, count: 51 },
    { date: '2024-01-22', amount: 2800000, count: 58 },
    { date: '2024-01-23', amount: 2650000, count: 55 },
    { date: '2024-01-24', amount: 3100000, count: 67 },
    { date: '2024-01-25', amount: 2900000, count: 62 }
  ]
};