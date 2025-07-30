<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Services\BoutiqueStatsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BoutiqueStatsController extends Controller
{
    protected $statsService;

    public function __construct(BoutiqueStatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * Obtenir les statistiques de vue d'une boutique
     */
    public function getViewStats(Request $request, $boutiqueId)
    {
        try {
            // Vérifier que la boutique appartient à l'utilisateur connecté
            $boutique = Boutique::where('id', $boutiqueId)
                              ->where('user_id', Auth::id())
                              ->firstOrFail();

            $period = $request->get('period', 'month');
            
            // Valider la période
            if (!in_array($period, ['today', 'week', 'month', 'year'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Période invalide'
                ], 400);
            }

            $stats = $this->statsService->getCompleteStats($boutique, $period);

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques simples pour le dashboard
     */
    public function getDashboardStats(Request $request, $boutiqueId)
    {
        try {
            $boutique = Boutique::where('id', $boutiqueId)
                              ->where('user_id', Auth::id())
                              ->firstOrFail();

            $period = $request->get('period', 'month');
            
            $viewStats = $this->statsService->getViewStats($boutique, $period);
            $chartData = $this->statsService->getViewsChartData($boutique, 30);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_views' => $viewStats['total_views'],
                    'unique_views' => $viewStats['unique_views'],
                    'growth' => $viewStats['growth'],
                    'chart_data' => $chartData
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enregistrer une vue de boutique (appelé quand quelqu'un visite la boutique)
     */
    public function recordView(Request $request, $boutiqueSlug)
    {
        try {
            $boutique = Boutique::where('slug', $boutiqueSlug)
                              ->where('is_active', true)
                              ->firstOrFail();

            $viewRecorded = $this->statsService->recordView($boutique, $request);

            return response()->json([
                'success' => true,
                'view_recorded' => $viewRecorded
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement de la vue'
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques de toutes les boutiques de l'utilisateur
     */
    public function getAllBoutiquesStats(Request $request)
    {
        try {
            $boutiques = Boutique::where('user_id', Auth::id())->get();
            $period = $request->get('period', 'month');
            
            $allStats = [];
            $totalViews = 0;
            $totalUniqueViews = 0;

            foreach ($boutiques as $boutique) {
                $stats = $this->statsService->getViewStats($boutique, $period);
                $allStats[] = [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'boutique_slug' => $boutique->slug,
                    'views' => $stats['total_views'],
                    'unique_views' => $stats['unique_views'],
                    'growth' => $stats['growth']
                ];
                
                $totalViews += $stats['total_views'];
                $totalUniqueViews += $stats['unique_views'];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'boutiques' => $allStats,
                    'totals' => [
                        'total_views' => $totalViews,
                        'total_unique_views' => $totalUniqueViews,
                        'boutiques_count' => count($boutiques)
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }
}