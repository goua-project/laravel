<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BoutiqueTrendsController extends Controller
{
    /**
     * NOUVELLE ROUTE - Récupérer toutes les boutiques avec leurs statistiques
     */
    public function getAllBoutiquesWithStats(Request $request)
    {
        try {
            \Log::info('Début récupération boutiques avec stats');

            // Récupérer toutes les boutiques actives avec leurs utilisateurs
            $boutiques = DB::table('boutiques')
                ->leftJoin('users', 'boutiques.user_id', '=', 'users.id')
                ->where('boutiques.is_active', 1)
                ->where('boutiques.status', 'active')
                ->select(
                    'boutiques.id',
                    'boutiques.nom',
                    'boutiques.slug',
                    'boutiques.slogan',
                    'boutiques.description',
                    'boutiques.categorie',
                    'boutiques.type',
                    'boutiques.couleur_accent',
                    'boutiques.logo',
                    'boutiques.mots_cles',
                    'boutiques.is_active',
                    'boutiques.status',
                    'boutiques.created_at',
                    'boutiques.updated_at',
                    'users.nom as user_nom',
                    'users.prenom as user_prenom',
                    'users.email as user_email'
                )
                ->get();

            \Log::info('Nombre de boutiques trouvées: ' . $boutiques->count());

            if ($boutiques->isEmpty()) {
                \Log::warning('Aucune boutique active trouvée');
                return response()->json([]);
            }

            $boutiquesWithStats = [];

            foreach ($boutiques as $boutique) {
                try {
                    $viewsStats = $this->getViewsStatsData($boutique->id);
                    $ordersStats = $this->getOrdersStatsData($boutique->id);

                    $boutiqueData = [
                        'id' => $boutique->id,
                        'nom' => $boutique->nom,
                        'slug' => $boutique->slug,
                        'slogan' => $boutique->slogan,
                        'description' => $boutique->description,
                        'categorie' => $boutique->categorie,
                        'type' => $boutique->type ?? 'physical',
                        'couleur_accent' => $boutique->couleur_accent,
                        'logo' => $boutique->logo,
                        'mots_cles' => $boutique->mots_cles,
                        'created_at' => $boutique->created_at,
                        'updated_at' => $boutique->updated_at,
                        'is_active' => $boutique->is_active,
                        'status' => $boutique->status,
                        'user' => [
                            'nom' => $boutique->user_nom,
                            'prenom' => $boutique->user_prenom,
                            'email' => $boutique->user_email,
                            'name' => $boutique->user_nom // Alias pour compatibilité
                        ],
                        'total_views' => $viewsStats['total_views'],
                        'unique_views' => $viewsStats['unique_views'],
                        'views_growth' => $viewsStats['growth_rate'],
                        'total_orders' => $ordersStats['total_orders'],
                        'total_sales' => $ordersStats['total_sales'],
                        'orders_growth' => $ordersStats['growth_rate'],
                        'is_trending' => $this->calculateTrendingStatus(
                            $viewsStats['growth_rate'],
                            $ordersStats['growth_rate'],
                            $viewsStats['total_views'],
                            $ordersStats['total_orders']
                        )
                    ];

                    $boutiquesWithStats[] = $boutiqueData;

                } catch (\Exception $e) {
                    \Log::error('Erreur traitement boutique ' . $boutique->id . ': ' . $e->getMessage());
                    
                    // Ajouter la boutique avec des stats par défaut
                    $boutiquesWithStats[] = [
                        'id' => $boutique->id,
                        'nom' => $boutique->nom,
                        'slug' => $boutique->slug,
                        'slogan' => $boutique->slogan,
                        'description' => $boutique->description,
                        'categorie' => $boutique->categorie,
                        'type' => $boutique->type ?? 'physical',
                        'couleur_accent' => $boutique->couleur_accent,
                        'logo' => $boutique->logo,
                        'mots_cles' => $boutique->mots_cles,
                        'created_at' => $boutique->created_at,
                        'updated_at' => $boutique->updated_at,
                        'is_active' => $boutique->is_active,
                        'status' => $boutique->status,
                        'user' => [
                            'nom' => $boutique->user_nom,
                            'prenom' => $boutique->user_prenom,
                            'email' => $boutique->user_email,
                            'name' => $boutique->user_nom
                        ],
                        'total_views' => 0,
                        'unique_views' => 0,
                        'views_growth' => 0,
                        'total_orders' => 0,
                        'total_sales' => 0,
                        'orders_growth' => 0,
                        'is_trending' => false
                    ];
                }
            }

            \Log::info('Nombre de boutiques avec stats: ' . count($boutiquesWithStats));

            return response()->json($boutiquesWithStats);

        } catch (\Exception $e) {
            \Log::error('Erreur générale récupération boutiques avec stats: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'error' => 'Erreur lors de la récupération des boutiques',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les statistiques de vues d'une boutique
     */
    public function getViewsStats(Request $request, $boutiqueId)
    {
        try {
            $stats = $this->getViewsStatsData($boutiqueId);
            return response()->json($stats);
        } catch (\Exception $e) {
            \Log::error('Erreur récupération stats vues boutique ' . $boutiqueId . ': ' . $e->getMessage());
            
            return response()->json([
                'total_views' => 0,
                'unique_views' => 0,
                'views_growth_rate' => 0,
                'recent_views' => 0
            ], 500);
        }
    }

    /**
     * Récupérer les statistiques de commandes d'une boutique
     */
    public function getOrdersStats(Request $request, $boutiqueId)
    {
        try {
            $stats = $this->getOrdersStatsData($boutiqueId);
            return response()->json($stats);
        } catch (\Exception $e) {
            \Log::error('Erreur récupération stats commandes boutique ' . $boutiqueId . ': ' . $e->getMessage());
            
            return response()->json([
                'total_orders' => 0,
                'total_sales' => 0,
                'completed_orders' => 0,
                'avg_order_value' => 0,
                'orders_growth_rate' => 0
            ], 500);
        }
    }

    /**
     * Récupérer les vues détaillées avec données géographiques et techniques
     */
    public function getDetailedViews(Request $request, $boutiqueId)
    {
        try {
            $totalViews = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->count();

            $uniqueViews = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->distinct('ip_address')
                ->count();

            // Top pays
            $topCountries = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->whereNotNull('country')
                ->select('country', DB::raw('COUNT(*) as views'))
                ->groupBy('country')
                ->orderByDesc('views')
                ->limit(10)
                ->get();

            // Top villes
            $topCities = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->whereNotNull('city')
                ->select('city', DB::raw('COUNT(*) as views'))
                ->groupBy('city')
                ->orderByDesc('views')
                ->limit(10)
                ->get();

            // Top navigateurs
            $topBrowsers = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->whereNotNull('browser')
                ->select('browser', DB::raw('COUNT(*) as views'))
                ->groupBy('browser')
                ->orderByDesc('views')
                ->limit(5)
                ->get();

            // Top appareils
            $topDevices = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->whereNotNull('device_type')
                ->select('device_type', DB::raw('COUNT(*) as views'))
                ->groupBy('device_type')
                ->orderByDesc('views')
                ->limit(5)
                ->get();

            // Vues quotidiennes des 30 derniers jours
            $dailyViews = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->where('viewed_at', '>=', Carbon::now()->subDays(30))
                ->select(DB::raw('DATE(viewed_at) as date'), DB::raw('COUNT(*) as views'))
                ->groupBy(DB::raw('DATE(viewed_at)'))
                ->orderBy('date')
                ->get();

            // Calcul de la croissance
            $viewsStats = $this->getViewsStatsData($boutiqueId);
            $growthRate = $viewsStats['growth_rate'];

            return response()->json([
                'total_views' => $totalViews,
                'unique_views' => $uniqueViews,
                'growth_rate' => $growthRate,
                'top_countries' => $topCountries,
                'top_cities' => $topCities,
                'top_browsers' => $topBrowsers,
                'top_devices' => $topDevices,
                'daily_views' => $dailyViews
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur récupération vues détaillées boutique ' . $boutiqueId . ': ' . $e->getMessage());
            
            return response()->json([
                'total_views' => 0,
                'unique_views' => 0,
                'growth_rate' => 0,
                'top_countries' => [],
                'top_cities' => [],
                'top_browsers' => [],
                'top_devices' => [],
                'daily_views' => []
            ], 500);
        }
    }

    /**
     * Récupérer les commandes détaillées
     */
    public function getDetailedOrders(Request $request, $boutiqueId)
    {
        try {
            $totalOrders = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->count();

            $totalSales = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->sum('montant_total');

            $completedOrders = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->where('statut', 'livree')
                ->count();

            $pendingOrders = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->whereIn('statut', ['en_attente', 'en_cours'])
                ->count();

            $avgOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

            // Commandes quotidiennes des 30 derniers jours
            $dailyOrders = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->where('created_at', '>=', Carbon::now()->subDays(30))
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as orders'), DB::raw('SUM(montant_total) as revenue'))
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get();

            // Calcul de la croissance
            $ordersStats = $this->getOrdersStatsData($boutiqueId);
            $growthRate = $ordersStats['growth_rate'];

            return response()->json([
                'total_orders' => $totalOrders,
                'total_sales' => (float) $totalSales,
                'completed_orders' => $completedOrders,
                'pending_orders' => $pendingOrders,
                'avg_order_value' => (float) $avgOrderValue,
                'growth_rate' => $growthRate,
                'daily_orders' => $dailyOrders
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur récupération commandes détaillées boutique ' . $boutiqueId . ': ' . $e->getMessage());
            
            return response()->json([
                'total_orders' => 0,
                'total_sales' => 0,
                'completed_orders' => 0,
                'pending_orders' => 0,
                'avg_order_value' => 0,
                'growth_rate' => 0,
                'daily_orders' => []
            ], 500);
        }
    }

    /**
     * Récupérer les produits les plus vendus
     */
    public function getTopProducts(Request $request, $boutiqueId)
    {
        try {
            $topProducts = DB::table('commande_produit')
                ->join('commandes', 'commande_produit.commande_id', '=', 'commandes.id')
                ->join('produits', 'commande_produit.produit_id', '=', 'produits.id')
                ->where('commandes.boutique_id', $boutiqueId)
                ->whereIn('commandes.statut', ['payee', 'livree'])
                ->select(
                    'commande_produit.produit_id',
                    'produits.nom as produit_nom',
                    DB::raw('SUM(commande_produit.quantite) as total_quantity'),
                    DB::raw('SUM(commande_produit.sous_total) as total_sales'),
                    DB::raw('AVG(commande_produit.prix_unitaire) as prix_unitaire')
                )
                ->groupBy('commande_produit.produit_id', 'produits.nom')
                ->orderByDesc('total_sales')
                ->limit(10)
                ->get();

            return response()->json($topProducts);

        } catch (\Exception $e) {
            \Log::error('Erreur récupération top produits boutique ' . $boutiqueId . ': ' . $e->getMessage());
            return response()->json([], 500);
        }
    }

    /**
     * Récupérer les statistiques de paiement
     */
    public function getPaymentsStats(Request $request, $boutiqueId)
    {
        try {
            $totalPayments = DB::table('paiements')
                ->join('commandes', 'paiements.commande_id', '=', 'commandes.id')
                ->where('commandes.boutique_id', $boutiqueId)
                ->count();

            $successfulPayments = DB::table('paiements')
                ->join('commandes', 'paiements.commande_id', '=', 'commandes.id')
                ->where('commandes.boutique_id', $boutiqueId)
                ->where('paiements.statut', 'paye')
                ->count();

            $failedPayments = DB::table('paiements')
                ->join('commandes', 'paiements.commande_id', '=', 'commandes.id')
                ->where('commandes.boutique_id', $boutiqueId)
                ->where('paiements.statut', 'echec')
                ->count();

            $successRate = $totalPayments > 0 ? ($successfulPayments / $totalPayments) * 100 : 0;

            return response()->json([
                'total_payments' => $totalPayments,
                'successful_payments' => $successfulPayments,
                'failed_payments' => $failedPayments,
                'success_rate' => round($successRate, 2)
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur récupération stats paiements boutique ' . $boutiqueId . ': ' . $e->getMessage());
            
            return response()->json([
                'total_payments' => 0,
                'successful_payments' => 0,
                'failed_payments' => 0,
                'success_rate' => 0
            ], 500);
        }
    }

    /**
     * Récupérer les produits d'une boutique
     */
    public function getBoutiqueProducts(Request $request, $boutiqueId)
    {
        try {
            $products = DB::table('produits')
                ->where('boutique_id', $boutiqueId)
                ->where('visible', 1)
                ->where('is_published', 1)
                ->select(
                    'id',
                    'nom',
                    'slug',
                    'description',
                    'prix',
                    'stock',
                    'categorie',
                    'type',
                    'visible',
                    'image',
                    'images',
                    'is_published',
                    'created_at',
                    'updated_at'
                )
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($products);

        } catch (\Exception $e) {
            \Log::error('Erreur récupération produits boutique ' . $boutiqueId . ': ' . $e->getMessage());
            return response()->json([]);
        }
    }

    /**
     * Méthodes helper pour les statistiques
     */
    private function getViewsStatsData($boutiqueId)
    {
        try {
            $totalViews = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->count();

            $uniqueViews = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->distinct('ip_address')
                ->count();

            $currentPeriodStart = Carbon::now()->subDays(30);
            $previousPeriodStart = Carbon::now()->subDays(60);
            $previousPeriodEnd = Carbon::now()->subDays(30);

            $currentViews = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->where('viewed_at', '>=', $currentPeriodStart)
                ->count();

            $previousViews = DB::table('boutique_views')
                ->where('boutique_id', $boutiqueId)
                ->whereBetween('viewed_at', [$previousPeriodStart, $previousPeriodEnd])
                ->count();

            $growthRate = $previousViews > 0 
                ? (($currentViews - $previousViews) / $previousViews) * 100 
                : ($currentViews > 0 ? 100 : 0);

            return [
                'total_views' => $totalViews,
                'unique_views' => $uniqueViews,
                'growth_rate' => round($growthRate, 2)
            ];
        } catch (\Exception $e) {
            \Log::error('Erreur calcul stats vues boutique ' . $boutiqueId . ': ' . $e->getMessage());
            return [
                'total_views' => 0,
                'unique_views' => 0,
                'growth_rate' => 0
            ];
        }
    }

    private function getOrdersStatsData($boutiqueId)
    {
        try {
            $totalOrders = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->count();

            $totalSales = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->sum('montant_total');

            $currentPeriodStart = Carbon::now()->subDays(30);
            $previousPeriodStart = Carbon::now()->subDays(60);
            $previousPeriodEnd = Carbon::now()->subDays(30);

            $currentOrders = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->where('created_at', '>=', $currentPeriodStart)
                ->count();

            $previousOrders = DB::table('commandes')
                ->where('boutique_id', $boutiqueId)
                ->whereBetween('created_at', [$previousPeriodStart, $previousPeriodEnd])
                ->count();

            $growthRate = $previousOrders > 0 
                ? (($currentOrders - $previousOrders) / $previousOrders) * 100 
                : ($currentOrders > 0 ? 100 : 0);

            return [
                'total_orders' => $totalOrders,
                'total_sales' => (float) $totalSales,
                'growth_rate' => round($growthRate, 2)
            ];
        } catch (\Exception $e) {
            \Log::error('Erreur calcul stats commandes boutique ' . $boutiqueId . ': ' . $e->getMessage());
            return [
                'total_orders' => 0,
                'total_sales' => 0,
                'growth_rate' => 0
            ];
        }
    }

    private function calculateTrendingStatus($viewsGrowth, $ordersGrowth, $totalViews, $totalOrders)
    {
        $hasHighViewsGrowth = $viewsGrowth > 20;
        $hasHighOrdersGrowth = $ordersGrowth > 15;
        $hasGoodTrafficWithGrowth = $totalViews > 50 && $viewsGrowth > 0;
        $hasGoodSalesWithGrowth = $totalOrders > 5 && $ordersGrowth > 0;
        
        return $hasHighViewsGrowth || $hasHighOrdersGrowth || $hasGoodTrafficWithGrowth || $hasGoodSalesWithGrowth;
    }
}