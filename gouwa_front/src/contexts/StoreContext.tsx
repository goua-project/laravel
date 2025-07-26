import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// === TYPES ===
export type StoreType = 'physical' | 'digital';

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  slogan: string;
  description: string;
  logo: string;
  accentColor: string;
  keywords: string[];
  type: StoreType;
  createdAt: string;
  visitCount: number;
  orderCount: number;
  products: Product[];
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  inStock: number;
  isDigital: boolean;
  isVisible: boolean;
  createdAt: string;
  category: string;
  tags: string[];
  // Physical product specific
  shippingFrom?: string;
  deliveryTime?: string;
  // Digital product specific
  downloadLink?: string;
  serviceType?: string;
}

export interface CreateStoreData extends Omit<Partial<Store>, 'id' | 'ownerId' | 'createdAt' | 'visitCount' | 'orderCount' | 'products'> {}

export interface CreateProductData extends Omit<Partial<Product>, 'id' | 'storeId' | 'createdAt'> {}

interface StoreContextType {
  // State
  currentStore: Store | null;
  stores: Store[];
  isLoading: boolean;
  
  // Store operations
  createStore: (storeData: CreateStoreData) => Promise<Store>;
  updateStore: (storeId: string, storeData: Partial<Store>) => Promise<Store>;
  setCurrentStore: (store: Store | null) => void;
  getStoreBySlug: (slug: string) => Store | null;
  getStoreById: (id: string) => Store | null;
  
  // Product operations
  addProduct: (storeId: string, productData: CreateProductData) => Promise<Product>;
  updateProduct: (storeId: string, productId: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (storeId: string, productId: string) => Promise<void>;
  getProductById: (storeId: string, productId: string) => Product | null;
  
  // Analytics
  incrementVisitCount: (storeId: string) => void;
  incrementOrderCount: (storeId: string) => void;
}

// === CONTEXT ===
const StoreContext = createContext<StoreContextType | undefined>(undefined);

// === CUSTOM HOOK ===
export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// === UTILITY FUNCTIONS ===
const generateId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createSlug = (name: string): string => 
  name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// === SAMPLE DATA ===
const createSampleStores = (): Store[] => [
  {
    id: '1',
    ownerId: '123',
    name: 'La Pagneuse',
    slug: 'la-pagneuse',
    slogan: 'Tissus africains authentiques',
    description: 'Boutique spécialisée dans les pagnes et tissus africains de qualité.',
    logo: 'https://images.pexels.com/photos/5935738/pexels-photo-5935738.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    accentColor: '#F25539',
    keywords: ['pagne', 'tissu', 'africain', 'mode', 'vêtements'],
    type: 'physical',
    createdAt: new Date().toISOString(),
    visitCount: 245,
    orderCount: 37,
    products: [
      {
        id: 'p1',
        storeId: '1',
        name: 'Pagne Wax Premium',
        price: 15000,
        description: 'Pagne wax authentique, motifs colorés, 6 yards.',
        images: [
          'https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        ],
        inStock: 15,
        isDigital: false,
        isVisible: true,
        createdAt: new Date().toISOString(),
        category: 'Tissus',
        tags: ['wax', 'premium', 'coloré'],
        shippingFrom: 'Abidjan',
        deliveryTime: '3-5 jours',
      },
    ],
  },
  {
    id: '2',
    ownerId: '456',
    name: 'DigiBoost',
    slug: 'digiboost',
    slogan: 'Boostez votre présence digitale',
    description: 'Services digitaux pour entrepreneurs et petites entreprises.',
    logo: 'https://images.pexels.com/photos/5926398/pexels-photo-5926398.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    accentColor: '#FFC300',
    keywords: ['digital', 'marketing', 'design', 'services', 'entreprise'],
    type: 'digital',
    createdAt: new Date().toISOString(),
    visitCount: 178,
    orderCount: 22,
    products: [
      {
        id: 'p2',
        storeId: '2',
        name: 'Pack Logo Design',
        price: 25000,
        description: 'Design de logo professionnel avec 3 propositions et révisions illimitées.',
        images: [
          'https://images.pexels.com/photos/6177645/pexels-photo-6177645.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        ],
        inStock: 999,
        isDigital: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        category: 'Design',
        tags: ['logo', 'branding', 'design'],
        serviceType: 'Design graphique',
      },
    ],
  },
];

// === PROVIDER COMPONENT ===
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [stores, setStores] = useState<Store[]>(createSampleStores);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Store operations
  const createStore = useCallback(async (storeData: CreateStoreData): Promise<Store> => {
    setIsLoading(true);
    
    try {
      const newStore: Store = {
        id: generateId('store'),
        ownerId: '123', // TODO: Get from auth context
        name: storeData.name || 'Nouvelle Boutique',
        slug: storeData.slug || createSlug(storeData.name || 'nouvelle-boutique'),
        slogan: storeData.slogan || '',
        description: storeData.description || '',
        logo: storeData.logo || 'https://via.placeholder.com/150x150/F25539/FFFFFF?text=Logo',
        accentColor: storeData.accentColor || '#F25539',
        keywords: storeData.keywords || [],
        type: storeData.type || 'physical',
        createdAt: new Date().toISOString(),
        visitCount: 0,
        orderCount: 0,
        products: [],
      };

      setStores(prevStores => [...prevStores, newStore]);
      setCurrentStoreState(newStore);
      
      return newStore;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStore = useCallback(async (storeId: string, storeData: Partial<Store>): Promise<Store> => {
    setIsLoading(true);
    
    try {
      let updatedStore: Store | null = null;
      
      setStores(prevStores => 
        prevStores.map(store => {
          if (store.id === storeId) {
            updatedStore = { ...store, ...storeData };
            return updatedStore;
          }
          return store;
        })
      );

      if (updatedStore && currentStore?.id === storeId) {
        setCurrentStoreState(updatedStore);
      }

      if (!updatedStore) {
        throw new Error(`Store with id ${storeId} not found`);
      }

      return updatedStore;
    } finally {
      setIsLoading(false);
    }
  }, [currentStore?.id]);

  const setCurrentStore = useCallback((store: Store | null) => {
    setCurrentStoreState(store);
  }, []);

  const getStoreBySlug = useCallback((slug: string): Store | null => {
    return stores.find(store => store.slug === slug) || null;
  }, [stores]);

  const getStoreById = useCallback((id: string): Store | null => {
    return stores.find(store => store.id === id) || null;
  }, [stores]);

  // Product operations
  const addProduct = useCallback(async (storeId: string, productData: CreateProductData): Promise<Product> => {
    setIsLoading(true);
    
    try {
      const newProduct: Product = {
        id: generateId('product'),
        storeId,
        name: productData.name || 'Nouveau Produit',
        price: productData.price || 0,
        description: productData.description || '',
        images: productData.images || ['https://via.placeholder.com/300x300/F25539/FFFFFF?text=Produit'],
        inStock: productData.inStock || 0,
        isDigital: productData.isDigital || false,
        isVisible: productData.isVisible !== undefined ? productData.isVisible : true,
        createdAt: new Date().toISOString(),
        category: productData.category || 'Général',
        tags: productData.tags || [],
        shippingFrom: productData.shippingFrom,
        deliveryTime: productData.deliveryTime,
        downloadLink: productData.downloadLink,
        serviceType: productData.serviceType,
      };

      setStores(prevStores =>
        prevStores.map(store => {
          if (store.id === storeId) {
            const updatedStore = {
              ...store,
              products: [...store.products, newProduct],
            };
            
            if (currentStore?.id === storeId) {
              setCurrentStoreState(updatedStore);
            }
            
            return updatedStore;
          }
          return store;
        })
      );

      return newProduct;
    } finally {
      setIsLoading(false);
    }
  }, [currentStore?.id]);

  const updateProduct = useCallback(async (
    storeId: string,
    productId: string,
    productData: Partial<Product>
  ): Promise<Product> => {
    setIsLoading(true);
    
    try {
      let updatedProduct: Product | null = null;

      setStores(prevStores =>
        prevStores.map(store => {
          if (store.id === storeId) {
            const updatedProducts = store.products.map(product => {
              if (product.id === productId) {
                updatedProduct = { ...product, ...productData };
                return updatedProduct;
              }
              return product;
            });

            const updatedStore = { ...store, products: updatedProducts };
            
            if (currentStore?.id === storeId) {
              setCurrentStoreState(updatedStore);
            }
            
            return updatedStore;
          }
          return store;
        })
      );

      if (!updatedProduct) {
        throw new Error(`Product with id ${productId} not found in store ${storeId}`);
      }

      return updatedProduct;
    } finally {
      setIsLoading(false);
    }
  }, [currentStore?.id]);

  const deleteProduct = useCallback(async (storeId: string, productId: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      setStores(prevStores =>
        prevStores.map(store => {
          if (store.id === storeId) {
            const updatedProducts = store.products.filter(product => product.id !== productId);
            const updatedStore = { ...store, products: updatedProducts };
            
            if (currentStore?.id === storeId) {
              setCurrentStoreState(updatedStore);
            }
            
            return updatedStore;
          }
          return store;
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentStore?.id]);

  const getProductById = useCallback((storeId: string, productId: string): Product | null => {
    const store = stores.find(s => s.id === storeId);
    return store?.products.find(p => p.id === productId) || null;
  }, [stores]);

  // Analytics
  const incrementVisitCount = useCallback((storeId: string) => {
    setStores(prevStores =>
      prevStores.map(store =>
        store.id === storeId
          ? { ...store, visitCount: store.visitCount + 1 }
          : store
      )
    );
  }, []);

  const incrementOrderCount = useCallback((storeId: string) => {
    setStores(prevStores =>
      prevStores.map(store =>
        store.id === storeId
          ? { ...store, orderCount: store.orderCount + 1 }
          : store
      )
    );
  }, []);

  // Memoized context value
  const contextValue = useMemo(() => ({
    // State
    currentStore,
    stores,
    isLoading,
    
    // Store operations
    createStore,
    updateStore,
    setCurrentStore,
    getStoreBySlug,
    getStoreById,
    
    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    
    // Analytics
    incrementVisitCount,
    incrementOrderCount,
  }), [
    currentStore,
    stores,
    isLoading,
    createStore,
    updateStore,
    setCurrentStore,
    getStoreBySlug,
    getStoreById,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    incrementVisitCount,
    incrementOrderCount,
  ]);

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};